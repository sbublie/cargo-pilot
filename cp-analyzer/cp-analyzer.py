from flask import Flask, request
import json

app = Flask(__name__)

@app.route('/api/uploader', methods=['POST'])
def receive_data():
    data = request.get_json()  

    print(data[0])
    print(len(data))
    return 'Data received successfully'


if __name__ == "__main__":
    app.run(port=5000)
