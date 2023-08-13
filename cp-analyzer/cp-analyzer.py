from flask import Flask, request
from trip_handler import TripHandler
from cluster_handler import ClusterHandler
from database_handler import DatabaseHandler

app = Flask(__name__)

@app.route('/api/uploader', methods=['POST'])
def receive_data():
    json_data = request.get_json()  
   
    TripHandler().process_trip_data(json_data)
    ClusterHandler().cluster_locations_from_db()
   

    return 'Data received successfully'


if __name__ == "__main__":
    app.run(port=5000)
    
