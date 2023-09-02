import json

from database_handler import DatabaseHandler
from models import Trip, Location, Offering
from geopy.geocoders import Nominatim

# Initialize the Nominatim geocoder
geolocator = Nominatim(user_agent="geoapiExercises")

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

        for offering in json_data:
            
            offering_dict = json.loads(offering)

            lat = offering_dict['origin']['lat']
            long = offering_dict['origin']['long']

            if lat is None and long is None and offering_dict['origin']['post_code'] is not None:
                lat, long = self.__get_location_from_zip_code(offering_dict['origin']['post_code'], offering_dict['origin']['country_code'])

            origin_location = {
                "lat": lat,
                "long": long,
                "street": offering_dict['origin']['street'],
                "zip_code": offering_dict['origin']['post_code'],
                "city": offering_dict['origin']['city'],
                "country": offering_dict['origin']['country_code'],
                "timestamp": offering_dict['origin']['timestamp'],
                "type": "origin"
            }

            lat = offering_dict['destination']['lat']
            long = offering_dict['destination']['long']

            if lat is None and long is None and offering_dict['origin']['post_code'] is not None:
                lat, long = self.__get_location_from_zip_code(offering_dict['origin']['post_code'], offering_dict['origin']['country_code'])

            destination_location = {
                "lat": lat,
                "long": long,
                "street": offering_dict['destination']['street'],
                "zip_code": offering_dict['destination']['post_code'],
                "city": offering_dict['destination']['city'],
                "country": offering_dict['destination']['country_code'],
                "timestamp": offering_dict['destination']['timestamp'],
                "type": "destination"
            }
            print(origin_location)
            print(destination_location)
            #origin_id = self.database_handler.add_location(origin_location)
            #destination_id = self.database_handler.add_location(destination_location)

            offering = {
                "customer": offering_dict['customer_id'],
                #"destination_id": destination_id,
                #"origin_id": origin_id,
                "source": offering_dict['source'],
                "vehicle": offering_dict['vehicle_id'],
                "load_percentage": offering_dict['load']['capacity_percentage'],
                "load_meter": offering_dict['load']['loading_meter'],
                "load_weight": offering_dict['load']['weight']
            }

            #self.database_handler.add_offering(offering)

    def __get_location_from_zip_code(self, zip_code, country):
        try:
            # Use the geocoder to get location information for the zip code
            location = geolocator.geocode({"postalcode": zip_code, "country": country})
            
            if location:
                # Extract latitude and longitude
                latitude = location.latitude
                longitude = location.longitude
                return latitude, longitude
            else:
                return None, None  # Location not found for the zip code
        except Exception as e:
            print(f"Error: {e}")
            return None, None