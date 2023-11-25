
from dataclasses import dataclass
from typing import Optional
import json
from geopy.distance import geodesic
from enum import Enum


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


class CargoItem:
    def __init__(self, load_carrier, load_carrier_nestable, loading_meter=None, weight=None):
        self.load_carrier = load_carrier
        self.load_carrier_nestable = load_carrier_nestable
        if loading_meter is not None:
            self.loading_meter = round(loading_meter, 2)
        if weight is not None:
            self.weight = round(weight, 2)


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


class SectionType(Enum):
    LOADING = 1
    DRIVING = 2

class MovingSection:
    def __init__(self, section_type, origin:Location, destination:Location, vehicle: Vehicle, loaded_cargo: CargoItem, id=None):
        self.section_type = section_type
        self.origin = origin
        self.destination = destination
        self.vehicle = vehicle
        self.loaded_cargo = loaded_cargo
        self.distance = round(geodesic((self.origin.geo_location.lat, self.origin.geo_location.long), (
            self.destination.geo_location.lat, self.destination.geo_location.long)).kilometers, 2)
        self.loading_meter_utilization = round(
            (self.loaded_cargo.loading_meter / self.vehicle.max_loading_meter), 2)*100
        self.weight_utilization = round(
            (self.loaded_cargo.weight / self.vehicle.max_weight), 2)*100
        self.id = id


@dataclass
class HoldingSection:
    section_type: SectionType
    location: Location
    duration: int
    changed_weight: float
    changed_loading_meter: float
    num_cargo_changed: int
    id: Optional[int] = None


@dataclass
class ProjectedTrip:
    vehicle: Vehicle
    start_time: int
    end_time: int
    total_time: int
    included_orders: list[CargoOrder]
    trip_sections: list
    num_driving_sections: int = 0
    num_loading_sections: int = 0
    total_distance: float = 0
    number_of_cargo_orders: int = 0
    id: Optional[int] = None

    def get_weight_utilization(self):
        return self.get_total_weight() / self.vehicle.max_weight

    def get_loading_meter_utilization(self):
        return self.get_total_loading_meter() / self.vehicle.max_loading_meter

    def get_num_driving_sections(self):
        num_driving_sections = 0
        for section in self.trip_sections:
            if section.section_type == SectionType.DRIVING.name:
                num_driving_sections += 1
        return num_driving_sections

    def get_num_loading_sections(self):
        num_loading_sections = 0
        for section in self.trip_sections:
            if section.section_type == SectionType.LOADING.name:
                num_loading_sections += 1
        return num_loading_sections
    
    def get_total_distance(self):
        total_distance = 0
        for section in self.trip_sections:
            total_distance += section.distance
        return total_distance


class VRPResult:
    def __init__(self, number_of_trips, number_of_orders, number_of_driving_sections, number_of_undelivered_orders, total_distance, average_distance_per_trip, average_loading_meter_utilization, average_weight_utilization, trips):
        self.number_of_trips = number_of_trips
        self.number_of_orders = number_of_orders
        self.number_of_driving_sections = number_of_driving_sections
        self.number_of_undelivered_orders = number_of_undelivered_orders
        self.total_distance = total_distance
        self.average_distance_per_trip = average_distance_per_trip
        self.average_loading_meter_utilization = average_loading_meter_utilization
        self.average_weight_utilization = average_weight_utilization
        self.trips = trips



@dataclass
class DeliveryConfig:
    start_time: int
    end_time_incl: int
    max_loading_meter: float
    max_weight: int
    num_trucks: int
    cargo_stackable: bool
    focus_area: str
    load_carrier: bool
    load_carrier_nestable: bool
    corridor_radius: int
    allowed_stays: int
    days_per_trip: int = 1
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
