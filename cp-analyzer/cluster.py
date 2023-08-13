from dataclasses import dataclass

@dataclass
class Cluster: 
    center_lat: float
    center_long: float
    location_ids: list[int]