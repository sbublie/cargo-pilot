from collections import defaultdict

from models.cluster import Cluster, ClusterRelation
from models.transport_item import TransportItem
from custom_logger import logger

class LoadAnalyzer:
    def __init__(self, ) -> None:
        #self.logger = logger
        pass


    def analyze(self, clusters: list[Cluster], transport_items: list[TransportItem]) -> list[ClusterRelation]:

        # Dictionary to store cluster relations
        cluster_relations = defaultdict(lambda: ClusterRelation(origin_cluster=None, destination_cluster=None, relation_count=0, all_loading_meter=[], all_weight=[]))

        # Populate location_cluster_relation dictionary
        location_cluster_relation = {}
        for cluster in clusters:
            for location_id in cluster.location_ids:
                location_cluster_relation[location_id] = cluster.id

        # Iterate through transport items and update cluster relations
        for transport_item in transport_items:
            origin_cluster_id = location_cluster_relation.get(transport_item.id + "_o", None)
            destination_cluster_id = location_cluster_relation.get(transport_item.id + "_d", None)

            # Skip if origin or destination cluster IDs are None
            if origin_cluster_id is None or destination_cluster_id is None:
                print("Dont ignore this!!!")
                continue

            # Update cluster relations
            relation_key = (origin_cluster_id, destination_cluster_id)
            cluster_relations[relation_key].origin_cluster = origin_cluster_id
            cluster_relations[relation_key].destination_cluster = destination_cluster_id
            cluster_relations[relation_key].relation_count += 1
            cluster_relations[relation_key].all_loading_meter.append(transport_item.cargo_item.loading_meter)
            cluster_relations[relation_key].all_weight.append(transport_item.cargo_item.weight)

        # Convert defaultdict to list of ClusterRelation objects
        cluster_relations_list = list(cluster_relations.values())

        for relation in cluster_relations_list:
            if len(relation.all_loading_meter) > 0 and len(relation.all_weight):
                relation.average_loading_meter = round( sum(relation.all_loading_meter) / len(relation.all_loading_meter), 2)
                relation.average_weight = round(sum(relation.all_weight) / len(relation.all_weight), 2)


        return cluster_relations_list
