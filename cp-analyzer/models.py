
from dataclasses import dataclass
from typing import Optional


@dataclass
class Location:
    lat: float
    long: float
    type: str
    timestamp: int
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

    id: Optional[int] = None

    def get_lat_long_list(self):
        return [self.lat, self.long]


@dataclass
class Waypoint:
    lat: Optional[float] = None
    long: Optional[float] = None
    street: Optional[str] = None
    post_code: Optional[int] = None
    city: Optional[str] = None
    country_code: Optional[str] = None
    timestamp: Optional[int] = None
    


@dataclass
class Load:
    weight: Optional[float] = None
    loading_meter: Optional[float] = None
    capacity_percentage: Optional[float] = None

class Trip:
    def __init__(self, customer_id, destination, load, origin, route_waypoints, source, type, vehicle_id):
        self.customer_id = customer_id
        self.destination = Waypoint(**destination)
        self.load = Load(**load)
        self.origin = Waypoint(**origin)
        self.route_waypoints = route_waypoints
        self.source = source
        self.type = type
        self.vehicle_id = vehicle_id

@dataclass
class Cluster:
    center_lat: float
    center_long: float
    location_ids: list[int]