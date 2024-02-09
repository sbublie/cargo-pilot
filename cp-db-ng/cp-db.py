import logging
from functools import wraps
from logging.handlers import RotatingFileHandler
from bson import json_util

from flask import Flask, request, Response, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from openapi_core import Spec, unmarshal_request
from openapi_core.contrib.flask import FlaskOpenAPIRequest




# MongoDB connection details
mongo_host = 'mongodb'
mongo_port = 27017
mongo_db_name = 'my_database'

# Connect to MongoDB
client = MongoClient(mongo_host, mongo_port, username='user', password='pass')
db = client[mongo_db_name]
collection = db['my_collection1']

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

        collection.insert_many(transport_items)
        
    except Exception as e:
        return {"error": str(e), "cause": str(e.__cause__)}, 400
    return {"result": "success"}, 200

if __name__ == "__main__":
    app.run(port=5000, host='0.0.0.0')