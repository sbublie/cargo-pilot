from dataclasses import dataclass
import json

@dataclass
class Waypoint:
    lat:float
    long:float
    timestamp:int

@dataclass
class Tour:
    type: str
    origin: Waypoint
    destination: Waypoint
    load:float

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__, 
            sort_keys=True, indent=4)

# Custom JSON encoder for the Tour class
class TourEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Tour):
            return obj.__dict__  # Convert the object attributes to a dictionary
        return super().default(obj)