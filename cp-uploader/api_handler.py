import requests
from env import API_ENDPOINT, REMOTE_CP_INSTANCE_URL, LOCAL_CP_INSTANCE_URL, API_KEY

class APIHandler:
    def __init__(self) -> None:
        self.headers = {
            "Authorization": API_KEY,
            "Content-Type": "application/json"
        }

    def upload_data(self, data, data_type, instance):
        # TODO: Error handling
        url = REMOTE_CP_INSTANCE_URL + API_ENDPOINT
        if instance == "Local":
            url = LOCAL_CP_INSTANCE_URL + API_ENDPOINT

        print(url)
        if data_type == "Offerings":
            url += "/offerings"
        elif data_type == "Trips":
            url += "/trips"
            
        response = requests.post(url=url, data=data, headers=self.headers)
        
        print(response.text)
