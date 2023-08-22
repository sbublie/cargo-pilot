from flask import Flask, request
from trip_handler import TripHandler
from cluster_handler import ClusterHandler
from database_handler import DatabaseHandler

app = Flask(__name__)

@app.route('/upload', methods=['POST'])
def process_trip_data():
    json_data = request.get_json()  
    TripHandler().process_trip_data(json_data)
    return 'Data received successfully'

@app.route('/cluster', methods=['GET'])
def process_trip_data():
    ClusterHandler().cluster_locations_from_db()
    return 'Clustering successful'


if __name__ == "__main__":
    app.run(port=5000, host='0.0.0.0')
    
