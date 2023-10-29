
from dataclasses import dataclass
from typing import Optional
import json


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

class Location:
    def __init__(self, timestamp, geo_location, admin_location, id=None):
        self.timestamp = timestamp
        self.id = id
        if geo_location is None:
            self.geo_location = GeoLocation(None, None)
        else:
            self.geo_location = GeoLocation(**geo_location)
        if admin_location is None:
            self.admin_location = AdminLocation(None, None, None, None)
        else:
            self.admin_location = AdminLocation(**admin_location)

class CargoOrder:
    def __init__(self, data_source, origin, destination, cargo_item, id=None, customer=None, route_locations=None):
        self.data_source = data_source
        self.origin = Location(**origin)
        self.destination = Location(**destination)
        self.cargo_item = cargo_item
        self.id = id
        self.customer = customer
        self.route_locations = route_locations

    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__,
                        sort_keys=True, indent=4)

@dataclass
class Vehicle:
    type: str
    stackable: bool
    max_load_meter: float
    max_weight: float
    id: Optional[int] = None

@dataclass
class CompletedTrip:

    def __init__(self, origin, destination, cargo_item, customer, vehicle, data_source, id=None, route_locations=None):
        self.origin = Location(**origin)
        self.destination = Location(**destination)
        self.cargo_item = CargoItem(**cargo_item)
        self.customer = customer
        self.vehicle = Vehicle(**vehicle)
        self.data_source = data_source
        self.id = id
        self.route_locations = route_locations

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

# ---

@dataclass
class LocationOld:
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