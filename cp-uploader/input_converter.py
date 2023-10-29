import os
import pandas as pd
from models import Trip, Waypoint, Load, Offering, CargoOrder, Location, GeoLocation, AdminLocation, CargoItem
from datetime import datetime
from data_mapping import db_data_mapping, transics_data_mapping


class InputConverter:

    def convert_data_from_file(self, filename, source, data_type) -> list:
        '''
        Process a given .csv, .geojson or .xlsc/.xls file and return the extracted data as list of Tour 
        '''
        df = self.__get_df_from_file(filename=filename)

        if data_type == "Cargo Orders":
            return self.__get_orders_from_df(df=df, source=source)
        elif data_type == "Past Trips":
            return self.__get_trips_from_df(df=df, source=source)
        else:
            raise ValueError("Unsupported data_type: {}".format(data_type))

    def __get_df_from_file(self, filename):
        _, extension = os.path.splitext(filename)
        if extension:
            extension = extension.lower()

            if extension == '.csv':
                return pd.read_csv(filename)

            elif extension == '.geojson':
                raise ValueError("Geojson not yet supported!")

            elif extension == '.xls' or extension == '.xlsx':
                return pd.read_excel(filename, sheet_name=0)

            else:
                raise ValueError("Unsupported file format: {}".format(extension))
        else:
            raise ValueError("Invalid file: {}".format(filename))

    def __get_trips_from_df(self, df, source):
        trips = []
        for index, row in df.iterrows():

            load = 0
            if row[transics_data_mapping['vehicle_state']] == "LOADED":
                load = 100

            value = row[transics_data_mapping['origin_lat']]
            if isinstance(value, str):
                value = value.replace(',', '.')
            origin_lat = float(value)

            value = row[transics_data_mapping['origin_long']]
            if isinstance(value, str):
                value = value.replace(',', '.')
            origin_long = float(value)

            origin_timestamp = self.__convert_timestamp(
                row[transics_data_mapping['origin_timestamp']],
                transics_data_mapping['origin_timestamp_pattern'])
            origin = Waypoint(lat=origin_lat, long=origin_long, timestamp=origin_timestamp)

            value = row[transics_data_mapping['destination_lat']]
            if isinstance(value, str):
                value = value.replace(',', '.')
            destination_lat = float(value)

            value = row[transics_data_mapping['destination_long']]
            if isinstance(value, str):
                value = value.replace(',', '.')
            destination_long = float(value)

            destination_timestamp = self.__convert_timestamp(
                row[transics_data_mapping['destination_timestamp']],
                transics_data_mapping['destination_timestamp_pattern'])
            destination = Waypoint(lat=destination_lat, long=destination_long, timestamp=destination_timestamp)

            new_trip = Trip(type=0,
                            origin=origin,
                            destination=destination,
                            route_waypoints=[],
                            load=Load(capacity_percentage=load),
                            source=source,
                            vehicle_id=row[transics_data_mapping['vehicle_id']],
                            customer_id=row[transics_data_mapping['customer_id']])

            trips.append(new_trip)

        return trips

    def __get_orders_from_df(self, df, source) -> list[CargoOrder]:

        orders = []
        for index, row in df.iterrows():

            origin = Location(
                admin_location=AdminLocation(
                    postal_code=row[db_data_mapping['origin_postal_code']],
                    city=row[db_data_mapping['origin_city']],
                    country=row[db_data_mapping['origin_country_code']],
                ), timestamp=self.__convert_timestamp(
                    timestamp=row[db_data_mapping['origin_timestamp']],
                    pattern=db_data_mapping['origin_timestamp_pattern']))

            destination = Location(
                admin_location=AdminLocation(
                    postal_code=row[db_data_mapping['destination_postal_code']],
                    city=row[db_data_mapping['destination_city']],
                    country=row[db_data_mapping['destination_country_code']],
                ), timestamp=self.__convert_timestamp(
                    timestamp=row[db_data_mapping['destination_timestamp']],
                    pattern=db_data_mapping['destination_timestamp_pattern']))

            cargo_item = CargoItem(
                weight=row[db_data_mapping['weight']],
                loading_meter=row[db_data_mapping['loading_meter']],
                load_carrier=False, load_carrier_nestable=False)

            orders.append(CargoOrder(origin=origin,
                                     destination=destination,
                                     cargo_item=cargo_item,
                                     data_source=source))

        return orders

    def __convert_timestamp(self, timestamp, pattern):

        datetime_obj = datetime.strptime(str(timestamp), pattern)
        return int(datetime_obj.timestamp())
