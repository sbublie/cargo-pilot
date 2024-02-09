from database_handler import DatabaseHandler
from collections import Counter
import json

class StatisticsEngine:

    def __init__(self, logger) -> None:
        self.logger = logger
        pass

    def get_statistics(self):
        offerings = DatabaseHandler(self.logger).get_cargo_orders()
        return {"result": len(offerings)}
