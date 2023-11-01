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
                                        (order.origin.geo_location.lat, order.origin.geo_location.long),
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
                                        (order.destination.geo_location.lat, order.destination.geo_location.long),
                                        (already_planned_order.origin.geo_location.lat, already_planned_order.origin.geo_location.long)).kilometers

                                    # Check if the a retrurn trip is possible
                                    if org_dest_distance < delivery_config.corridor_radius and dest_org_distance < delivery_config.corridor_radius:
                                        trip.included_orders.append(order)
                                        planned_order_ids.add(order.id)
                                        trip_found = True
                                        break

                if not trip_found:
                    # If the order cannot be placed in any existing trips, create a new trip
                    projected_trips.append(
                        ProjectedTrip(
                            vehicle=Vehicle(
                                type="default", stackable=False, max_weight=delivery_config.max_weight,
                                max_loading_meter=delivery_config.max_loading_meter),
                            included_orders=[order],
                            start_time=order.origin.timestamp,
                            trip_sections=[]))
                    planned_order_ids.add(order.id)  # Add the order ID to the set of planned orders

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
        avg_weight_utilization = total_weight / len(projected_trips)
        avg_loading_meter_utilization = total_loading_meter / len(projected_trips)

        return {"average_utl_loading_meter": avg_loading_meter_utilization, "average_utl_weight": avg_weight_utilization, "total_km": total_distance, "average_km": avg_distance, "relevant_orders": len(planned_order_ids), "num_trips": len(projected_trips), "trips": [json.loads(json.dumps(ttrip, default=self.__custom_serializer)) for ttrip in projected_trips]}
