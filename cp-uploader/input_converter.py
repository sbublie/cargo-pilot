import os
import pandas as pd
from tour import Tour, Waypoint, Load, Offering
from datetime import datetime
import json
from api_handler import APIHandler

class InputConverter:

    def convert_data_from_file(self, filename, source, data_type) -> list[Tour]:
        '''
        Process a given .csv, .geojson or .xlsc/.xls file and return the extracted data as list of Tour 
        '''
        _, extension = os.path.splitext(filename)
        if extension:
            extension = extension.lower()

            if extension == '.csv':
                return self.__handle_csv_file(filename, source)

            elif extension == '.geojson':
                return self.__handle_geojson_file(filename)

            elif extension == '.xls' or extension == '.xlsx':
                if source == "DB":
                    return self.__handle_db_excel_file(filename, data_type)

            else:
                raise ValueError("Unsupported file format: {}".format(extension))
        else:
            raise ValueError("Invalid file: {}".format(filename))

    def __handle_csv_file(self, filename, source):
        df = pd.read_csv(filename)
        tours = []
        for index, row in df.iterrows():
            # TODO Consider other activities
            if index < 5000:

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

    def __handle_geojson_file(self):
        # TODO: Implement geojson handling
        pass

    def __handle_db_excel_file(self, filename, data_type):
        df = pd.read_excel(filename, sheet_name=0)
        if data_type == "Offerings":
            offerings = []
            for index, row in df.iterrows():
                if index < 100000:
                    origin = Waypoint(
                        post_code=row['Versender Postleitzahl'],
                        city=row['Versender Stadt'],
                        country_code=row['Versender Land'],
                        timestamp=self.__convert_timestamp(timestamp=row['Leistungsdatum (Datum)'],
                                                        pattern="%Y-%m-%d %H:%M:%S"))
                    destination = Waypoint(
                        post_code=row['Empfänger Postleitzahl'],
                        city=row['Empfänger Stadt'],
                        country_code=row['Empfänger Land'],
                        timestamp=self.__convert_timestamp(timestamp=row['Leistungsdatum (Datum)'],
                                                        pattern="%Y-%m-%d %H:%M:%S"))
                    load = Load(weight=row['Gewicht (Wirklich)'], loading_meter=row['Lademeter'])

                    offerings.append(
                        Offering(origin=origin, destination=destination, source="DB", load=load).toJSON()
                    )

                    if len(offerings) == 100 :
                        data = json.dumps(offerings)
                        APIHandler().upload_data(data=data, instance="Local", data_type=data_type)
                        offerings.clear()
                
            return offerings

    def __convert_timestamp(self, timestamp, pattern):

        datetime_obj = datetime.strptime(str(timestamp), pattern)
        return int(datetime_obj.timestamp())
