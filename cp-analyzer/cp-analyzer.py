from flask import Flask, request
from trip_handler import TripHandler
from cluster_handler import ClusterHandler
from statistic_engine import StatisticsEngine
from threading import Thread

from flask_cors import CORS
app = Flask(__name__)
CORS(app)

@app.route('/upload/trips', methods=['POST'])
def process_trips_data():
    json_data = request.get_json()  
    TripHandler().process_trip_data(json_data)
    return 'Data received successfully'

@app.route('/upload/offerings', methods=['POST'])
def process_offerings_data():
    json_data = request.get_json()  
    TripHandler().process_offering_data(json_data)
    return 'Data received successfully'

@app.route('/statistics', methods=['GET'])
def get_statistics():
    return StatisticsEngine().get_statistics()
    
@app.route('/cluster', methods=['GET'])
def cluster_locations_from_db():
    thread = Thread(target = ClusterHandler().cluster_locations_from_db())
    thread.start()
    return 'Clustering started'


if __name__ == "__main__":
    app.run(port=5000, host='0.0.0.0')
    
