from models import DeliveryConfig, ProjectedTrip, CargoOrder, Vehicle, Location, VRPResult, MovingSection, SectionType, HoldingSection, CargoItem
import json
from geopy.distance import geodesic
from datetime import timedelta
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
from copy import deepcopy
from logging import Logger

TIME_WINDOW = 2000
KM_PER_DAY = 800
MINUTES_PER_DAY = 360
VEHICLE_LOAD_TIME = 10
VEHICLE_UNLOAD_TIME = 10
DROP_NODES_PENALTY = 1000000
SOLUTION_STRATEGY = routing_enums_pb2.FirstSolutionStrategy.PARALLEL_CHEAPEST_INSERTION
SEARCH_METAHEURISTIC = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
CALCULATION_TIME_LIMIT = 5


class RouteOptimizer:
    def __init__(self, logger: Logger) -> None:
        self.logger = logger

    # Custom serialization function to handle problematic floats and convert objects to dictionaries
    def __custom_serializer(self, obj):
        if isinstance(obj, float) and (obj > 1e15 or obj < -1e15):
            return str(obj)  # Convert large/small floats to strings
        # Convert other objects to dictionaries json.loads(json.dumps(order, default=self.__custom_serializer))
        return obj.__dict__

    def compute_time_distance_matrix(self, locations: list[Location], data):
        num_locations = len(locations)
        distance_matrix = [[0] * num_locations for _ in range(num_locations)]
        time_matrix = [[0] * num_locations for _ in range(num_locations)]
        for i in range(num_locations):
            for j in range(num_locations):
                distance = geodesic((locations[i].geo_location.lat, locations[i].geo_location.long), (
                    locations[j].geo_location.lat, locations[j].geo_location.long)).kilometers
                distance_matrix[i][j] = distance
                time_matrix[i][j] = round((distance / 80) * 60, 2)

        data["distance_matrix"] = distance_matrix
        data["time_matrix"] = time_matrix

    def solve_vrp(self, delivery_config: DeliveryConfig, orders: list[CargoOrder]):
        self.logger.debug(f"Enter {self.solve_vrp.__name__}")

        # Step 1: Filter by time and geo coordinates
        self.logger.debug(f"Step 1: Filter")
        relevant_orders: list[CargoOrder] = []
        self.logger.debug(f"Number of unsorted orders: {len(orders)}")
        for order in orders:
            if order.origin.timestamp >= delivery_config.start_time and order.destination.timestamp <= delivery_config.end_time_incl:
                if order.origin.geo_location.lat and order.destination.geo_location.lat:
                    relevant_orders.append(order)
        self.logger.debug(f"Number of sorted orders: {len(relevant_orders)}")

        # Step 2: Create a list of all locations
        self.logger.debug(f"Step 2: Location list + depot")
        locations = [Location(id=0, geo_location={"lat": 50.26, "long": 10.96}, timestamp=0, admin_location={
                              "city": "COBURG DEPOT", "postal_code": "96450", "country": "DE"})]
        for order in relevant_orders:
            locations.append(order.origin)
            locations.append(order.destination)
        self.logger.debug(f"Number of locations: {len(locations)}")

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
        self.compute_time_distance_matrix(locations, data)
        self.logger.debug(
           f"Dimensions of distance matrix: {len(data['distance_matrix'][0])}x{len(data['distance_matrix'][0])}")
        self.logger.debug(
            f"Dimensions of time matrix: {len(data['time_matrix'][0])}x{len(data['time_matrix'][0])}")

        # Step 5: Create list of demands
        self.logger.debug(f"Step 5: Demands")
        weight_demands = [0]  # 0 is the depot
        loading_meter_demands = [0]  # 0 is the depot
        time_windows = [(0, TIME_WINDOW)]
        for order in relevant_orders:
            time_windows.append((0, TIME_WINDOW))
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
        data["max_time_per_trip"] = delivery_config.days_per_trip * MINUTES_PER_DAY
        data["max_distance_per_trip"] = delivery_config.days_per_trip * KM_PER_DAY

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
                [manager.NodeToIndex(node)], DROP_NODES_PENALTY)

        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (SOLUTION_STRATEGY)
        search_parameters.local_search_metaheuristic = (SEARCH_METAHEURISTIC)
        search_parameters.time_limit.FromSeconds(CALCULATION_TIME_LIMIT)

        # Step 11: Finally solve the problem.
        self.logger.debug(f"Step 11: Solve the problem")
        solution = routing.SolveWithParameters(search_parameters)

        # Step 12: Construct the solution to return it to the frontend
        if solution:
            return self.construct_solution(data, manager, routing, solution, locations)
        else:
            return {"result": "No solution found"}

    def construct_solution(self, data, manager, routing, solution, locations: list[Location]):
        self.logger.debug(f"Enter {self.construct_solution.__name__}")
        trips = []
        number_trips = 0
        total_distance = 0
        total_driving_sections = 0
        total_time = 0

        time_dimension = routing.GetDimensionOrDie("Time")
        self.logger.debug(f"Time dimension: {time_dimension}")

        self.logger.debug(f"Iterating over vehicles/tours")
        # Iterate over vehicles because the number of vehicles is the same as the number of tours
        for vehicle_id in range(data["num_vehicles"]):
            
            index = routing.Start(vehicle_id)
            self.logger.debug(f"Vehicle {vehicle_id} starts at {index}")

            # Create new trip to be 
            vehicle = Vehicle(
                type="default", stackable=False, max_weight=data["weight_capacities"][0], max_loading_meter=data["loading_meter_capacities"][0])
            trip = ProjectedTrip(
                id=vehicle_id,
                vehicle=vehicle,
                included_orders=[],
                start_time=0,
                end_time=0,
                total_time=0,
                trip_sections=[])

            route_distance = 0

            total_weight = 0
            current_weight = 0
            sum_max_weight = 0

            total_loading_meter = 0
            current_loading_meter = 0
            sum_max_loading_meter = 0

            while not routing.IsEnd(index):

                node_index = manager.IndexToNode(index)
                self.logger.debug(f"Node index: {node_index}")

                org_time_var = time_dimension.CumulVar(index)
                dest_time_var = time_dimension.CumulVar(solution.Value(
                    routing.NextVar(index)))
                org_time = solution.Min(org_time_var)
                dest_time = solution.Min(dest_time_var)
                self.logger.debug(f"Org time: {org_time} and dest time: {dest_time}")

                distance = geodesic((locations[node_index].geo_location.lat, locations[node_index].geo_location.long), (locations[manager.IndexToNode(solution.Value(
                    routing.NextVar(index)))].geo_location.lat, locations[manager.IndexToNode(solution.Value(routing.NextVar(index)))].geo_location.long)).kilometers
                new_weight = data["weight_demands"][node_index]
                new_loading_meter = data["loading_meter_demands"][node_index]
                current_weight += new_weight
                current_loading_meter += new_loading_meter

                vehicle_moved = False
                if distance != 0:
                    vehicle_moved = True

                cargo_was_changed = False
                if new_weight != 0 or new_loading_meter != 0:
                    cargo_was_changed = True

                if vehicle_moved and cargo_was_changed:
                    trip.num_driving_sections += 1

                    origin_location = locations[manager.IndexToNode(index)]
                    destination_location = locations[manager.IndexToNode(
                        solution.Value(routing.NextVar(index)))]
                    new_origin_location = deepcopy(origin_location)
                    new_destination_location = deepcopy(destination_location)

                    new_origin_location.timestamp = org_time
                    new_destination_location.timestamp = dest_time

                    new_section = MovingSection(id=trip.num_driving_sections, section_type=SectionType.DRIVING.name, origin=new_origin_location, destination=new_destination_location,
                                                vehicle=vehicle, loaded_cargo=CargoItem(weight=current_weight, loading_meter=current_loading_meter, load_carrier=False, load_carrier_nestable=False))
                    trip.trip_sections.append(new_section)

                    trip.num_loading_sections += 1
                    trip.trip_sections.append(HoldingSection(id=trip.num_loading_sections, num_cargo_changed=1, section_type=SectionType.LOADING.name,
                                              location=locations[manager.IndexToNode(index)], duration=0, changed_weight=new_weight, changed_loading_meter=new_loading_meter))

                elif not vehicle_moved and cargo_was_changed:

                    if trip.trip_sections[-1].section_type == SectionType.DRIVING.name:
                        trip.num_loading_sections += 1
                        trip.trip_sections.append(HoldingSection(id=trip.num_loading_sections, num_cargo_changed=1, section_type=SectionType.LOADING.name,
                                                  location=locations[manager.IndexToNode(index)], duration=0, changed_weight=new_weight, changed_loading_meter=new_loading_meter))
                    else:
                        trip.trip_sections[-1].changed_weight += new_weight
                        trip.trip_sections[-1].changed_loading_meter += new_loading_meter
                        trip.trip_sections[-1].num_cargo_changed += 1

                elif vehicle_moved and not cargo_was_changed:

                    trip.num_driving_sections += 1

                    origin_location = locations[manager.IndexToNode(index)]
                    destination_location = locations[manager.IndexToNode(
                        solution.Value(routing.NextVar(index)))]
                    new_origin_location = deepcopy(origin_location)
                    new_destination_location = deepcopy(destination_location)

                    new_origin_location.timestamp = org_time
                    new_destination_location.timestamp = dest_time

                    new_section = MovingSection(id=trip.num_driving_sections, section_type=SectionType.DRIVING.name, origin=new_origin_location, destination=new_destination_location,
                                                vehicle=vehicle, loaded_cargo=CargoItem(weight=current_weight, loading_meter=current_loading_meter, load_carrier=False, load_carrier_nestable=False))

                    trip.trip_sections.append(new_section)

                elif not vehicle_moved and not cargo_was_changed:
                    pass

                index = solution.Value(routing.NextVar(index))
                self.logger.debug(f"Next index: {index}")
                route_distance += distance

                if vehicle_moved:
                    total_loading_meter += current_loading_meter * distance
                    sum_max_loading_meter += vehicle.max_loading_meter * distance
                    total_weight += current_weight * distance
                    sum_max_weight += vehicle.max_weight * distance

            if len(trip.trip_sections) > 0:
                trip.total_loading_meter_utilization = round(
                    (total_loading_meter / sum_max_loading_meter), 2) * 100
                trip.total_weight_utilization = round(
                    (total_weight / sum_max_weight), 2) * 100

                """ last_dest_time = 0
                for section in trip.trip_sections:
                    # skip the first section
                    if section.id == 0:
                        last_dest_time = section.destination.timestamp
                        print(last_dest_time, flush=True)
                    elif section.section_type == SectionType.LOADING.name:
                        section.duration = 10 * section.num_cargo_changed
                    elif section.section_type == SectionType.DRIVING.name:
                        section.origin.timestamp = last_dest_time + 10
                        section.destination.timestamp += 10
                        last_dest_time = section.destination.timestamp """

                trip.start_time = trip.trip_sections[0].origin.timestamp
                trip.end_time = trip.trip_sections[-2].destination.timestamp
                trip.total_time = trip.end_time - trip.start_time
                trip.total_distance = round(route_distance, 2)
                total_distance += round(route_distance, 2)

                for section in trip.trip_sections:
                    if section.section_type == SectionType.DRIVING.name:
                        section.weight_utilization = round(
                            section.weight_utilization, 2)
                        section.loading_meter_utilization = round(
                            section.loading_meter_utilization, 2)

                number_trips += 1
                trips.append(trip)

        avg_distance = 0
        if number_trips > 0:
            avg_distance = total_distance / number_trips

        dropped_nodes = []
        for node in range(routing.Size()):
            if routing.IsStart(node) or routing.IsEnd(node):
                continue
            if solution.Value(routing.NextVar(node)) == node:
                dropped_nodes.append(manager.IndexToNode(node))

        sum_loading_meter_utilization = 0
        sum_weight_utilization = 0

        for trip in trips:

            trip.total_loading_meter_utilization = round(
                trip.total_loading_meter_utilization, 2)
            trip.total_weight_utilization = round(
                trip.total_weight_utilization, 2)

            total_driving_sections += trip.num_driving_sections
            sum_loading_meter_utilization += trip.total_loading_meter_utilization
            sum_weight_utilization += trip.total_weight_utilization

        avg_loading_utilization = round(
            sum_loading_meter_utilization / len(trips), 2)
        avg_weight_utilization = round(sum_weight_utilization / len(trips), 2)

        # Get number of cargo orders by the number of nodes and subtract the number of depot nodes (two per trip)
        number_of_cargo_orders = int((routing.Size() / 2) - (number_trips / 2))

        vrp_result = VRPResult(number_of_trips=number_trips, 
                                number_of_orders=number_of_cargo_orders, 
                                number_of_driving_sections=total_driving_sections,
                                number_of_undelivered_orders=len(dropped_nodes) / 2,
                                total_distance=round(total_distance, 2),
                                average_distance_per_trip=round(avg_distance, 2), 
                                average_loading_meter_utilization=avg_loading_utilization, 
                                average_weight_utilization=avg_weight_utilization, 
                                trips=[json.loads(json.dumps(ttrip, default=self.__custom_serializer)) for ttrip in trips])

        return json.loads(json.dumps(vrp_result, default=self.__custom_serializer))

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
                time_window[0], time_window[1])
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
        self.logger.debug(f"Enter {self.set_loading_meter_constraint.__name__}")
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
