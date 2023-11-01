
from dataclasses import dataclass
from typing import Optional
import json
from geopy.distance import geodesic


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
    load_carrier: bool
    load_carrier_nestable: bool
    loading_meter: Optional[float] = None
    weight: Optional[float] = None
    
class Location:
    def __init__(self, timestamp, geo_location=None, admin_location=None, id=None):
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
        self.cargo_item = CargoItem(**cargo_item)
        self.id = id
        self.customer = customer
        self.route_locations = route_locations

    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__,
                        sort_keys=True, indent=4)
    
    def get_distance(self):
        return geodesic((self.origin.geo_location.lat, self.origin.geo_location.long), (self.destination.geo_location.lat, self.destination.geo_location.long)).kilometers

@dataclass
class Vehicle:
    type: str
    stackable: bool
    max_loading_meter: float
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
    start_time: int
    included_orders: list[CargoOrder]
    trip_sections: list[TripSection]
    id: Optional[int] = None

    def get_total_weight(self):
        total_weight = 0
        for order in self.included_orders:
            total_weight += order.cargo_item.weight
        return total_weight
    
    def get_total_loading_meter(self):
        total_loading_meter = 0
        for order in self.included_orders:
            total_loading_meter += order.cargo_item.loading_meter
        return total_loading_meter
    
    def get_weight_utilization(self):
        return self.get_total_weight() / self.vehicle.max_weight 
    
    def get_loading_meter_utilization(self):
        return self.get_total_loading_meter() / self.vehicle.max_loading_meter


# ---

@dataclass
class DeliveryConfig:
    start_time: int
    end_time_incl: int
    max_loading_meter: float
    max_weight: int
    num_trucks: int
    cargo_stackable: bool
    max_waiting_time: int
    focus_area: str
    load_carrier: bool
    load_carrier_nestable: bool
    corridor_radius: int
    allowed_stays: int
    delivery_promise: Optional[dict] = None
    

@dataclass
class DeliveryPromise:
    active: bool
    radius: int
    percent_of_cargo: int
    time_for_remaining_cargo: int

@dataclass
class ReturnCorridor:
    distance_return_to_start: int
    allowed_stays: int

@dataclass
class Cluster:
    center_lat: float
    center_long: float
    location_ids: list[int]