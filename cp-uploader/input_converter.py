import os
import pandas as pd
from tour import Tour, Waypoint, Load, Offering
from datetime import datetime
from data_mapping import db_data_mapping


class InputConverter:

    def convert_data_from_file(self, filename, source, data_type, instance) -> list:
        '''
        Process a given .csv, .geojson or .xlsc/.xls file and return the extracted data as list of Tour 
        '''
        df = self.__get_df_from_file(filename=filename)
        
        if data_type == "Offerings":
            return self.__get_offerings_from_df(df=df, source=source)
        elif data_type == "Trips":
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
        tours = []
        for index, row in df.iterrows():

                if row['ActivityName'] == "Driving":
                    if index+1 < len(df.index):
                        next_row = df.iloc[index+1]
                        # Convert row['Latitude'] and row['Longitude'] to float if necessary
                        latitude = float(row['Latitude'])
                        longitude = float(row['Longitude'])
                        next_latitude = float(next_row['Latitude'])
                        next_longitude = float(next_row['Longitude'])
                        load = 0
                        if row['VehicleState'] == "LOADED":
                            load = 100

                        new_tour = Tour(type=row['ActivityName'],
                                        origin=Waypoint(
                                            lat=latitude, long=longitude, timestamp=self.__convert_timestamp(
                                                row['ActionDateTimeBegin'],
                                                "%m/%d/%Y %H:%M:%S")),
                                        destination=Waypoint(
                                            lat=next_latitude, long=next_longitude, timestamp=self.__convert_timestamp(
                                                next_row['ActionDateTimeEnd'],
                                                "%m/%d/%Y %H:%M:%S")),
                                        route_waypoints=[],
                                        load=Load(capacity_percentage=load),
                                        source=source, vehicle_id=row['VehicleId_hash'],
                                        customer_id=row['CustomerId_hash'])

                        tours.append(new_tour.toJSON())

        return tours

    def __get_offerings_from_df(self, df, source):

        offerings = []
        for index, row in df.iterrows():
            origin = Waypoint(
                post_code=row[db_data_mapping['origin_postal_code']],
                city=row[db_data_mapping['origin_city']],
                country_code=row[db_data_mapping['origin_country_code']],
                timestamp=self.__convert_timestamp(timestamp=row[db_data_mapping['origin_timestamp']],
                                                   pattern=db_data_mapping['origin_timestamp_pattern']))
            destination = Waypoint(
                post_code=row[db_data_mapping['destination_postal_code']],
                city=row[db_data_mapping['destination_city']],
                country_code=row[db_data_mapping['destination_country_code']],
                timestamp=self.__convert_timestamp(timestamp=row[db_data_mapping['destination_timestamp']],
                                                   pattern=db_data_mapping['destination_timestamp_pattern']))
            load = Load(weight=row[db_data_mapping['weight']], loading_meter=row[db_data_mapping['loading_meter']])

            offerings.append(
                Offering(origin=origin, destination=destination, source=source, load=load)
            )

        return offerings


    def __convert_timestamp(self, timestamp, pattern):

        datetime_obj = datetime.strptime(str(timestamp), pattern)
        return int(datetime_obj.timestamp())
