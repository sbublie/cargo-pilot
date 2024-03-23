from dataclasses import dataclass

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