from dataclasses import dataclass
import json
from typing import Optional


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


@dataclass
class Tour:
    type: str
    origin: Waypoint
    destination: Waypoint
    load: Load
    source: str
    vehicle_id: Optional[str] = None
    customer_id: Optional[str] = None
    route_waypoints: Optional[list[Waypoint]] = None

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__,
                          sort_keys=True, indent=4)


