import json
import math

from database_handler import DatabaseHandler
from models import Trip, Location, Offering, CargoOrder, CompletedTrip

from datetime import datetime
from dateutil.relativedelta import relativedelta
from typing import List

MAX_WEIGHT_PER_TRIP = 25000 #kg
MAX_LOAD_LENGTH_PER_TRIP = 13.6 #m

class TripHandler:
    def __init__(self) -> None:
        self.database_handler = DatabaseHandler()

    def get_trips_from_json(self, json_data) -> List[CompletedTrip]:

        trips = []

        for trip in json_data:

            trip_dict = json.loads(trip)
            new_trip = CompletedTrip(**trip_dict)

            # TODO: Delete temp addition of one year
            dt_object = datetime.fromtimestamp(new_trip.origin.timestamp)
            new_dt_object = dt_object + relativedelta(years=1)
            new_trip.origin.timestamp = int(new_dt_object.timestamp())

            dt_object = datetime.fromtimestamp(new_trip.destination.timestamp)
            new_dt_object = dt_object + relativedelta(years=1)
            new_trip.destination.timestamp = int(new_dt_object.timestamp())

            trips.append(new_trip)
        
        return trips

    def get_orders_from_json(self, json_data) -> List[CargoOrder]:
        cargo_orders = []

        with open('german-city-codes.json', "r") as infile:
            city_codes = json.load(infile)

        for cargo_order in json_data:
            order_dict = json.loads(cargo_order)
            new_order = CargoOrder(**order_dict)

            # If there are no geo location information but a postal code is available
            if new_order.origin.geo_location.lat is None and new_order.origin.geo_location.long is None and new_order.origin.admin_location.postal_code is not None:
                origin_geo = city_codes.get(str(new_order.origin.admin_location.postal_code))
                destination_geo = city_codes.get(str(new_order.destination.admin_location.postal_code))
                if origin_geo and destination_geo:
                    new_order.origin.geo_location.lat = origin_geo["lat"]
                    new_order.origin.geo_location.long = origin_geo["long"]
                    new_order.destination.geo_location.lat = destination_geo["lat"]
                    new_order.destination.geo_location.long = destination_geo["long"]
                else:
                    # Skip entry if no postal code match was found
                    continue

            cargo_orders.append(new_order)

        return cargo_orders



    def process_offering_data(self, json_data) -> None:

        # -- Merge single freight entries to complete truck loads --
        all_offerings:List[Offering] = []

        for offering in json_data:
            offering_dict = json.loads(offering)
            new_offering = Offering(**offering_dict)
            all_offerings.append(new_offering)
        
        # Find multiple cargo pieces on one route and day and merge them in this list
        merged_offerings:List[Offering] = []
           
        for offering in all_offerings:
            
            merged = False
            # Iterate over already merged items
            for merged_offering in merged_offerings:
                # If a entry with same timestamp, origin and destination is already in the merged list
                if (offering.origin.timestamp == merged_offering.origin.timestamp and 
                    offering.origin.zip_code == merged_offering.origin.zip_code and 
                    offering.destination.zip_code == merged_offering.destination.zip_code):

                    # If there is still cargo space (load meter and weight) in the merged entry add the values 
                    if (merged_offering.load.loading_meter + offering.load.loading_meter < MAX_LOAD_LENGTH_PER_TRIP and 
                        merged_offering.load.weight + offering.load.weight < MAX_LOAD_LENGTH_PER_TRIP):
                        merged_offering.load.loading_meter += offering.load.loading_meter
                        merged_offering.load.weight += offering.load.weight
                        merged = True
                        break  # Break out of the inner loop if a merge happens

            # Just add the entry if there is nothing to be merged
            if not merged:
                merged_offerings.append(offering)

        # TODO: Implement Europe postal codes
        with open('german-city-codes.json', "r") as infile:
            city_codes = json.load(infile)

        # Iterate over the merges trip entries to send them all to the database
        for offering in merged_offerings:
            # -- Get geo locations from zip code data
            if offering.origin.lat is None and offering.origin.long is None:

                if offering.origin.zip_code is not None:
                    # Try to look up the coordinates in the city_codes dictionary
                    location = city_codes.get(str(offering.origin.zip_code))
                    if location:
                        offering.origin.lat = location["lat"]
                        offering.origin.long = location["long"]
                    else:
                        # Skip entry if no postal code match was found
                        continue
            offering.origin.type = "origin"

            if offering.destination.lat is None and offering.destination.long is None:

                if offering.destination.zip_code is not None:
                    # Try to look up the coordinates in the city_codes dictionary
                    location = city_codes.get(str(offering.destination.zip_code))
                    if location:
                        offering.destination.lat = location["lat"]
                        offering.destination.long = location["long"]
                    else:
                        # Skip entry if no postal code match was found
                        continue
            offering.destination.type = "destination"

            origin_id = self.database_handler.add_location(offering.origin)
            destination_id = self.database_handler.add_location(offering.destination)
            
            load_meter = offering.load.loading_meter
            if not load_meter or math.isnan(load_meter):
                load_meter = 0.0

            new_offering = {
                "customer_id": offering.customer_id,
                "destination_id": destination_id,
                "origin_id": origin_id,
                "source": offering.source,
                "vehicle_id": offering.vehicle_id,
                "load_percentage": offering.load.capacity_percentage,
                "load_meter": load_meter,
                "load_weight": offering.load.weight
            }

            self.database_handler.add_offering(new_offering)
