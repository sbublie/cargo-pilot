from flask import Flask, request
from trip_handler import TripHandler
from cluster_handler import ClusterHandler

app = Flask(__name__)

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

@app.route('/cluster', methods=['GET'])
def cluster_locations_from_db():
    ClusterHandler().cluster_locations_from_db()
    return 'Clustering successful'


if __name__ == "__main__":
    app.run(port=5000, host='0.0.0.0')
    
