import os
import pandas as pd
from tour import Tour, Waypoint
from datetime import datetime

class InputConverter:

   
    def process_file(self, filename) -> list[Tour]: 
        '''
        Process a given .csv, .geojson or .xlsc/.xls file and return the extracted data as list of Tour 
        '''
        _, extension = os.path.splitext(filename)

        if extension:
            extension = extension.lower()

            if extension == '.csv':
                return self.__handle_csv_file(filename)
            elif extension == '.geojson':
                return self.__handle_geojson_file(filename)
            elif extension == '.xls' or extension == '.xlsx':
                return self.__handle_excel_file(filename)
            else:
                raise ValueError("Unsupported file format: {}".format(extension))
        else:
            raise ValueError("Invalid file: {}".format(filename))

    def __handle_csv_file(self, filename):
        df = pd.read_csv(filename)
        tours = []
        for index, row in df.iterrows():
            # TODO Consider other activities
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

                    new_tour = Tour(
                        row['ActivityName'],
                        Waypoint(latitude, longitude, self.__convert_timestamp(row['ActionDateTimeBegin'], "%m/%d/%Y %H:%M:%S")),
                        Waypoint(next_latitude, next_longitude, self.__convert_timestamp(next_row['ActionDateTimeEnd'], "%m/%d/%Y %H:%M:%S")),
                        load=load
                    )
                    tours.append(new_tour.toJSON())

        return tours

    def __handle_geojson_file(self):
        # TODO: Implement geojson handling
        pass

    def __handle_excel_file(self):
        # TODO: Implement Excel handling
        pass

    def __convert_timestamp(self, timestamp, pattern):
        
        datetime_obj = datetime.strptime(timestamp, pattern)
        return int(datetime_obj.timestamp())