import logging
from functools import wraps
from logging.handlers import RotatingFileHandler
from bson import json_util
import json

from flask import Flask, request, Response, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from openapi_core import Spec, unmarshal_request
from openapi_core.contrib.flask import FlaskOpenAPIRequest

from models import TransportItem
from geo_util import GeoUtil
from postcode_handler import PostcodeHandler

# MongoDB connection details
mongo_host = 'mongodb'
mongo_port = 27017
mongo_db_name = 'my_database'

# Connect to MongoDB
client = MongoClient(mongo_host, mongo_port, username='user', password='pass')
db = client[mongo_db_name]
collection = db['my_collection2']

# Create a logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
handler = RotatingFileHandler('./logs/cp-db.log', maxBytes=1024*1024, backupCount=1)
handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s.%(msecs)03d [%(levelname)s] - %(funcName)30s() -> %(message)s')
formatter.datefmt = '%Y-%m-%d %H:%M:%S'
handler.setFormatter(formatter)
logger.addHandler(handler)

app = Flask(__name__)
CORS(app)

postcode_handler = PostcodeHandler()

spec = Spec.from_file_path('cp-db.yml')

def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.authorization
        if not auth or not check_auth(auth.username, auth.password):
            return authenticate()
        return f(*args, **kwargs)
    return decorated

def check_auth(username, password):
    # Check if the provided username and password are valid
    return username == 'user' and password == 'pass'

def authenticate():
    # Send a 401 response that enables basic auth
    return Response(
        'Unauthorized access. Please provide valid credentials.',
        401,
        {'WWW-Authenticate': 'Basic realm="Login Required"'}
    )

def __custom_serializer(obj):
    if isinstance(obj, float) and (obj > 1e15 or obj < -1e15):
        return str(obj)  # Convert large/small floats to strings
    return obj.__dict__  # Convert other objects to dictionaries

@app.route('/transport-items', methods=['GET'])
@requires_auth
def get_transport_items():
    logger.debug(f"/transport-items GET endpoint was called")
    try:
        #logger.debug("Received transport items data: %s", result)
        openapi_request = FlaskOpenAPIRequest(request)
        unmarshal_request(openapi_request, spec=spec)
        items = list(collection.aggregate([
            {
                '$addFields': {
                    'id': {'$toString': '$_id'},  # Convert _id to string and create a new field id
                }
            },
            {
                '$project': {
                    '_id': 0,  # Exclude the _id field
                }
            },

        ]))        

        return {"items": items}, 200
    except Exception as e:
        return {"error": str(e), "cause": str(e.__cause__)}, 400
    

@app.route('/transport-items', methods=['POST'])
@requires_auth
def add_transport_items():
    logger.debug(f"/transport-items POST endpoint was called")
    try:
        #logger.debug("Received transport items data: %s", result)
        openapi_request = FlaskOpenAPIRequest(request)
        result = unmarshal_request(openapi_request, spec=spec)

        # Extract relevant data from the result
        transport_items = result.body['transport-items']

        for transport_dict in transport_items:
            if transport_dict['origin'].get('admin_location'):
                origin_postal_code = transport_dict['origin'].get('admin_location').get('postal_code')
                destination_postal_code = transport_dict['destination'].get('admin_location').get('postal_code')
                origin_country = transport_dict['origin'].get('admin_location').get('country')
                destination_country = transport_dict['destination'].get('admin_location').get('country')
                if origin_postal_code and destination_postal_code and origin_country and destination_country:
                    origin_geo_location = postcode_handler.get_geo_location_from_post_code(origin_postal_code, country=origin_country)
                    destination_geo_location = postcode_handler.get_geo_location_from_post_code(destination_postal_code, country=destination_country)
                    logger.debug(f"origin geo location: {origin_geo_location}, destination geo location: {destination_geo_location}")
                    if origin_geo_location and destination_geo_location:
                        GeoUtil().add_geo_location_to_transport_dict(transport_dict=transport_dict, origin_geo_location=origin_geo_location, destination_geo_location=destination_geo_location)

        collection.insert_many(transport_items)
                
    except Exception as e:
        logger.exception({"error": str(e), "cause": str(e.__cause__)})
        return {"result": "internal server error"}, 500
    return {"result": "success"}, 200

@app.route('/vehicles/<id>', methods=['PUT'])
@requires_auth
def modify_vehicles(id):
    try:
        openapi_request = FlaskOpenAPIRequest(request)
        result = unmarshal_request(openapi_request, spec=spec)
    except Exception as e:
        logger.exception({"error": str(e), "cause": str(e.__cause__)})
        return {"error": str(e), "cause": str(e.__cause__)}, 400
    return {"result": "success"}, 200


if __name__ == "__main__":
    app.run(port=5000, host='0.0.0.0')