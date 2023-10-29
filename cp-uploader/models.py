from dataclasses import dataclass
import json
from typing import Optional


@dataclass
class GeoLocation:
    lat: float
    long: float


@dataclass
class AdminLocation:
    postal_code: int
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
class CargoOrder:
    data_source: str
    origin: Location
    destination: Location
    cargo_item: CargoItem
    id: Optional[int] = None
    customer: Optional[str] = None
    route_locations: Optional[list[GeoLocation]] = None

    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__,
                          sort_keys=True, indent=4)


@dataclass
class CompletedTrip:
    origin: Location
    destination: Location
    load: CargoItem
    customer_id: int
    vehicle_id: int
    data_source: str
    id: Optional[int] = None
    route_locations: Optional[list[GeoLocation]] = None


@dataclass
class Vehicle:
    type: str
    stackable: bool
    max_load_meter: float
    max_weight: float
    id: Optional[int] = None


@dataclass
class TripSection:
    origin: Location
    destination: Location
    loaded_cargo: list[CargoItem]


@dataclass
class ProjectedTrip:
    vehicle: Vehicle
    included_orders: list[CargoOrder]
    trip_sections: list[TripSection]
    id: Optional[int] = None


# ----

@dataclass
class Waypoint:
    lat: Optional[float] = None
    long: Optional[float] = None
    street: Optional[str] = None
    zip_code: Optional[int] = None
    city: Optional[str] = None
    country: Optional[str] = None
    timestamp: Optional[int] = None


@dataclass
class Load:
    weight: Optional[float] = None
    loading_meter: Optional[float] = None
    capacity_percentage: Optional[float] = None


@dataclass
class Trip:
    type: str
    origin: Waypoint
    destination: Waypoint
    load: Load
    source: str
    vehicle_id: Optional[str] = None
    customer_id: Optional[str] = None
    route_waypoints: Optional[list[Waypoint]] = None

    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__,
                          sort_keys=True, indent=4)


@dataclass
class Offering:
    origin: Waypoint
    destination: Waypoint
    load: Load
    source: str
    vehicle_id: Optional[str] = None
    customer_id: Optional[str] = None
    route_waypoints: Optional[list[Waypoint]] = None

    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__,
                          sort_keys=True, indent=4)
