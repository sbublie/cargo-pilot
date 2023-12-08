from models import DeliveryConfig, ProjectedTrip, CargoOrder, Vehicle, Location, VRPResult, MovingSection, SectionType, HoldingSection, CargoItem, CustomEncoder
import json
from geopy.distance import geodesic
from datetime import timedelta, datetime
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
from copy import deepcopy
from logging import Logger
from dataclasses import asdict
from typing import List

MAX_DELIVERY_DAYS = 3
AVG_SPEED = 80
VEHICLE_LOAD_TIME = 10
VEHICLE_UNLOAD_TIME = 10
DEPOT_LOCATION = Location(id=0, geo_location={"lat": 50.26, "long": 10.96}, timestamp=0, admin_location={
    "city": "COBURG DEPOT", "postal_code": "96450", "country": "DE"})
DROP_NODES_PENALTY = 1000000
SOLUTION_STRATEGY = routing_enums_pb2.FirstSolutionStrategy.PARALLEL_CHEAPEST_INSERTION
SEARCH_METAHEURISTIC = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
CALCULATION_TIME_LIMIT = 5

class RouteOptimizer:
    def __init__(self, logger: Logger) -> None:
        self.logger = logger
        self.dropped_orders = []

    def compute_time_distance_matrix(self, locations: list[Location], data):
        num_locations = len(locations)
        distance_matrix = [[0] * num_locations for _ in range(num_locations)]
        time_matrix = [[0] * num_locations for _ in range(num_locations)]
        for i in range(num_locations):
            for j in range(num_locations):
                distance = geodesic((locations[i].geo_location.lat, locations[i].geo_location.long), (
                    locations[j].geo_location.lat, locations[j].geo_location.long)).kilometers
                distance_matrix[i][j] = distance
                time_matrix[i][j] = round((distance / AVG_SPEED) * 60, 2)

        data["distance_matrix"] = distance_matrix
        data["time_matrix"] = time_matrix

    def compute_time_distance_matrix_last_stop_limit(self, locations: list[Location], data, delivery_config: DeliveryConfig):
        num_locations = len(locations)
        distance_matrix = [[0] * num_locations for _ in range(num_locations)]
        time_matrix = [[0] * num_locations for _ in range(num_locations)]
        for i in range(num_locations):
            for j in range(num_locations):
                distance = geodesic((locations[i].geo_location.lat, locations[i].geo_location.long), (
                    locations[j].geo_location.lat, locations[j].geo_location.long)).kilometers
                time_matrix[i][j] = round((distance / AVG_SPEED) * 60, 2)
                distance_matrix[0][j] = delivery_config.last_stop_limit_distance

        data["distance_matrix"] = distance_matrix
        data["time_matrix"] = time_matrix

    def filter_orders(self, delivery_config: DeliveryConfig, orders: list[CargoOrder]):
        relevant_orders: list[CargoOrder] = []
        for order in orders:
            if order.origin.timestamp >= delivery_config.start_time and order.destination.timestamp <= delivery_config.end_time_incl:
                if order.origin.geo_location.lat and order.destination.geo_location.lat:
                    relevant_orders.append(order)
        return relevant_orders

    def get_all_locations(self, orders: list[CargoOrder]):
        self.node_map = {}
        locations = [DEPOT_LOCATION]
        for order_index, order in enumerate(orders):
            self.node_map[len(locations)] = order.id
            locations.append(order.origin)
            self.node_map[len(locations)] = order.id
            locations.append(order.destination)
        #self.logger.debug(f"Node map: {self.node_map}")
        return locations

    def get_vrp_result(self, delivery_config: DeliveryConfig, orders: list[CargoOrder]):

        # Step 1: Filter by time and geo coordinates
        self.logger.debug(f"Step 1: Filter")
        relevant_orders = self.filter_orders(delivery_config, orders)
        self.logger.debug(f"Number of sorted orders: {len(relevant_orders)}")

        self.logger.debug(f"Sorting orders by timestamp")
        timestamps = []
        for index, relevant_order in enumerate(relevant_orders):
            relevant_order.id = index
            timestamps.append(relevant_order.origin.timestamp)

        timestamps = list(set(timestamps))
        timestamps.sort()
        self.logger.debug(f"Timestamps found: {timestamps}")

        waiting_time_days = 1
        if delivery_config.waiting_time_days > 1:
            waiting_time_days = delivery_config.waiting_time_days
        
        grouped_timestamps = [timestamps[i:i + waiting_time_days] for i in range(0, len(timestamps), waiting_time_days)]

        self.logger.debug(f"Number of grouped timestamps: {len(grouped_timestamps)}")
        number_runs = 1
        projected_trips:List[ProjectedTrip] = []

        for waiting_time_group in grouped_timestamps:
            self.logger.debug(f"Starting run for waiting time group {waiting_time_group}")
            first_run_orders = []
            for relevant_order in relevant_orders:
                for timestamp in waiting_time_group:
                    if relevant_order.origin.timestamp == timestamp:
                        first_run_orders.append(relevant_order)

            self.logger.debug(f"Number of orders in this run: {len(first_run_orders)}")

            # Step 2: Create a list of all locations
            self.logger.debug(f"Step 2: Location list + depot")
            locations = self.get_all_locations(first_run_orders)
            self.logger.debug(f"Number of locations: {len(locations)}")

            start_time_this_run = 0
            if delivery_config.waiting_time_days >= 1:
                start_time_this_run = int((waiting_time_group[-1] - delivery_config.start_time) / 60) + 1440
            projected_trips += self.solve_vrp(delivery_config=delivery_config, locations=locations, relevant_orders=first_run_orders, time_offset=start_time_this_run)
            self.logger.debug(f"Dropped orders first run: {self.dropped_orders}")
            
            if delivery_config.reuse_trucks:
                while len(self.dropped_orders) > 0 and len(projected_trips) > 0:
                    number_runs += 1
                    self.logger.debug(f"Starting run {number_runs}")
                    end_times = [trip.end_time for trip in projected_trips if trip.end_time]
                    new_start_time = max(end_times)
                    
                    second_relevant_orders = [ order for index, order in enumerate(orders) if order.id in self.dropped_orders]
                    second_locations = self.get_all_locations(second_relevant_orders)
                    
                    before_dropped_orders = self.dropped_orders.copy()
                    new_trips =self.solve_vrp(delivery_config=delivery_config, locations=second_locations, relevant_orders=second_relevant_orders, time_offset=new_start_time)

                    if len(self.dropped_orders) == len(before_dropped_orders):
                        self.logger.debug(f"Number of dropped orders did not change. Stopping.")
                        break
                    if len(new_trips) == 0:
                        break
                    if len(new_trips) == 1 and len(new_trips[0].trip_sections) == 0:
                        break

                    self.logger.debug(f"Adding {len(new_trips)} new trips from run {number_runs}")
                    projected_trips += new_trips
                    self.logger.debug(f"Dropped orders after run {number_runs}: {self.dropped_orders}")
        
        self.logger.debug(f"Creating result with total number of trips: {len(projected_trips)}")
        
        for index, trip in enumerate(projected_trips):
            trip.id = index
        
        result = VRPResult(trips=projected_trips, number_of_orders=len(relevant_orders), start_timestamp=delivery_config.start_time, number_of_tour_starts=number_runs , number_of_undelivered_orders=len(self.dropped_orders))
        return result


    def solve_vrp(self, delivery_config: DeliveryConfig, locations: list[Location], relevant_orders: list[CargoOrder], time_offset: int) -> list[ProjectedTrip]:
        self.logger.debug(f"Enter {self.solve_vrp.__name__}")

        # Step 3: Create a list of the pickup and delivery locations
        self.logger.debug(f"Step 3: Pickup and delivery locations")
        pickup_deliveries = []
        # Iterate over all locations except the depot and add the respective pickup and delivery locations
        for n in range(1, len(locations)-1, 2):
            pickup_deliveries.append([n, n+1])
        self.logger.debug(
            f"Number of pickup and delivery locations: {len(pickup_deliveries)}")

        # Step 4: Create a list of all distances between locations
        data = {}
        self.logger.debug(f"Step 4: Distance and time matrix")
        if delivery_config.last_stop_limit_active:
            self.compute_time_distance_matrix_last_stop_limit(locations=locations, data=data, delivery_config=delivery_config)
        else:
            self.compute_time_distance_matrix(locations=locations, data=data)
        self.logger.debug(
            f"Dimensions of distance matrix: {len(data['distance_matrix'][0])}x{len(data['distance_matrix'][0])}")
        self.logger.debug(
            f"Dimensions of time matrix: {len(data['time_matrix'][0])}x{len(data['time_matrix'][0])}")

        # Step 5: Create list of demands
        self.logger.debug(f"Step 5: Demands")
        weight_demands = [0]  # 0 is the depot
        loading_meter_demands = [0]  # 0 is the depot

        end_times = [order.destination.timestamp for order in relevant_orders]
        
        start_time = 0
        end_time_ts = datetime.fromtimestamp(max(end_times)) + timedelta(days=MAX_DELIVERY_DAYS)
        end_time = int((end_time_ts.timestamp() - delivery_config.start_time) / 60 )
        time_windows = [(start_time, end_time)]
        self.logger.debug(f"Time window: {time_windows}")

        for order in relevant_orders:
            start_time = int((order.origin.timestamp - delivery_config.start_time) / 60)
            end_time_ts = datetime.fromtimestamp(order.destination.timestamp) + timedelta(days=MAX_DELIVERY_DAYS)
            end_time = int((end_time_ts.timestamp() - delivery_config.start_time) / 60)
            #self.logger.debug(f"Start time: {start_time} and end time: {end_time}")
            time_windows.append((start_time, end_time))
            if getattr(order.cargo_item, 'loading_meter', None) is not None:
                weight_demands.append(round(order.cargo_item.weight, 2))
                weight_demands.append(round(-order.cargo_item.weight, 2))
                loading_meter_demands.append(
                    round(order.cargo_item.loading_meter, 2))
                loading_meter_demands.append(
                    round(-order.cargo_item.loading_meter, 2))
            else:
                weight_demands.append(round(order.cargo_item.weight, 2))
                weight_demands.append(round(-order.cargo_item.weight, 2))
                loading_meter_demands.append(0)
                loading_meter_demands.append(0)
                self.logger.warning(
                    f"Loading meter is None for order {order.id}")
        self.logger.debug(f"Number of demands: {len(weight_demands)}")
        self.logger.debug(
            f"Number of loading meter demands: {len(loading_meter_demands)}")
        self.logger.debug(f"Number of time windows: {len(time_windows)}")

        # Step 6: Create capacities for the vehicles
        self.logger.debug(f"Step 6: Capacities")
        loading_meter_capacities = [
            delivery_config.max_loading_meter for i in range(delivery_config.num_trucks)]
        weight_capacities = [delivery_config.max_weight for i in range(
            delivery_config.num_trucks)]
        self.logger.debug(
            f"Number of loading meter capacities: {len(loading_meter_capacities)}")
        self.logger.debug(
            f"Number of weight capacities: {len(weight_capacities)}")

        # Step 7: Create data object
        self.logger.debug(f"Step 7: Data object")
        data["weight_capacities"] = weight_capacities
        data["loading_meter_capacities"] = loading_meter_capacities
        data["time_windows"] = time_windows
        data["vehicle_load_time"] = VEHICLE_LOAD_TIME
        data["vehicle_unload_time"] = VEHICLE_UNLOAD_TIME
        data["num_vehicles"] = delivery_config.num_trucks
        data["depot"] = 0
        data["depot_capacity"] = 100
        data["pickup_deliveries"] = pickup_deliveries
        data["weight_demands"] = weight_demands
        data["loading_meter_demands"] = loading_meter_demands
        data["max_time_per_trip"] = delivery_config.days_per_trip * delivery_config.min_per_day
        if delivery_config.last_stop_limit_active:
            data["max_distance_per_trip"] = delivery_config.last_stop_limit
        else:
            data["max_distance_per_trip"] = delivery_config.days_per_trip * delivery_config.km_per_day

        # Step 8: Create the routing index manager and Routing Model.
        self.logger.debug(f"Step 8: Routing index manager and model")
        manager = pywrapcp.RoutingIndexManager(
            len(data["distance_matrix"]), data["num_vehicles"], data["depot"]
        )
        routing = pywrapcp.RoutingModel(manager)

        # Step 9: Set up the search constraints
        # Create and register a distance constraint dimension
        self.logger.debug(f"Step 9: Set up the search constraints")
        self.set_distance_constraint(data, manager, routing)

        # Create and register a time constraint dimension
        self.set_time_constraint(data, manager, routing)

        # Create and register a weight constraint dimension
        self.set_weight_constraint(data, manager, routing)

        # Create and register a loading meter constraint dimension
        self.set_loading_meter_constraint(data, manager, routing)

        

        # Step 10: Set up the search parameters
        # Allow to drop nodes.
        self.logger.debug(f"Step 10: Set up the search parameters")
        for node in range(1, len(data["distance_matrix"])):
            routing.AddDisjunction(
                [manager.NodeToIndex(node)], delivery_config.penalty_for_dropping_nodes)

        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (SOLUTION_STRATEGY)
        search_parameters.local_search_metaheuristic = (SEARCH_METAHEURISTIC)
        search_parameters.time_limit.FromSeconds(delivery_config.calculation_time_limit)



        # Step 11: Finally solve the problem.
        self.logger.debug(f"Step 11: Solve the problem")
        solution = routing.SolveWithParameters(search_parameters)

        # Step 12: Construct the solution to return it to the frontend
        if solution:
            self.logger.debug("Solution found.")
            trips = self.get_trips_from_solution(
                data, manager, routing, solution, locations, time_offset)
            self.logger.debug(f"Number of trips: {len(trips)}")
            return trips

        else:
            self.logger.error("No solution found.")
            return {"result": "No solution found"}

    def get_trips_from_solution(self, data, manager, routing, solution, locations: list[Location], time_offset):
        self.logger.debug(f"Enter {self.get_trips_from_solution.__name__}")
        trips = []

        time_dimension = routing.GetDimensionOrDie("Time")
        for vehicle_id in range(data["num_vehicles"]):
            #self.logger.debug(f"Creating trip for vehicle {vehicle_id} starting at {routing.Start(vehicle_id)}")
            index = routing.Start(vehicle_id)

            vehicle = Vehicle(
                type="default", stackable=False, max_weight=data["weight_capacities"][0], max_loading_meter=data["loading_meter_capacities"][0])
            trip = ProjectedTrip(id=vehicle_id, vehicle=vehicle)

            current_weight = 0
            current_loading_meter = 0

            while not routing.IsEnd(index):

                node_index = manager.IndexToNode(index)
                #self.logger.debug(f"Adding node to trip: {node_index}")

                org_time_var = time_dimension.CumulVar(index)
                dest_time_var = time_dimension.CumulVar(solution.Value(
                    routing.NextVar(index)))
                org_time = solution.Min(org_time_var) + time_offset
                dest_time = solution.Min(dest_time_var) + time_offset
                #self.logger.debug(
                #    f"Org time: {org_time} and dest time: {dest_time}")

                distance = geodesic((locations[node_index].geo_location.lat, locations[node_index].geo_location.long), (locations[manager.IndexToNode(solution.Value(
                    routing.NextVar(index)))].geo_location.lat, locations[manager.IndexToNode(solution.Value(routing.NextVar(index)))].geo_location.long)).kilometers
                #self.logger.debug(f"Distance: {distance}")
                new_weight = data["weight_demands"][node_index]
                #self.logger.debug(f"New weight: {new_weight}")
                new_loading_meter = data["loading_meter_demands"][node_index]
                #self.logger.debug(f"New loading meter: {new_loading_meter}")
                current_weight += new_weight
                current_loading_meter += new_loading_meter

                vehicle_moved = False
                if distance != 0:
                    vehicle_moved = True

                cargo_was_changed = False
                if new_weight != 0 or new_loading_meter != 0:
                    cargo_was_changed = True

                if vehicle_moved and cargo_was_changed:
                    #self.logger.debug(f"Case 1: Vehicle moved and cargo was changed")
                    origin_location = locations[manager.IndexToNode(index)]
                    destination_location = locations[manager.IndexToNode(
                        solution.Value(routing.NextVar(index)))]
                    new_origin_location = deepcopy(origin_location)
                    new_destination_location = deepcopy(destination_location)

                    new_origin_location.timestamp = org_time
                    new_destination_location.timestamp = dest_time

                    new_section = MovingSection(id=trip.number_of_driving_sections, section_type=SectionType.DRIVING.name, origin=new_origin_location, destination=new_destination_location,
                                                vehicle=vehicle, loaded_cargo=CargoItem(weight=current_weight, loading_meter=current_loading_meter, load_carrier=False, load_carrier_nestable=False))
                    trip.trip_sections.append(new_section)

                    trip.trip_sections.append(HoldingSection(id=trip.number_of_loading_sections, num_cargo_changed=1, section_type=SectionType.LOADING.name,
                                              location=locations[manager.IndexToNode(index)], duration=0, changed_weight=new_weight, changed_loading_meter=new_loading_meter))

                elif not vehicle_moved and cargo_was_changed:
                    #self.logger.debug(f"Case 2: Vehicle did not move but cargo was changed")
                    if trip.trip_sections[-1].section_type == SectionType.DRIVING.name:
                        trip.trip_sections.append(HoldingSection(id=trip.number_of_loading_sections, num_cargo_changed=1, section_type=SectionType.LOADING.name,
                                                  location=locations[manager.IndexToNode(index)], duration=0, changed_weight=new_weight, changed_loading_meter=new_loading_meter))
                    else:
                        trip.trip_sections[-1].changed_weight += new_weight
                        trip.trip_sections[-1].changed_loading_meter += new_loading_meter
                        trip.trip_sections[-1].num_cargo_changed += 1

                elif vehicle_moved and not cargo_was_changed:
                    #self.logger.debug(f"Case 3: Vehicle moved but cargo was not changed")
                    origin_location = locations[manager.IndexToNode(index)]
                    destination_location = locations[manager.IndexToNode(
                        solution.Value(routing.NextVar(index)))]
                    new_origin_location = deepcopy(origin_location)
                    new_destination_location = deepcopy(destination_location)

                    new_origin_location.timestamp = org_time
                    new_destination_location.timestamp = dest_time

                    new_section = MovingSection(id=trip.number_of_driving_sections, section_type=SectionType.DRIVING.name, origin=new_origin_location, destination=new_destination_location,
                                                vehicle=vehicle, loaded_cargo=CargoItem(weight=current_weight, loading_meter=current_loading_meter, load_carrier=False, load_carrier_nestable=False))

                    trip.trip_sections.append(new_section)

                elif not vehicle_moved and not cargo_was_changed:
                    #self.logger.debug(f"Case 4: Vehicle did not move and cargo was not changed")
                    pass

                index = solution.Value(routing.NextVar(index))
                #self.logger.debug(f"Next index: {index}")

            if len(trip.trip_sections) > 0:
                trips.append(trip)
        
        self.dropped_orders.clear()
        for node in range(routing.Size()):
            if routing.IsStart(node) or routing.IsEnd(node):
                continue
            if solution.Value(routing.NextVar(node)) == node:
                order = self.node_map[manager.IndexToNode(node)]
                #self.logger.debug(f"node {node} was dropped")
                
                self.dropped_orders.append(order)

        filtered_list = list(set(self.dropped_orders))
        self.dropped_orders = filtered_list

        return trips


    def set_distance_constraint(self, data, manager, routing):
        self.logger.debug(f"Enter {self.set_distance_constraint.__name__}")

        def distance_callback(from_index, to_index):
            # Convert from routing variable Index to distance matrix NodeIndex.
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return data["distance_matrix"][from_node][to_node]

        distance_callback_index = routing.RegisterTransitCallback(
            distance_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(distance_callback_index)

        # Add Distance constraint.
        dimension_name = "Distance"
        routing.AddDimension(
            distance_callback_index,
            0,  # no slack
            data["max_distance_per_trip"],  # vehicle maximum travel distance
            True,  # start cumul to zero
            dimension_name,
        )
        distance_dimension = routing.GetDimensionOrDie(dimension_name)
        distance_dimension.SetGlobalSpanCostCoefficient(100)

        # Define Transportation Requests.
        for request in data["pickup_deliveries"]:
            pickup_index = manager.NodeToIndex(request[0])
            delivery_index = manager.NodeToIndex(request[1])
            routing.AddPickupAndDelivery(pickup_index, delivery_index)
            routing.solver().Add(
                routing.VehicleVar(
                    pickup_index) == routing.VehicleVar(delivery_index)
            )
            routing.solver().Add(
                distance_dimension.CumulVar(pickup_index)
                <= distance_dimension.CumulVar(delivery_index)
            )

    def set_time_constraint(self, data, manager, routing):
        self.logger.debug(f"Enter {self.set_time_constraint.__name__}")

        def time_callback(from_index, to_index):
            """Returns the travel time between the two nodes."""
            # Convert from routing variable Index to time matrix NodeIndex.
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return data["time_matrix"][from_node][to_node]

        time_callback_index = routing.RegisterTransitCallback(time_callback)

        #  # Define cost of each arc.
        routing.SetArcCostEvaluatorOfAllVehicles(time_callback_index)

        # Add Time Windows constraint.
        time = "Time"
        routing.AddDimension(
            time_callback_index,
            60,  # allow waiting time
            data["max_time_per_trip"],  # maximum time per vehicle
            False,  # Don't force start cumul to zero.
            time,
        )
        time_dimension = routing.GetDimensionOrDie(time)

        # Add time window constraints for each location except depot.
        for location_idx, time_window in enumerate(data["time_windows"]):
            if location_idx == 0:
                continue
            index = manager.NodeToIndex(location_idx)
            time_dimension.CumulVar(index).SetRange(
                0, time_window[1])
        # Add time window constraints for each vehicle start node.
        for vehicle_id in range(data["num_vehicles"]):
            index = routing.Start(vehicle_id)
            time_dimension.CumulVar(index).SetRange(
                data["time_windows"][0][0], data["time_windows"][0][1]
            )

        # Instantiate route start and end times to produce feasible times.
        for i in range(data["num_vehicles"]):
            routing.AddVariableMinimizedByFinalizer(
                time_dimension.CumulVar(routing.Start(i))
            )
            routing.AddVariableMinimizedByFinalizer(
                time_dimension.CumulVar(routing.End(i)))

    def set_weight_constraint(self, data, manager, routing):
        self.logger.debug(f"Enter {self.set_weight_constraint.__name__}")

        def weight_demand_callback(from_index):
            # Returns the demand of the node.
            # Convert from routing variable Index to demands NodeIndex.
            from_node = manager.IndexToNode(from_index)
            return data["weight_demands"][from_node]

        weight_demand_callback_index = routing.RegisterUnaryTransitCallback(
            weight_demand_callback)

        routing.AddDimensionWithVehicleCapacity(
            weight_demand_callback_index,
            0,  # null capacity slack
            data["weight_capacities"],  # vehicle maximum capacities
            True,  # start cumul to zero
            "Weight Capacity",
        )

    def set_loading_meter_constraint(self, data, manager, routing):
        self.logger.debug(
            f"Enter {self.set_loading_meter_constraint.__name__}")

        def loading_meter_capacity_callback(from_index):
            # Returns the capacity of the node.
            # Convert from routing variable Index to demands NodeIndex.
            from_node = manager.IndexToNode(from_index)
            return data["loading_meter_demands"][from_node]

        loading_meter_capacity_callback_index = routing.RegisterUnaryTransitCallback(
            loading_meter_capacity_callback)
        routing.AddDimensionWithVehicleCapacity(
            loading_meter_capacity_callback_index,
            0,  # null capacity slack
            data["loading_meter_capacities"],  # vehicle maximum capacities
            True,  # start cumul to zero
            "Loading Meter Capacity",
        )

