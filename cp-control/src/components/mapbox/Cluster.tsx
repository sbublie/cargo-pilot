export class Cluster {
    // Assuming these are the properties of your Cluster class
    public id: number;
    public center_lat: number;
    public center_long: number;
    public location_ids: Array<string>;
    public number_of_locations: number;
  
    constructor(id: number, center_lat: number, center_long: number, location_ids: Array<string>, number_of_locations: number) {
      this.id = id
      this.center_lat = center_lat;
      this.center_long = center_long;
      this.location_ids = location_ids
      this.number_of_locations = number_of_locations
    }
  
    // Method to initialize class properties from JSON
    static fromJson(json: any): Cluster {
      return new Cluster(
        json.id,
        json.center_lat,
        json.center_long,
        json.location_ids,
        json.number_of_locations
      );
    }
  }

export class ClusterRelation {
  origin_cluster: number;
  destination_cluster: number;
  relation_count: number;

  constructor(origin_cluster: number, destination_cluster: number, relation_count: number) {
    this.origin_cluster = origin_cluster
    this.destination_cluster = destination_cluster
    this.relation_count = relation_count
  }

  static fromJson(json: any): ClusterRelation {
    return new ClusterRelation (
      json.origin_cluster,
      json.destination_cluster,
      json.relation_count
    )
  }
}