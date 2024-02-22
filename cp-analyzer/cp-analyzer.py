import logging
import json
from dataclasses import asdict
from logging.handlers import RotatingFileHandler

from flask import Flask, request
from flask_cors import CORS
from openapi_core import Spec, unmarshal_request
from openapi_core.contrib.flask import FlaskOpenAPIRequest

from trip_handler import TripHandler
from cluster_handler import ClusterHandler
from statistic_engine import StatisticsEngine
from threading import Thread
from database_handler import DatabaseHandler
from route_optimizer import RouteOptimizer
from models.models import DeliveryConfig
from requests.exceptions import RequestException


# Create a logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
handler = RotatingFileHandler('./logs/cp-analyser.log', maxBytes=1024*1024, backupCount=1)
handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s.%(msecs)03d [%(levelname)s] - %(funcName)30s() -> %(message)s')
formatter.datefmt = '%Y-%m-%d %H:%M:%S'
handler.setFormatter(formatter)
logger.addHandler(handler)

app = Flask(__name__)
CORS(app)

spec = Spec.from_file_path('openapi.yml')

@app.route('/upload/trips', methods=['POST'])
def process_trips_data():
    try:
        openapi_request = FlaskOpenAPIRequest(request)
        result = unmarshal_request(openapi_request, spec=spec)
        
        all_trips = TripHandler(logger=logger).get_trips_from_json(result.body['upload_data'])
        DatabaseHandler(logger=logger).add_trips_to_db(all_trips)

    except Exception as e:
        return {"error": str(e), "cause": str(e.__cause__)}, 400
    return {"result": "Data received successfully"}, 200

@app.route('/upload/cargo-orders', methods=['POST'])
def process_cargo_orders_data():
    try:
        openapi_request = FlaskOpenAPIRequest(request)
        result = unmarshal_request(openapi_request, spec=spec)

        all_cargo_orders = TripHandler(logger=logger).get_orders_from_json(result.body['upload_data'])
        DatabaseHandler(logger=logger).add_cargo_orders_to_db(cargo_orders=all_cargo_orders)
        return {"result": "Data received successfully"}
    
    except Exception as e:
        return {"error": str(e), "cause": str(e.__cause__)}, 400


@app.route('/statistics', methods=['GET'])
def get_statistics():
    return StatisticsEngine(logger=logger).get_statistics()

@app.route('/cluster-transport-items', methods=['POST'])
def cluster_transport_items():
    try:
        openapi_request = FlaskOpenAPIRequest(request)
        result = unmarshal_request(openapi_request, spec=spec)
        
        filtered_transport_items = []
        transport_items = DatabaseHandler(logger=logger).get_transport_items()

        for transport_item in transport_items:
            if transport_item.origin.timestamp >= result.body['start_timestamp'] and transport_item.destination.timestamp <= result.body['end_timestamp']:
                filtered_transport_items.append(transport_item)
        logger.debug(f"Filtered cargo orders: {len(filtered_transport_items)}")

        clusters = ClusterHandler(logger=logger, eps=result.body['eps'], min_samples=result.body['min_samples']).get_cluster_from_transport_items(transport_items=filtered_transport_items)
        return {"result": clusters}
    except Exception as e:
        logging.error(e, exc_info=True)
        return {"error": str(e), "cause": str(e.__cause__)}, 400
    

@app.route('/calc-routes', methods=['POST'])
def calulate_truck_routes():
    logger.debug('Calc routes API called')
    delivery_config = request.json
    logger.debug(f'Config parameter received: {delivery_config}')
    transport_items =  DatabaseHandler(logger=logger).get_transport_items()
    logger.debug('Config parameter and cargo orders ready for route optimization')

    corrected_transport_items = []
    for item in transport_items:
        if hasattr(item.origin, "geo_location") and hasattr(item.destination, "geo_location"):
            corrected_transport_items.append(item)

    result = RouteOptimizer(logger=logger).get_vrp_result(delivery_config=DeliveryConfig(**delivery_config), orders=corrected_transport_items)
    
    return {"result": json.loads(json.dumps(asdict(result), default=lambda o: o.__dict__, indent=4))}

if __name__ == "__main__":
    app.run(port=5000, host='0.0.0.0')
    
