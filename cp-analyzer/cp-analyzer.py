from flask import Flask, request
from trip_handler import TripHandler
from cluster_handler import ClusterHandler
from statistic_engine import StatisticsEngine
from threading import Thread
from database_handler import DatabaseHandler
from route_optimizer import RouteOptimizer
from models import DeliveryConfig
import logging


# Configure the logging module
logging.basicConfig(level=logging.DEBUG,  # Set the logging level
                    format='%(asctime)s.%(msecs)03d [%(levelname)s] - %(funcName)30s() -> %(message)s',
                    datefmt='%Y-%m-%d %H:%M:%S')

# Create a logger
logger = logging.getLogger(__name__)

from flask_cors import CORS
app = Flask(__name__)
CORS(app)

@app.route('/upload/trips', methods=['POST'])
def process_trips_data():
    json_data = request.get_json()  
    all_trips = TripHandler().get_trips_from_json(json_data)
    DatabaseHandler().add_trips_to_db(all_trips)
    return 'Data received successfully'

@app.route('/upload/cargo-orders', methods=['POST'])
def process_cargo_orders_data():
    json_data = request.get_json()  
    all_cargo_orders = TripHandler().get_orders_from_json(json_data)
    DatabaseHandler().add_cargo_orders_to_db(cargo_orders=all_cargo_orders)
    return {"result": "Data received successfully"}

@app.route('/statistics', methods=['GET'])
def get_statistics():
    return StatisticsEngine().get_statistics()
    
@app.route('/cluster', methods=['GET'])
def cluster_locations_from_db():
    thread = Thread(target = ClusterHandler().cluster_locations_from_db)
    thread.start()
    return 'Clustering started'

@app.route('/calc-routes', methods=['POST'])
def calulate_truck_routes():
    logger.debug('Calc routes API called')
    delivery_config = request.json
    logger.debug(f'Config parameter received: {delivery_config}')
    cargo_orders =  DatabaseHandler(logger=logger).get_cargo_orders()
    logger.debug('Config parameter and cargo orders ready for route optimization')
    result = RouteOptimizer(logger=logger).solve_vrp(delivery_config=DeliveryConfig(**delivery_config), orders=cargo_orders)

    return {"result": result}

if __name__ == "__main__":
    app.run(port=5000, host='0.0.0.0')
    
