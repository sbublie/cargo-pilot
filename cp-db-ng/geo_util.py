from models import GeoLocation

class GeoUtil():

    def __init__(self) -> None:
        pass

    def add_geo_location_to_transport_dict(self, transport_dict:dict, origin_geo_location:GeoLocation, destination_geo_location:GeoLocation):

        transport_dict['origin']['geo_location'] = {}
        transport_dict['origin']['geo_location']['lat'] = origin_geo_location.lat
        transport_dict['origin']['geo_location']['long'] = origin_geo_location.long

        transport_dict['destination']['geo_location'] = {}
        transport_dict['destination']['geo_location']['lat'] = destination_geo_location.lat
        transport_dict['destination']['geo_location']['long'] = destination_geo_location.long

