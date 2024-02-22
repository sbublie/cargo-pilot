from models import GeoLocation

class PostcodeHandler:
    def __init__(self) -> None:
        self.postal_codes = {}
        with open('allCountries.txt', 'r') as file:
            for line in file:
                line = line.strip().split('\t')
                if len(line) >= 11:  # Ensure line has enough fields
                    try:
                        postal_code = line[1]
                        country_code = line[0]
                        lat = float(line[9])
                        long = float(line[10])
                        key = (postal_code.casefold(), country_code.casefold())
                        self.postal_codes[key] = GeoLocation(lat=lat, long=long)
                    except (ValueError, IndexError):
                        pass
                        # Handle conversion errors or index out of range errors

    def get_geo_location_from_post_code(self, postal_code: str, country: str) -> GeoLocation | None:
        key = (postal_code.casefold(), country.casefold())
        return self.postal_codes.get(key)