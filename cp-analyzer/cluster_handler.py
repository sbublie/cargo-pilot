import pandas as pd
import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler

from database_handler import DatabaseHandler
from cluster import Cluster


class ClusterHandler:
    def __init__(self, eps=0.01, min_samples=5) -> None:
        self.eps = eps
        self.min_samples = min_samples
        self.database_handler = DatabaseHandler()

    def cluster_locations_from_db(self):

        locations = self.database_handler.get_locations()

        lat_long_list = []
        for i, location in enumerate(locations):
            if i < 200000:
                lat_long_list.append(location.get_lat_long_list())

        cluster_labels = self.__detect_cluster(lat_long_list)
        unique_clusters = set(cluster_labels)

        clusters = []
        noise_cluster_id = max(cluster_labels) + 1  # Initial value for new noise cluster ID

        for cluster_id in unique_clusters:

            # Extracting the locations of the current cluster
            cluster_points = np.array(lat_long_list)[np.array(cluster_labels) == cluster_id]

            if cluster_id == -1:  # noise points in DBSCAN are labeled as -1
                for point in cluster_points:
                    #clusters.append(Cluster(center_lat=point[0], center_long=point[1], location_ids=[locations[i].id for i, label in enumerate(cluster_labels) if label == cluster_id]))
                    noise_cluster_id += 1
                continue

            # Calculating the centroid (mean) of the cluster
            centroid = np.mean(cluster_points, axis=0)

            # Extracting the location ids of the current cluster
            location_ids = [location.id for i, location in enumerate(locations) if cluster_labels[i] == cluster_id]

            # Creating the Cluster object
            clusters.append(Cluster(center_lat=centroid[0], center_long=centroid[1], location_ids=location_ids))

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