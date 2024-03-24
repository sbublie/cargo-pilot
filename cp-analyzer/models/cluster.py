from dataclasses import dataclass
from typing import Optional

@dataclass
class Cluster: 
    id: int
    center_lat: float
    center_long: float
    location_ids: list[int]
    number_of_locations: int

@dataclass
class ClusterRelation:
    origin_cluster: int
    destination_cluster: int
    relation_count: int
    all_loading_meter: list[float]
    all_weight: list[float]
    average_loading_meter: Optional[float] = None
    average_weight: Optional[float] = None


