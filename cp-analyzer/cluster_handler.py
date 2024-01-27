import pandas as pd
import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
from models import Location, CargoOrder

from database_handler import DatabaseHandler
from cluster import Cluster


class ClusterHandler:
    def __init__(self, logger, eps=0.01, min_samples=5, ) -> None:
        self.eps = eps
        self.min_samples = min_samples
        self.logger = logger
        self.database_handler = DatabaseHandler(logger=logger)


    def __find_clusters(self, locations:list[Location]) -> list[Cluster]:

        lat_long_list = []
        for i, location in enumerate(locations):
            if i < 200000:
                lat_long_list.append(location.geo_location.get_lat_long_list())
        self.logger.debug(f"LatLong list: {lat_long_list}")
        cluster_labels = self.__detect_cluster(lat_long_list)
        self.logger.debug(f"Detected cluster labels: {cluster_labels}")
        unique_clusters = set(cluster_labels)
        self.logger.debug(f"Unique cluster labels: {unique_clusters}")
        clusters = []
        noise_cluster_id = max(cluster_labels) + 1  # Initial value for new noise cluster ID

        for cluster_id in unique_clusters:
            self.logger.debug(f"Building cluster object with id {cluster_id}")
            # Extracting the locations of the current cluster
            cluster_points = np.array(lat_long_list)[np.array(cluster_labels) == cluster_id]
            #self.logger.debug(f"Filtered cluster points: {cluster_points}")

            if cluster_id == -1:  # noise points in DBSCAN are labeled as -1
                for point in cluster_points:
                    self.logger.debug("Add noise cluster")
                    clusters.append(Cluster(center_lat=round(point[0], 4), center_long=round(point[1], 4), location_ids=[]))
                    noise_cluster_id += 1
                continue

            # Calculating the centroid (mean) of the cluster
            centroid = np.mean(cluster_points, axis=0)

            # Extracting the location ids of the current cluster
            location_ids = [location.id for i, location in enumerate(locations) if cluster_labels[i] == cluster_id]
            self.logger.debug(f"Location IDs for this cluster: {location_ids}")

            # Creating the Cluster object
            new_cluster = Cluster(center_lat=round(centroid[0], 4), center_long=round(centroid[1], 4), location_ids=location_ids)
            clusters.append(new_cluster)
            self.logger.debug(f"Cluster object{new_cluster} created and added to list {len(clusters)}")

        self.logger.debug(f"Now returing {len(clusters)} clusters")
        return clusters

    def get_cluster_from_orders(self, orders:list[CargoOrder]) -> list[Cluster]:

        locations = []
        for order in orders:
            if order.origin.geo_location.lat != None and order.destination.geo_location.lat != None:
                locations.append(order.origin)
                locations.append(order.destination)

        self.logger.debug(f"{len(locations)} will be clustered!")
        cluster = self.__find_clusters(locations)

        return cluster
            
    def cluster_locations_from_db(self):

        locations = self.database_handler.get_locations()
        clusters = self.__find_clusters(locations)
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