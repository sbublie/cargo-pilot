import pandas as pd
import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler

from models.transport_item import TransportItem, Location
from database_handler import DatabaseHandler
from models.cluster import Cluster


class ClusterHandler:
    def __init__(self, logger, eps=0.01, min_samples=5, ) -> None:
        self.eps = eps
        self.min_samples = min_samples
        self.logger = logger
        self.database_handler = DatabaseHandler(logger=logger)

    def __get_labels_from_locations(self, locations: list[Location]) -> list[Cluster]:

        lat_long_list = []
        for i, location in enumerate(locations):
            if i < 200000:
                lat_long_list.append(location.geo_location.get_lat_long_list())
        self.logger.debug(f"LatLong list: {lat_long_list}")

        if not lat_long_list:
            raise ValueError("Location list cannot be empty.")

        data = pd.DataFrame(lat_long_list, columns=['latitude', 'longitude'])

        scaler = StandardScaler()
        scaled_data = scaler.fit_transform(data)
        dbscan = DBSCAN(eps=self.eps, min_samples=self.min_samples)
        dbscan.fit(scaled_data)
        self.logger.debug(f"Detected cluster labels: {dbscan.labels_}")
        return dbscan.labels_
    
    def __get_cluster_from_labels(self, cluster_labels: list[int], locations: list[Location]):

        lat_long_list = []
        for i, location in enumerate(locations):
            if i < 200000:
                lat_long_list.append(location.geo_location.get_lat_long_list())
        self.logger.debug(f"LatLong list: {lat_long_list}")

        unique_clusters = set(cluster_labels)
        self.logger.debug(f"Unique cluster labels: {unique_clusters}")
        clusters = []
        # Initial value for new noise cluster ID
        noise_cluster_id = int(max(cluster_labels)) + 1  # Convert to int here

        for cluster_id in unique_clusters:
            self.logger.debug(f"Building cluster object with id {cluster_id}")
            # Extracting the locations of the current cluster
            cluster_points = np.array(lat_long_list)[
                np.array(cluster_labels) == cluster_id]
            # self.logger.debug(f"Filtered cluster points: {cluster_points}")

            if cluster_id == -1:  # noise points in DBSCAN are labeled as -1
                noise_cluster_location_ids = []  # Initialize list to store location IDs for noise cluster
                for point_index, point in enumerate(cluster_points):
                    # Add location ID to the list for each point in the noise cluster
                    noise_cluster_location_ids.append(locations[point_index].id)
                    self.logger.debug("Add noise cluster")
                    clusters.append(Cluster(id=noise_cluster_id, center_lat=round(point[0], 4), center_long=round(
                        point[1], 4), location_ids=[locations[point_index].id], number_of_locations=1))
                    noise_cluster_id += 1
                continue


            # Calculating the centroid (mean) of the cluster
            centroid = np.mean(cluster_points, axis=0)

            # Extracting the location ids of the current cluster
            location_ids = [location.id for i, location in enumerate(
                locations) if cluster_labels[i] == cluster_id]
            self.logger.debug(f"Location IDs for this cluster: {location_ids}")

            # Creating the Cluster object
            new_cluster = Cluster(id=int(cluster_id), center_lat=round(centroid[0], 4), center_long=round(
                centroid[1], 4), location_ids=location_ids, number_of_locations=len(location_ids))  # Convert to int here
            clusters.append(new_cluster)
            self.logger.debug(
                f"Cluster object{new_cluster} created and added to list {len(clusters)}")

        self.logger.debug(f"Now returning {len(clusters)} clusters")
        return clusters


    def get_cluster_from_transport_items(self, transport_items: list[TransportItem]) -> list[Cluster]:

        locations = []
        for transport_item in transport_items:
            if hasattr(transport_item.origin, 'geo_location') and hasattr(transport_item.destination, 'geo_location'):
                transport_item.origin.id = transport_item.id + "_o"
                transport_item.destination.id = transport_item.id + "_d"
                locations.append(transport_item.origin)
                locations.append(transport_item.destination)

        self.logger.debug(f"{len(locations)} will be clustered!")
        labels = self.__get_labels_from_locations(locations)
        cluster = self.__get_cluster_from_labels(cluster_labels=labels, locations=locations)

        return cluster


        
