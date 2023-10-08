
from dataclasses import dataclass
from typing import Optional
import json

@dataclass
class Location:
    id: Optional[float] = None
    lat: Optional[float] = None
    long: Optional[float] = None
    street: Optional[str] = None
    zip_code: Optional[int] = None
    city: Optional[str] = None
    country: Optional[str] = None
    timestamp: Optional[int] = None
    type: Optional[str] = None

    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__)
    
    def get_lat_long_list(self):
        return [self.lat, self.long]

    
@dataclass
class Load:
    weight: Optional[float] = None
    loading_meter: Optional[float] = None
    capacity_percentage: Optional[float] = None

class Trip:
    def __init__(self, customer_id, destination, load, origin, route_waypoints, source, type, vehicle_id):
        self.customer_id = customer_id
        self.destination = Location(**destination)
        self.load = Load(**load)
        self.origin = Location(**origin)
        self.route_waypoints = route_waypoints
        self.source = source
        self.type = type
        self.vehicle_id = vehicle_id

class Offering:
    def __init__(self, customer_id, destination, load, origin, route_waypoints, source, vehicle_id):
        self.customer_id = customer_id
        self.destination = Location(**destination)
        self.load = Load(**load)
        self.origin = Location(**origin)
        self.route_waypoints = route_waypoints
        self.source = source
        self.vehicle_id = vehicle_id


@dataclass
class Cluster:
    center_lat: float
    center_long: float
    location_ids: list[int]