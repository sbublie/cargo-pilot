import requests
from env import REMOTE_API_ENDPOINT, REMOTE_CP_INSTANCE_URL, API_KEY

class APIHandler:
    def __init__(self) -> None:
        self.remote_URL = REMOTE_API_ENDPOINT + REMOTE_CP_INSTANCE_URL
        self.headers = {
            "Authorization": API_KEY,
            "Content-Type": "application/json"
        }

    def upload_data(self, data):
        # TODO: Error handling
        response = requests.post(self.remote_URL, data=data, headers=self.headers)
