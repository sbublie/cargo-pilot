from models import Location, CompletedTrip, Cluster, CargoOrder
import requests
import json


class DatabaseHandler:

    def __init__(self) -> None:
        self.BASE_URL = "http://cp-db:5000"

    def add_location(self, location: Location) -> int:
        # Convert the Location object to a dict and send it to the DB server
        location_dict = vars(location)
        response = requests.post(self.BASE_URL + "/locations",
                                 json=location_dict)
        if response.status_code == 201:
            return response.json()['id']
        else:
            print('Failed to send location to database: ', response.status_code, response.text)
            return None

    def add_offering(self, offering):
        response = requests.post(self.BASE_URL + "/offerings",
                                 json=offering)

        if response.status_code == 201:
            return response.text
        else:
            print('Failed to send offering to database: ', response.status_code, response.text)
            return None

    def get_locations(self) -> list[Location]:
        response = requests.get(self.BASE_URL + "/locations")
        locations = []
        try:
            data = response.json()
            locations = [Location(**location) for location in data]
        except (ValueError, KeyError):
            print("Error: Unable to parse JSON response or missing key in the JSON data.")
        return locations

    def get_offerings(self):
        response = requests.get(self.BASE_URL + "/offerings")
        return response.json()

    # Custom serialization function to handle problematic floats and convert objects to dictionaries
    def __custom_serializer(self, obj):
        if isinstance(obj, float) and (obj > 1e15 or obj < -1e15):
            return str(obj)  # Convert large/small floats to strings
        return obj.__dict__  # Convert other objects to dictionaries

    def add_trips_to_db(self, trips: list[CompletedTrip]):

        for trip in trips:
            response = requests.post(self.BASE_URL + "/trips", json=json.loads(json.dumps(trip, default=self.__custom_serializer)))
            if response.status_code == 201:
                print(f"Trips added to data base!")
            else:
                print('Failed to send trip to database: ', response.status_code, response.text)

    def add_clusters(self, clusters: list[Cluster]):
        for cluster in clusters:
            new_cluster = {"center_lat": cluster.center_lat, "center_long": cluster.center_long, "location_ids": cluster.location_ids}
            response = requests.post(self.BASE_URL + "/clusters", json=new_cluster)

    def add_cargo_orders_to_db(self, cargo_orders: list[CargoOrder]):

        url = self.BASE_URL + "/cargo-orders"
        for cargo_order in cargo_orders:

            response = requests.post(url=url, json=json.loads(json.dumps(cargo_order, default=self.__custom_serializer)))

            if response.status_code == 201:
                print(f"Cargo orders added to data base!")
            else:
                print(f"Failed to upload chunk! Status code: {response.status_code}, {response.text}")
