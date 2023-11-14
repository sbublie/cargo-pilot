from models import DeliveryConfig, ProjectedTrip, CargoOrder, Vehicle, Location, GeoLocation, MovingSection, SectionType, HoldingSection, CargoItem
import json
from geopy.distance import geodesic
from datetime import timedelta
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp


class RouteOptimizer:
    def __init__(self) -> None:
        pass

    # Custom serialization function to handle problematic floats and convert objects to dictionaries
    def __custom_serializer(self, obj):
        if isinstance(obj, float) and (obj > 1e15 or obj < -1e15):
            return str(obj)  # Convert large/small floats to strings
        # Convert other objects to dictionaries json.loads(json.dumps(order, default=self.__custom_serializer))
        return obj.__dict__

    def get_optimized_routes_from_orders(self, delivery_config: DeliveryConfig, orders: list[CargoOrder]) -> list[ProjectedTrip]:

        planned_order_ids = set()  # Keep track of orders that have already been planned
        orders_placed_late = 0

        # --- Step 1: Filter by time and geo coordinates
        relevant_orders: list[CargoOrder] = []
        for order in orders:
            if order.origin.timestamp >= delivery_config.start_time and order.destination.timestamp <= delivery_config.end_time_incl:
                if order.origin.geo_location.lat and order.destination.geo_location.lat:
                    relevant_orders.append(order)

        projected_trips: list[ProjectedTrip] = [
            ProjectedTrip(
                vehicle=Vehicle(
                    type="default", stackable=False, max_weight=delivery_config.max_weight, max_loading_meter=delivery_config.max_loading_meter),
                included_orders=[relevant_orders[0]],
                start_time=relevant_orders[0].origin.timestamp,
                trip_sections=[])]

        # --- Step 2: Fill trucks
        for order in relevant_orders:
            # Check if the order has not been planned already
            if order.id not in planned_order_ids:
                trip_found = False
                for trip in projected_trips:

                    # Check if there is weight left
                    if (trip.get_total_weight() + order.cargo_item.weight) < trip.vehicle.max_weight:

                        if order.cargo_item.loading_meter is None:
                            order.cargo_item.loading_meter = 0

                        # Check if there is loading meter capacity left
                        if (trip.get_total_loading_meter() + order.cargo_item.loading_meter) < trip.vehicle.max_loading_meter:

                            # Check if the order is within the max waiting time
                            if abs(order.origin.timestamp - trip.start_time) <= delivery_config.max_waiting_time:

                                for already_planned_order in trip.included_orders:

                                    # Check if the order is close to the origin or destination of an already planned order
                                    org_org_distance = geodesic(
                                        (order.origin.geo_location.lat,
                                         order.origin.geo_location.long),
                                        (already_planned_order.origin.geo_location.lat, already_planned_order.origin.geo_location.long)).kilometers
                                    dest_dest_distance = geodesic((order.destination.geo_location.lat, order.destination.geo_location.long), (
                                        already_planned_order.destination.geo_location.lat, already_planned_order.destination.geo_location.long)).kilometers

                                    # Check if orgin and destination are close to each other
                                    if org_org_distance < delivery_config.corridor_radius and dest_dest_distance < delivery_config.corridor_radius:
                                        trip.included_orders.append(order)
                                        planned_order_ids.add(order.id)
                                        trip_found = True
                                        break

                                    # Check if the origin is close to the destination of an already planned order
                                    org_dest_distance = geodesic((order.origin.geo_location.lat, order.origin.geo_location.long), (
                                        already_planned_order.destination.geo_location.lat, already_planned_order.destination.geo_location.long)).kilometers
                                    # Check if the destination is close to the origin of an already planned order
                                    dest_org_distance = geodesic(
                                        (order.destination.geo_location.lat,
                                         order.destination.geo_location.long),
                                        (already_planned_order.origin.geo_location.lat, already_planned_order.origin.geo_location.long)).kilometers

                                    # Check if the a retrurn trip is possible
                                    if org_dest_distance < delivery_config.corridor_radius and dest_org_distance < delivery_config.corridor_radius:
                                        trip.included_orders.append(order)
                                        planned_order_ids.add(order.id)
                                        trip_found = True
                                        break

                if not trip_found:
                    # If the order cannot be placed in any existing trips, create a new trip

                    # Check if there are any vehicles left
                    orders_on_the_same_day = sum(
                        1 for pt in projected_trips if pt.start_time == order.origin.timestamp)

                    if orders_on_the_same_day < delivery_config.num_trucks:
                        vehicle = Vehicle(
                            type="default",
                            stackable=False,
                            max_weight=delivery_config.max_weight,
                            max_loading_meter=delivery_config.max_loading_meter
                        )

                        new_trip = ProjectedTrip(
                            vehicle=vehicle,
                            included_orders=[order],
                            start_time=order.origin.timestamp,
                            trip_sections=[]
                        )

                        projected_trips.append(new_trip)
                        # Add the order ID to the set of planned orders
                        planned_order_ids.add(order.id)

                    else:
                        # Find the next available time slot
                        # You can adjust the time increment as needed
                        next_available_time = order.origin.timestamp + 86400
                        while any(pt.start_time == next_available_time for pt in projected_trips):
                            next_available_time += 86400

                        vehicle = Vehicle(
                            type="default",
                            stackable=False,
                            max_weight=delivery_config.max_weight,
                            max_loading_meter=delivery_config.max_loading_meter
                        )

                        new_trip = ProjectedTrip(
                            vehicle=vehicle,
                            included_orders=[order],
                            start_time=next_available_time,
                            trip_sections=[]
                        )

                        orders_placed_late += 1
                        projected_trips.append(new_trip)
                        # Add the order ID to the set of planned orders
                        planned_order_ids.add(order.id)

        # Get the total number of kilometers driven
        total_distance = 0
        for trip in projected_trips:
            for order in trip.included_orders:
                total_distance += order.get_distance()

        # Get the average kilometers driven per trip
        avg_distance = total_distance / len(projected_trips)

        # get the average utilization of the trucks
        total_loading_meter = 0
        total_weight = 0
        for trip in projected_trips:
            total_loading_meter += trip.get_weight_utilization()
            total_weight += trip.get_loading_meter_utilization()
        avg_weight_utilization = total_weight / len(projected_trips)*100
        avg_loading_meter_utilization = total_loading_meter / \
            len(projected_trips)*100

        # Get the number of orders that could not be planned
        orders_not_placed = len(relevant_orders) - len(planned_order_ids)

        # Get the percentage of orders that were one time
        orders_on_time_percentage = (
            len(relevant_orders) - orders_placed_late) / len(relevant_orders)*100

        return {"orders_not_placed": orders_not_placed, "OTD": orders_on_time_percentage, "average_utl_loading_meter": avg_loading_meter_utilization, "average_utl_weight": avg_weight_utilization, "total_km": total_distance, "average_km": avg_distance, "relevant_orders": len(planned_order_ids), "num_trips": len(projected_trips), "trips": [json.loads(json.dumps(ttrip, default=self.__custom_serializer)) for ttrip in projected_trips]}

    def compute_distance_matrix(self, locations: list[Location]):
        num_locations = len(locations)
        distance_matrix = [[0] * num_locations for _ in range(num_locations)]
        for i in range(num_locations):
            for j in range(num_locations):
                distance_matrix[i][j] = geodesic((locations[i].geo_location.lat, locations[i].geo_location.long), (
                    locations[j].geo_location.lat, locations[j].geo_location.long)).kilometers
        return distance_matrix

    def solve_vrp(self, delivery_config: DeliveryConfig, orders: list[CargoOrder]):

        # Step 1: Filter by time and geo coordinates
        relevant_orders: list[CargoOrder] = []
        for order in orders:
            if order.origin.timestamp >= delivery_config.start_time and order.destination.timestamp <= delivery_config.end_time_incl:
                if order.origin.geo_location.lat and order.destination.geo_location.lat:
                    relevant_orders.append(order)

        # Step 2: Create a list of all locations
        locations = [Location(id=0, geo_location={"lat": 50.26, "long": 10.96}, timestamp=0, admin_location={
                              "city": "COBURG DEPOT", "postal_code": "96450", "country": "DE"})]
        for order in relevant_orders:
            locations.append(order.origin)
            locations.append(order.destination)

        # Step 3: Create a list of the pickup and delivery locations
        pickup_deliveries = []
        for n in range(1, len(locations)-1, 2):
            pickup_deliveries.append([n, n+1])

        # Step 4: Create a list of all distances between locations
        distance_matrix = self.compute_distance_matrix(locations)

        # Step 5: Create list of demands
        weight_demands = [0]
        loading_meter_demands = [0]
        for order in relevant_orders:
            if getattr(order.cargo_item, 'loading_meter', None) is not None:
                weight_demands.append(round(order.cargo_item.weight, 2))
                weight_demands.append(round(-order.cargo_item.weight, 2))
                loading_meter_demands.append(
                    round(order.cargo_item.loading_meter, 2))
                loading_meter_demands.append(
                    round(-order.cargo_item.loading_meter, 2))
            else:
                print("Loading meter is None", flush=True)

        loading_meter_capacities = [
            delivery_config.max_loading_meter for i in range(delivery_config.num_trucks)]
        weight_capacities = [delivery_config.max_weight for i in range(
            delivery_config.num_trucks)]

        print(loading_meter_demands, flush=True)
        print(loading_meter_capacities, flush=True)

        # Step 6: Create data object
        data = {}
        data["distance_matrix"] = distance_matrix
        data["weight_capacities"] = weight_capacities
        data["loading_meter_capacities"] = loading_meter_capacities
        data["num_vehicles"] = delivery_config.num_trucks
        data["depot"] = 0
        data["pickup_deliveries"] = pickup_deliveries
        data["weight_demands"] = weight_demands
        data["loading_meter_demands"] = loading_meter_demands

        # Create the routing index manager.
        manager = pywrapcp.RoutingIndexManager(
            len(data["distance_matrix"]), data["num_vehicles"], data["depot"]
        )

        # Create Routing Model.
        routing = pywrapcp.RoutingModel(manager)

        # Define cost of each arc.
        def distance_callback(from_index, to_index):
            # Returns the manhattan distance between the two nodes.
            # Convert from routing variable Index to distance matrix NodeIndex.
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return data["distance_matrix"][from_node][to_node]

        transit_callback_index = routing.RegisterTransitCallback(
            distance_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

        # Add Capacity constraint.
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
            "Capacity",
        )

        # Add Loading Meter capacity constraint.
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

        # Add Distance constraint.
        dimension_name = "Distance"
        routing.AddDimension(
            transit_callback_index,
            0,  # no slack
            delivery_config.max_travel_distance,  # vehicle maximum travel distance
            True,  # start cumul to zero
            dimension_name,
        )
        distance_dimension = routing.GetDimensionOrDie(dimension_name)
        distance_dimension.SetGlobalSpanCostCoefficient(100)

        # Allow to drop nodes.
        penalty = 100000
        for node in range(1, len(data["distance_matrix"])):
            routing.AddDisjunction([manager.NodeToIndex(node)], penalty)

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

        # Setting first solution heuristic.
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PARALLEL_CHEAPEST_INSERTION
        )
        search_parameters.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        )

        search_parameters.time_limit.FromSeconds(5)

        # Solve the problem.
        solution = routing.SolveWithParameters(search_parameters)

        # Print solution on console.
        if solution:
            self.print_solution(data, manager, routing, solution, locations)
            return self.construct_solution(data, manager, routing, solution, locations)
        else:
            return {"result": "No solution found"}

    def construct_solution(self, data, manager, routing, solution, locations: list[Location]):

        trips = []
        number_trips = 0
        total_distance = 0
        for vehicle_id in range(data["num_vehicles"]):
            index = routing.Start(vehicle_id)
            vehicle = Vehicle(
                type="default", stackable=False, max_weight=data["weight_capacities"][0], max_loading_meter=data["loading_meter_capacities"][0])
            trip = ProjectedTrip(
                id=vehicle_id,
                vehicle=vehicle,
                included_orders=[],
                start_time=locations[0].timestamp,
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
                    trip.trip_sections.append(MovingSection(id=trip.num_driving_sections, section_type=SectionType.DRIVING.name, origin=locations[manager.IndexToNode(index)], destination=locations[manager.IndexToNode(
                        solution.Value(routing.NextVar(index)))], vehicle=vehicle, loaded_cargo=CargoItem(weight=current_weight, loading_meter=current_loading_meter, load_carrier=False, load_carrier_nestable=False)))
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
                    trip.trip_sections.append(MovingSection(id=trip.num_driving_sections, section_type=SectionType.DRIVING.name, origin=locations[manager.IndexToNode(index)], destination=locations[manager.IndexToNode(
                        solution.Value(routing.NextVar(index)))], vehicle=vehicle, loaded_cargo=CargoItem(weight=current_weight, loading_meter=current_loading_meter, load_carrier=False, load_carrier_nestable=False)))

                elif not vehicle_moved and not cargo_was_changed:
                    pass

                previous_index = index
                index = solution.Value(routing.NextVar(index))
                route_distance += routing.GetArcCostForVehicle(
                    previous_index, index, vehicle_id
                )

                if vehicle_moved:
                    total_loading_meter += current_loading_meter * distance
                    sum_max_loading_meter += vehicle.max_loading_meter * distance
                    total_weight += current_weight * distance
                    sum_max_weight += vehicle.max_weight * distance
                    
                
            
            if len(trip.trip_sections) > 0:    
                trip.total_loading_meter_utilization = round((total_loading_meter / sum_max_loading_meter), 2) * 100
                trip.total_weight_utilization = round((total_weight / sum_max_weight), 2) * 100

                total_distance += route_distance            
            
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

        return {"number_trips": number_trips, "total_distance": total_distance, "average_distance": avg_distance, "num_of_dropped_nodes": len(dropped_nodes), "trips": [json.loads(json.dumps(ttrip, default=self.__custom_serializer)) for ttrip in trips]}

    def print_solution(self, data, manager, routing, solution, locations: list[Location]):
        """Prints solution on console."""
        print(f"Objective: {solution.ObjectiveValue()}", flush=True)
        total_distance = 0
        total_load = 0
        
        dropped_nodes = "Dropped nodes:"
        for node in range(routing.Size()):
            if routing.IsStart(node) or routing.IsEnd(node):
                continue
            if solution.Value(routing.NextVar(node)) == node:
                dropped_nodes += f" {manager.IndexToNode(node)}"
        print(dropped_nodes, flush=True)

        for vehicle_id in range(data["num_vehicles"]):
            index = routing.Start(vehicle_id)
            plan_output = f"Route for vehicle {vehicle_id}:\n"
            route_distance = 0
            route_load = 0
            route_loading_meter = 0
            while not routing.IsEnd(index):
                node_index = manager.IndexToNode(index)
                location = locations[node_index]
                route_load += data["weight_demands"][node_index]
                route_loading_meter += data["loading_meter_demands"][node_index]
                plan_output += f" {location.admin_location.city} Loaded weight({round(route_load, 2)}) Loading Meter({route_loading_meter}) -> "
                previous_index = index
                index = solution.Value(routing.NextVar(index))
                route_distance += routing.GetArcCostForVehicle(
                    previous_index, index, vehicle_id
                )
            plan_output += f" {manager.IndexToNode(index)} Load({route_load})\n"
            plan_output += f"Distance of the route: {route_distance}km\n"
            # plan_output += f"Load of the route: {route_load}\n"
            print(plan_output, flush=True)
            total_distance += route_distance
            total_load += route_load
        print(f"Total distance of all routes: {total_distance}km", flush=True)
        print(f"Total load of all routes: {total_load}", flush=True)
