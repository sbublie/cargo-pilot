export class Cluster {
    // Assuming these are the properties of your Cluster class
    public center_lat: number;
    public center_long: number;
    public location_ids: Array<string>;
    public number_of_locations: number;
  
    constructor(center_lat: number, center_long: number, location_ids: Array<string>, number_of_locations: number) {
      this.center_lat = center_lat;
      this.center_long = center_long;
      this.location_ids = location_ids
      this.number_of_locations = number_of_locations
    }
  
    // Method to initialize class properties from JSON
    static fromJson(json: any): Cluster {
      return new Cluster(
        json.center_lat,
        json.center_long,
        json.location_ids,
        json.number_of_locations
      );
    }
  }