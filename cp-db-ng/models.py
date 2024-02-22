from dataclasses import dataclass
import json
from typing import Optional


@dataclass
class GeoLocation:
    lat: Optional[float] = None
    long: Optional[float] = None

@dataclass
class AdminLocation:
    postal_code: str
    city: str
    country: str
    street: Optional[str] = None

@dataclass
class CargoItem:
    loading_meter: float
    weight: float
    load_carrier: bool
    load_carrier_nestable: bool


class Location:
    def __init__(self, timestamp: int, id: Optional[int] = None, geo_location: Optional[dict] = {}, admin_location: Optional[dict] = {}):
        self.timestamp = timestamp
        self.id = id
        self.geo_location = GeoLocation(**geo_location)
        self.admin_location = AdminLocation(**admin_location)

@dataclass
class Vehicle:
    id:Optional[str] = None
    type: Optional[str] = None
    max_loading_meter: Optional[float] = None
    max_weight: Optional[int] = None
    stackable: Optional[bool] = None

import json
from typing import Optional, List

class TransportItem:
    def __init__(self, id, data_source: str, type: str, origin: dict, destination: dict, cargo_item: dict, vehicle: Optional[dict] = {}, customer: Optional[str] = None, route_locations: Optional[List[GeoLocation]] = None):
        self.id = id
        self.data_source = data_source
        self.type = type
        self.origin = Location(**origin)
        self.destination = Location(**destination)
        self.cargo_item = CargoItem(**cargo_item)
        self.vehicle = Vehicle(**vehicle)
        self.customer = customer
        self.route_locations = route_locations

    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)

    def to_dict(self):
        return json.loads(json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4))


