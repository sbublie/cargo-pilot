import os
import pandas as pd
from models import Location, GeoLocation, AdminLocation, CargoItem, TransportItem, Vehicle
from datetime import datetime
from data_mapping import db_data_mapping, transics_data_mapping

class InputConverter:

    def convert_data_from_file(self, filename, source, data_type, sheet_number) -> list[TransportItem]:
        '''
        Process a given .csv, .geojson or .xlsc/.xls file and return the extracted data as list of Tour 
        '''
        df = self.__get_df_from_file(filename=filename, sheet_number=sheet_number)
        
        if data_type == "Transics":
            return self.__get_transics_data_from_df(df=df, source=source)

        if data_type == "DB":
            return self.__get_db_data_from_df(df=df, source=source)

        if data_type == "Manual":
            return self.__get_manual_data_from_df(df=df, source=source)


    def __get_df_from_file(self, filename, sheet_number):
        _, extension = os.path.splitext(filename)
        if extension:
            extension = extension.lower()

            if extension == '.csv':
                return pd.read_csv(filename)

            elif extension == '.geojson':
                raise ValueError("Geojson not yet supported!")

            elif extension == '.xls' or extension == '.xlsx':
                return pd.read_excel(filename, sheet_name=int(sheet_number))

            else:
                raise ValueError(
                    "Unsupported file format: {}".format(extension))
        else:
            raise ValueError("Invalid file: {}".format(filename))


    def __get_manual_data_from_df(self, df, source: str) -> list[TransportItem]:
        transport_items = []

        for index, row in df.iterrows():
            cargo_item = CargoItem(0, 0, False, False)
            cargo_item.weight = round(24000 * \
                float(row['utilization_weight']), 2)
            cargo_item.loading_meter = round(14 * \
                float(row['utilization_volume']), 2)

            value = row['origin_lat']
            if isinstance(value, str):
                value = value.replace(',', '.')
            origin_lat = float(value)

            value = row['origin_long']
            if isinstance(value, str):
                value = value.replace(',', '.')
            origin_long = float(value)

            value = row['destination_lat']
            if isinstance(value, str):
                value = value.replace(',', '.')
            destination_lat = float(value)

            value = row['destination_long']
            if isinstance(value, str):
                value = value.replace(',', '.')
            destination_long = float(value)


            value = row['origin_date'].strftime("%d.%m.%Y") + " " + row['origin_time'].strftime("%H:%M:%S")
            origin_timestamp = self.__convert_timestamp(value, "%d.%m.%Y %H:%M:%S")

            value = row['origin_date'].strftime("%d.%m.%Y") + " " + row['destination_time'].strftime("%H:%M:%S")
            destination_timestamp = self.__convert_timestamp(value, "%d.%m.%Y %H:%M:%S")

            origin_location = Location(geo_location=GeoLocation(
            lat=origin_lat, long=origin_long), timestamp=origin_timestamp)
            destination_location = Location(geo_location=GeoLocation(
            lat=destination_lat, long=destination_long), timestamp=destination_timestamp)

            vehicle = Vehicle(id=row["vehicle_id"], type="default",
                            max_loading_meter=14, max_weight=24000, stackable=False)

            new_item = TransportItem(origin=origin_location, destination=destination_location, cargo_item=cargo_item, type="history_trip", vehicle=vehicle, data_source=source)

            transport_items.append(new_item)
        return transport_items

    def __get_transics_data_from_df(self, df, source: str) -> list[TransportItem]:
        trips = []
        for index, row in df.iterrows():

            cargo_item = CargoItem(0, 0, False, False)
            if row[transics_data_mapping['vehicle_state']] == "LOADED":
                cargo_item.weight = 23936
                cargo_item.loading_meter = 13.6

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

            origin_location = Location(geo_location=GeoLocation(
                lat=origin_lat, long=origin_long), timestamp=origin_timestamp)
            destination_location = Location(geo_location=GeoLocation(
                lat=destination_lat, long=destination_long), timestamp=destination_timestamp)

            vehicle = Vehicle(id=row[transics_data_mapping['vehicle_id']], type="default",
                              max_loading_meter=13.6, max_weight=23936, stackable=False)

            new_trip = TransportItem(origin=origin_location, destination=destination_location, cargo_item=cargo_item, type="history_trip", customer=str(
                row[transics_data_mapping['customer_id']]), vehicle=vehicle, data_source=source)

            trips.append(new_trip)

        return trips

    def __get_db_data_from_df(self, df, source) -> list[TransportItem]:

        transport_items = []
        for index, row in df.iterrows():

            origin_postal_code = row[db_data_mapping['origin_postal_code']]
            origin_city = row[db_data_mapping['origin_city']]
            origin_country = row[db_data_mapping['origin_country_code']]
            origin_timestamp = row[db_data_mapping['origin_timestamp']]

            if (pd.isna(origin_postal_code) or pd.isna(origin_city) or pd.isna(origin_country) or pd.isna(origin_timestamp)):
                continue

            origin = Location(
                admin_location=AdminLocation(
                    postal_code=origin_postal_code,
                    city=origin_city,
                    country=origin_country,
                ), timestamp=self.__convert_timestamp(
                    timestamp=origin_timestamp,
                    pattern=db_data_mapping['origin_timestamp_pattern']))

            destination_postal_code = row[db_data_mapping['destination_postal_code']]
            destination_city = row[db_data_mapping['destination_city']]
            destination_country = row[db_data_mapping['destination_country_code']]
            destination_timestamp = row[db_data_mapping['destination_timestamp']]

            if (pd.isna(destination_postal_code) or pd.isna(destination_city) or pd.isna(destination_country) or pd.isna(destination_timestamp)):
                continue

            destination = Location(
                admin_location=AdminLocation(
                    postal_code=destination_postal_code,
                    city=destination_city,
                    country=destination_country,
                ), timestamp=self.__convert_timestamp(
                    timestamp=destination_timestamp,
                    pattern=db_data_mapping['destination_timestamp_pattern']))

            loading_meter = row[db_data_mapping['loading_meter']]
            weight = row[db_data_mapping['weight']]

            if pd.isna(loading_meter):
                loading_meter = None

            if pd.isna(weight):
                weight = None

            cargo_item = CargoItem(
                weight=weight,
                loading_meter=loading_meter,
                load_carrier=False, load_carrier_nestable=False)

            transport_items.append(TransportItem(origin=origin,
                                        type="order",
                                        destination=destination,
                                        cargo_item=cargo_item,
                                        data_source=source))

        return transport_items

    def __convert_timestamp(self, timestamp, pattern):

        datetime_obj = datetime.strptime(str(timestamp), pattern)
        return int(datetime_obj.timestamp())
