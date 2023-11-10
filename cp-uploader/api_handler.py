import requests
from env import API_ENDPOINT, REMOTE_CP_INSTANCE_URL, LOCAL_CP_INSTANCE_URL, API_KEY

CHUNK_SIZE = 100

class APIHandler:
    def __init__(self) -> None:
        self.headers = {
            "Authorization": API_KEY,
            "Content-Type": "application/json"
        }

    # Function to split the items into chunks
    def chunked_items(self, items, chunk_size=CHUNK_SIZE):
        """Yield successive n-sized chunks from a list."""
        for i in range(0, len(items), chunk_size):
            yield items[i:i + chunk_size]


    def upload_data(self, data, data_type, instance):
        # TODO: Error handling
        url = REMOTE_CP_INSTANCE_URL + API_ENDPOINT
        if instance == "Local":
            url = LOCAL_CP_INSTANCE_URL + API_ENDPOINT
        
        if data_type == "Cargo Orders":
            url += "/cargo-orders"
        elif data_type == "Past Trips":
            url += "/trips"

        num_chunks = -(-len(data) // CHUNK_SIZE)

        # Upload the data in chunks to avoid overloading the API server
        for index, chunk in enumerate(self.chunked_items(data)):

            # Iterate over the data items of the list to convert the data models to a json string using thier conversion methods
            chunk_list = []
            for item in chunk:
                chunk_list.append(item.to_json())
                
            response = requests.post(url=url, json=chunk_list, headers=self.headers)
            if response.status_code == 200:
                print(f"Chunk {index+1} of {num_chunks} uploaded successfully!")
            else:
                print(f"Failed to upload chunk! Status code: {response.status_code}")
