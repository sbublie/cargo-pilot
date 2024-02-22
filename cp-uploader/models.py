from dataclasses import dataclass
import json
from typing import Optional


@dataclass
class GeoLocation:
    lat: float
    long: float

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


@dataclass
class Location:
    timestamp: int
    id: Optional[int] = None
    geo_location: Optional[GeoLocation] = None
    admin_location: Optional[AdminLocation] = None

@dataclass
class Vehicle:
    id:str
    type: str
    max_loading_meter: float
    max_weight: int
    stackable: bool

@dataclass
class TransportItem:
    data_source: str
    type: str
    origin: Location
    destination: Location
    cargo_item: CargoItem
    vehicle: Optional[Vehicle] = None
    customer: Optional[str] = None
    route_locations: Optional[list[GeoLocation]] = None

    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__,
                          sort_keys=True, indent=4)

    def to_dict(self):
        return json.loads(json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4))

