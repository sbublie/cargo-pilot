from models import Location, Trip, Cluster
import requests
import json

class DatabaseHandler:

    def __init__(self) -> None:
        pass

    def add_location(self, location:Location) -> int:
        new_location = {"lat": location.lat, "long": location.long, "type": location.type, "timestamp": location.timestamp}

        response = requests.post("http://localhost:5003/locations", json=new_location)
        return json.loads(response.text)['id']

    def get_locations(self) -> list[Location]:
        response = requests.get("http://localhost:5003/locations")
        locations = []
        try:
            data = response.json()
            locations = [Location(**location) for location in data]
        except (ValueError, KeyError):
            print("Error: Unable to parse JSON response or missing key in the JSON data.")
        return locations

    def add_trip(self, trip:Trip) -> int:
        new_trip = {"customer_id": 123, "destination_id": trip.destination_id, "origin_id": trip.origin_id, "source": trip.source, "type": trip.type, "vehicle_id": 123}
        response = requests.post("http://localhost:5003/trips", json=new_trip)
        return json.loads(response.text)

    def add_trips(self, trip):
        # TODO
        pass

    def add_clusters(self, clusters:list[Cluster]):
        for cluster in clusters:
            new_cluster = {"center_lat": cluster.center_lat, "center_long": cluster.center_long, "location_ids": cluster.location_ids}
            response = requests.post("http://localhost:5003/clusters", json=new_cluster)
            