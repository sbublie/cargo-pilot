import json

from database_handler import DatabaseHandler
from models import Trip, Location

class TripHandler:
    def __init__(self) -> None:
        self.database_handler = DatabaseHandler()

    def process_trip_data(self, json_data) -> None:

        for trip in json_data:
            
            trip_dict = json.loads(trip)
            trip_obj = Trip(**trip_dict)

            origin_location = Location(lat=trip_obj.origin.lat, long=trip_obj.origin.long, type="origin", timestamp=trip_obj.origin.timestamp)
            origin_id = self.database_handler.add_location(origin_location)
            
            destination_location = Location(lat=trip_obj.destination.lat, long=trip_obj.destination.long, type="destination", timestamp=trip_obj.destination.timestamp)
            destination_id = self.database_handler.add_location(destination_location)
            
            trip_obj.origin_id = origin_id
            trip_obj.destination_id = destination_id

            self.database_handler.add_trip(trip_obj)


    

