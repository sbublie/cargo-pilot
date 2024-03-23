from models.models import Location, CompletedTrip, Cluster, CargoOrder
from models.transport_item import TransportItem
import requests
import json
from logging import Logger
from requests.exceptions import RequestException
from env import DB_URL, DB_AUTH

class DatabaseHandler:

    def __init__(self, logger:Logger) -> None:
        self.logger = logger

    def get_transport_items(self, data_source=None) -> list[TransportItem]:
        self.logger.debug("Getting transport items from DB")
        
        url = DB_URL + "/transport-items"
        if data_source:
            url += f"?data-source={data_source}"
        
        response = requests.get(url, headers={"Authorization": DB_AUTH})
        self.logger.debug(f"Response: {response}")
        data = response.json()['items']
        transport_items = [TransportItem(**item) for item in data]
        self.logger.debug(f"Got {len(transport_items)} orders from DB")
        return transport_items



