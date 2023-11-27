
from dataclasses import dataclass, field, asdict
from typing import Optional
import json
from geopy.distance import geodesic
from enum import Enum
from typing import List


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


@dataclass
class MovingSectionDefinition:
    id: int
    section_type: SectionType
    origin: Location
    destination: Location
    loaded_cargo: CargoItem
    vehicle: Vehicle
    distance: float = field(init=False)
    loading_meter_utilization: float = field(init=False)
    weight_utilization: float = field(init=False)


class MovingSection(MovingSectionDefinition):
    id: int
    section_type: SectionType
    origin: Location
    destination: Location
    loaded_cargo: CargoItem
    vehicle: Vehicle

    @property
    def distance(self):
        return round(geodesic((self.origin.geo_location.lat, self.origin.geo_location.long), (
            self.destination.geo_location.lat, self.destination.geo_location.long)).kilometers, 2)

    @property
    def loading_meter_utilization(self):
        return round(
            (self.loaded_cargo.loading_meter / self.vehicle.max_loading_meter)*100, 2)

    @property
    def weight_utilization(self):
        return round(
            (self.loaded_cargo.weight / self.vehicle.max_weight)*100, 2)

@dataclass
class HoldingSection:
    section_type: SectionType
    location: Location
    duration: int
    changed_weight: float
    changed_loading_meter: float
    num_cargo_changed: int
    id: Optional[int] = None

# This defintion is needed to include the @properties in ProjectedTrip in the serialized output
@dataclass
class ProjectedTripDefinition:
    id: int
    vehicle: Vehicle
    trip_sections: List = field(default_factory=list)
    start_time: int = field(init=False)
    end_time: int = field(init=False)
    total_time: int = field(init=False)
    number_of_driving_sections: int = field(init=False)
    number_of_loading_sections: int = field(init=False)
    total_distance: float = field(init=False)
    average_loading_meter_utilization: float = field(init=False)
    average_weight_utilization: float = field(init=False)

class ProjectedTrip(ProjectedTripDefinition):
    id: int
    vehicle: Vehicle
    trip_sections: List = field(default_factory=list)

    @property
    def start_time(self):
        if len(self.trip_sections) == 0:
            return None
        return self.trip_sections[0].origin.timestamp
    
    @property
    def end_time(self):
        if len(self.trip_sections) == 0:
            return None
        return self.trip_sections[-2].destination.timestamp
    
    @property
    def total_time(self):
        if self.start_time is None or self.end_time is None:
            return None
        return self.end_time - self.start_time

    @property
    def number_of_driving_sections(self) -> int:
        num_driving_sections = 0
        for section in self.trip_sections:
            if section.section_type == SectionType.DRIVING.name:
                num_driving_sections += 1
        return num_driving_sections

    @property
    def number_of_loading_sections(self) -> int:
        num_loading_sections = 0
        for section in self.trip_sections:
            if section.section_type == SectionType.LOADING.name:
                num_loading_sections += 1
        return num_loading_sections

    @property
    def total_distance(self) -> float:
        total_distance = 0
        for section in self.trip_sections:
            if section.section_type == SectionType.DRIVING.name:
                total_distance += section.distance
        return round(total_distance, 2)

    @property
    def average_loading_meter_utilization(self) -> float:
        loading_meter_utilizations = [section.loading_meter_utilization for section in self.trip_sections if hasattr(
            section, 'loading_meter_utilization') and section.section_type == SectionType.DRIVING.name]

        if loading_meter_utilizations:
            return round(sum(loading_meter_utilizations) / self.number_of_loading_sections, 2)
        else:
            return 0.0  # or any other default value you prefer

    @property
    def average_weight_utilization(self) -> float:
        weight_utilizations = [section.weight_utilization for section in self.trip_sections if hasattr(
            section, 'weight_utilization') and section.section_type == SectionType.DRIVING.name]

        if weight_utilizations:
            return round(sum(weight_utilizations) / self.number_of_loading_sections, 2)
        else:
            return 0.0


@dataclass
class VRPResultDefinition:
    trips: List[ProjectedTrip]
    number_of_orders: int
    start_timestamp: int
    number_of_tour_starts: int
    number_of_trips: int = field(init=False)
    number_of_driving_sections: int = field(init=False)
    number_of_undelivered_orders: int
    total_distance: float = field(init=False)
    average_distance_per_trip: float = field(init=False)
    average_loading_meter_utilization: float = field(init=False)
    average_weight_utilization: float = field(init=False)


class VRPResult(VRPResultDefinition):
    trips: List[ProjectedTrip]
    number_of_orders: int
    start_timestamp: int
    number_of_tour_starts: int
    # number_of_trips: int
    # number_of_driving_sections : int
    number_of_undelivered_orders: int
    # total_distance: float
    # average_distance_per_trip: float
    # average_loading_meter_utilization: float
    # average_weight_utilization: float

    @property
    def number_of_trips(self):
        return len(self.trips)

    @property
    def number_of_driving_sections(self):
        if self.trips is None:
            return 0
        if len(self.trips) == 0 or len(self.trips[0].trip_sections) == 0:
            return 0
        return sum([trip.number_of_driving_sections for trip in self.trips])

    @property
    def total_distance(self):
        if len(self.trips) == 0:
            return 0
        return round(sum([trip.total_distance for trip in self.trips]), 2)

    @property
    def average_distance_per_trip(self):
        if len(self.trips) == 0:
            return 0
        return round(self.total_distance / self.number_of_trips, 2)

    @property
    def average_loading_meter_utilization(self):
        if len(self.trips) == 0:
            return 0
        return round(sum([trip.average_loading_meter_utilization for trip in self.trips]) / self.number_of_trips, 2)

    @property
    def average_weight_utilization(self):
        if len(self.trips) == 0:
            return 0
        return round(sum([trip.average_weight_utilization for trip in self.trips]) / self.number_of_trips, 2)


@dataclass
class DeliveryConfig:
    start_time: int
    end_time_incl: int
    max_loading_meter: float
    max_weight: int
    num_trucks: int
    days_per_trip: int
    km_per_day: int
    min_per_day: int
    reuse_trucks: bool
    penalty_for_dropping_nodes: int
    calculation_time_limit: int
    waiting_time_days: int
    waiting: bool
    delivery_promise_radius: int
    delivery_promise_days: int
    last_stop_distance: int


@dataclass
class Cluster:
    center_lat: float
    center_long: float
    location_ids: list[int]


class CustomEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ProjectedTrip):
            # Include properties in the serialized output
            return asdict(obj)
        return super().default(obj)
