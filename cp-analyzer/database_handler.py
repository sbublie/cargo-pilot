from models import Location, Trip, Cluster
import requests
import json


class DatabaseHandler:

    def __init__(self) -> None:
        self.BASE_URL = "http://cp-db:5000"

    def add_location(self, location) -> int:

        response = requests.post(self.BASE_URL + "/locations",
                                 json=location)

        return json.loads(response.text)['id']
    
    def add_offering(self, offering):
        response = requests.post(self.BASE_URL + "/offerings",
                                 json=offering)
        return response

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

    def add_trip(self, trip: Trip) -> int:
        new_trip = {"customer_id": 123, "destination_id": trip.destination_id,
                    "origin_id": trip.origin_id, "source": trip.source, "type": trip.type, "vehicle_id": 123}
        response = requests.post(self.BASE_URL + "/trips", json=new_trip)
        return json.loads(response.text)

    def add_clusters(self, clusters: list[Cluster]):
        for cluster in clusters:
            new_cluster = {"center_lat": cluster.center_lat, "center_long": cluster.center_long, "location_ids": cluster.location_ids}
            response = requests.post(self.BASE_URL + "/clusters", json=new_cluster)
