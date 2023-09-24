import json
import time
import math

from database_handler import DatabaseHandler
from models import Trip, Location, Offering
import pgeocode


# Initialize the Nominatim geocoder
nomi = pgeocode.Nominatim('de')


class TripHandler:
    def __init__(self) -> None:
        self.database_handler = DatabaseHandler()

    def process_trip_data(self, json_data) -> None:

        for trip in json_data:

            trip_dict = json.loads(trip)
            trip_obj = Trip(**trip_dict)

            origin_location = Location(lat=trip_obj.origin.lat, long=trip_obj.origin.long, type="origin", timestamp=trip_obj.origin.timestamp)
            origin_id = self.database_handler.add_location(origin_location)

            destination_location = Location(lat=trip_obj.destination.lat, long=trip_obj.destination.long,
                                            type="destination", timestamp=trip_obj.destination.timestamp)
            destination_id = self.database_handler.add_location(destination_location)

            trip_obj.origin_id = origin_id
            trip_obj.destination_id = destination_id

            self.database_handler.add_trip(trip_obj)

    def process_offering_data(self, json_data) -> None:

        # TODO: Implement Europe postal codes
        with open('german-city-codes.json', "r") as infile:
            city_codes = json.load(infile)

        for offering in json_data:
            offering_dict = json.loads(offering)

            origin_lat = offering_dict['origin']['lat']
            origin_long = offering_dict['origin']['long']

            if origin_lat is None and origin_long is None:

                origin_post_code = offering_dict['origin']['zip_code']

                if origin_post_code is not None:

                    location = city_codes.get(str(origin_post_code))
                    if location:
                        origin_lat = location["lat"]
                        origin_long = location["long"]
                    else:
                        # Skip entry if no postal code match was found
                        continue

            origin_location = Location(
                lat=origin_lat, long=origin_long, street=offering_dict['origin']['street'],
                zip_code=origin_post_code,
                city=offering_dict['origin']['city'],
                country=offering_dict['origin']['country'],
                timestamp=offering_dict['origin']['timestamp'],
                type="origin")

            destination_lat = offering_dict['destination']['lat']
            destination_long = offering_dict['destination']['long']

            # Check if destination_lat and destination_long are None
            if destination_lat is None and destination_long is None:
                # Get the postal code from the offering_dict
                destination_post_code = offering_dict['destination']['zip_code']

                # Check if destination_post_code is not None
                if destination_post_code is not None:
                    # Try to look up the coordinates in the city_codes dictionary
                    location = city_codes.get(str(destination_post_code))
                    if location:
                        destination_lat = location["lat"]
                        destination_long = location["long"]
                    else:
                        continue

            destination_location = Location(
                lat=destination_lat, long=destination_long, street=offering_dict['destination']['street'],
                zip_code=destination_post_code,
                city=offering_dict['destination']['city'],
                country=offering_dict['destination']['country'],
                timestamp=offering_dict['destination']['timestamp'],
                type="destination")

            origin_id = self.database_handler.add_location(origin_location)
            destination_id = self.database_handler.add_location(destination_location)

            load_meter = offering_dict['load']['loading_meter']
            if not load_meter or math.isnan(load_meter):
                load_meter = 0.0

            
            customer_id = offering_dict.get('customer_id')
            vehicle_id = offering_dict.get('vehicle_id')

            offering = {
                "customer_id": customer_id,
                "destination_id": destination_id,
                "origin_id": origin_id,
                "source": offering_dict['source'],
                "vehicle_id": vehicle_id,
                "load_percentage": offering_dict['load']['capacity_percentage'],
                "load_meter": load_meter,
                "load_weight": offering_dict['load']['weight']
            }

            self.database_handler.add_offering(offering)
