import pandas as pd
import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler

from database_handler import DatabaseHandler
from cluster import Cluster


class ClusterHandler:
    def __init__(self, eps=0.5, min_samples=2) -> None:
        self.eps = eps
        self.min_samples = min_samples
        self.database_handler = DatabaseHandler()

    def cluster_locations_from_db(self):

        locations = self.database_handler.get_locations()

        lat_long_list = []
        clusters = []

        for location in locations:
            lat_long_list.append(location.get_lat_long_list())

        cluster_labels = self.__detect_cluster(lat_long_list)
        
        for cluster_id in set(cluster_labels):
            
            clusters.append(Cluster(center_lat=48, center_long=8, location_ids=[]))

        for i, location in enumerate(locations):
            
            clusters[cluster_labels[i]].location_ids.append(location.id)

        self.database_handler.add_clusters(clusters)

    def __detect_cluster(self, location_list: list[list[int, int]]):
        if not location_list:
            raise ValueError("Location list cannot be empty.")

        data = pd.DataFrame(location_list, columns=['latitude', 'longitude'])

        scaler = StandardScaler()
        scaled_data = scaler.fit_transform(data)
        dbscan = DBSCAN(eps=self.eps, min_samples=self.min_samples)
        dbscan.fit(scaled_data)

        return dbscan.labels_
