from models import DeliveryConfig, ProjectedTrip, CargoOrder, Vehicle, TripSection
import json
from geopy.distance import geodesic

class RouteOptimizer:
    def __init__(self) -> None:
        pass

    # Custom serialization function to handle problematic floats and convert objects to dictionaries
    def __custom_serializer(self, obj):
        if isinstance(obj, float) and (obj > 1e15 or obj < -1e15):
            return str(obj)  # Convert large/small floats to strings
        return obj.__dict__  # Convert other objects to dictionaries json.loads(json.dumps(order, default=self.__custom_serializer))

    def get_optimized_routes_from_orders(self, delivery_config: DeliveryConfig, orders: list[CargoOrder]) -> list[ProjectedTrip]:
        

        planned_order_ids = set()  # Keep track of orders that have already been planned

        # --- Step 1: Filter by time and geo coordinates
        relevant_orders: list[CargoOrder] = []
        for order in orders:
            if order.origin.timestamp >= delivery_config.start_time and order.destination.timestamp <= delivery_config.end_time_incl:
                if order.origin.geo_location.lat and order.destination.geo_location.lat:
                    if order.origin.admin_location.city == "COBURG":
                        relevant_orders.append(order)

        projected_trips: list[ProjectedTrip] = [
            ProjectedTrip(
                vehicle=Vehicle(type="default", stackable=False, max_weight=delivery_config.max_weight, max_loading_meter=delivery_config.max_loading_meter),
                included_orders=[relevant_orders[0]],
                trip_sections=[])
        ]

        # --- Step 2: Fill trucks
        for order in relevant_orders:
            # Check if the order has not been planned already
            if order.id not in planned_order_ids:  
                trip_found = False
                for trip in projected_trips:
                    
                    # Check if there is weight and loading_meter capacity left
                    if (trip.get_total_weight() + order.cargo_item.weight) < trip.vehicle.max_weight:
                        
                        if order.cargo_item.loading_meter is None:
                            order.cargo_item.loading_meter = 0
                        
                        if (trip.get_total_loading_meter() + order.cargo_item.loading_meter) < trip.vehicle.max_loading_meter:
                            
                            # Check if the order is within the max waiting time
                            if (order.origin.timestamp - trip.included_orders[0].origin.timestamp) <= delivery_config.max_waiting_time:
                               
                                for already_planned_order in trip.included_orders:
                                    
                                    # Check if the order is close to the origin or destination of an already planned order
                                    org_org_distance = geodesic((order.origin.geo_location.lat, order.origin.geo_location.long), (already_planned_order.origin.geo_location.lat, already_planned_order.origin.geo_location.long)).kilometers
                                    dest_dest_distance = geodesic((order.destination.geo_location.lat, order.destination.geo_location.long), (already_planned_order.destination.geo_location.lat, already_planned_order.destination.geo_location.long)).kilometers
                 
                                    # Check if orgin and destination are close to each other
                                    if org_org_distance < 20 and dest_dest_distance < 20:
                                            trip.included_orders.append(order)
                                            planned_order_ids.add(order.id)
                                            trip_found = True
                                            break

                                origin_distance = geodesic((order.origin.geo_location.lat, order.origin.geo_location.long), (trip.included_orders[0].origin.geo_location.lat, trip.included_orders[0].origin.geo_location.long)).kilometers
                                
                                destination_distance = geodesic((order.destination.geo_location.lat, order.destination.geo_location.long), (trip.included_orders[0].destination.geo_location.lat, trip.included_orders[0].destination.geo_location.long)).kilometers
                                

                    
                if not trip_found:
                    # If the order cannot be placed in any existing trips, create a new trip
                    projected_trips.append(
                        ProjectedTrip(
                            vehicle=Vehicle(
                                type="default", stackable=False, max_weight=delivery_config.max_weight, max_loading_meter=delivery_config.max_loading_meter),
                            included_orders=[order],
                            trip_sections=[]))
                    planned_order_ids.add(order.id)  # Add the order ID to the set of planned orders

        num_orders = len(planned_order_ids)  # Number of unique orders planned
        print("number of orders planned: " + str(num_orders), flush=True)
        print("number of orders to be planned: " + str(len(relevant_orders)), flush=True)
        print(len(projected_trips), flush=True)

        
        return {"relevant_orders": len(planned_order_ids), "num_trips": len(projected_trips), "trips": [json.loads(json.dumps(ttrip, default=self.__custom_serializer)) for ttrip in projected_trips]}

