from database_handler import DatabaseHandler
from collections import Counter
import json

class StatisticsEngine:

    def __init__(self) -> None:
        pass

    def get_statistics(self):
        offerings = DatabaseHandler().get_offerings()

        all_origin_zip_codes = [offering['origin']['zip_code'] for offering in offerings]
        all_destination_zip_codes = [offering['destination']['zip_code'] for offering in offerings]

        origin_counter = Counter(all_origin_zip_codes)
        sorted_origin_counter = { i: { "zip_code": x, "count": count} for i, (x, count) in enumerate(origin_counter.most_common(), 1) if count > 1}

        destination_counter = Counter(all_destination_zip_codes)
        sorted_destination_counter = { i: { "zip_code": x, "count": count} for i, (x, count) in enumerate(destination_counter.most_common(), 1) if count > 1}

        offering_relation = [[offering['origin']['zip_code'],offering['destination']['zip_code']] for offering in offerings]

        # Step 1: Count the occurrences of each pair using a dictionary!
        counter = {}
        for array in offering_relation:
            tuple_array = tuple(array)
            if tuple_array not in counter:
                counter[tuple_array] = 1
            else:
                counter[tuple_array] += 1

        # Step 2: Sort the pairs by count in descending order
        sorted_counter_items = sorted(counter.items(), key=lambda x: x[1], reverse=True)

        # Step 3: Construct the output dictionary in the desired format
        output = {"offering_relation": {}}
        for index, ((origin, destination), count) in enumerate(sorted_counter_items):
            output[str(index + 1)] = {"origin": origin, "destination": destination, "count": count}

        return {"offerings": {"no_of_offerings": len(offerings), "occurrence_of_origins": sorted_origin_counter, "occurrence_of_destinations": sorted_destination_counter, "offering_relation": output}}