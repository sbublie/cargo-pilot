db_data_mapping = {

    "origin_postal_code": "Versender Postleitzahl",
    "origin_city": "Versender Stadt",
    "origin_country_code": "Versender Land",
    "origin_timestamp": "Leistungsdatum (Datum)",
    "origin_timestamp_pattern": "%Y-%m-%d %H:%M:%S",

    "destination_postal_code": "Empfänger Postleitzahl",
    "destination_city": "Empfänger Stadt",
    "destination_country_code": "Empfänger Land",
    "destination_timestamp": "Leistungsdatum (Datum)",
    "destination_timestamp_pattern": "%Y-%m-%d %H:%M:%S",

    "weight": "Gewicht (Wirklich)",
    "loading_meter": "Lademeter"

}

transics_data_mapping = {
    "origin_lat": "origin_lat",
    "origin_long": "origin_long",
    "origin_timestamp": "ActionDateTimeBegin",
    "origin_timestamp_pattern": "%d/%m/%Y %H:%M:%S",

    "destination_lat": "destination_lat",
    "destination_long": "destination_long",
    "destination_timestamp": "ActionDateTimeEnd",
    "destination_timestamp_pattern": "%d/%m/%Y %H:%M:%S",

    "vehicle_state": "VehicleState",
    "vehicle_id": "VehicleId_hash",
    "customer_id": "CustomerId_hash",
}
