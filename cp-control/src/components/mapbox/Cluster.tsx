export class Cluster {
    // Assuming these are the properties of your Cluster class
    public center_lat: number;
    public center_long: number;
    public location_ids: Array<string>;
  
    constructor(center_lat: number, center_long: number, location_ids: Array<string>) {
      this.center_lat = center_lat;
      this.center_long = center_long;
      this.location_ids = location_ids
    }
  
    // Method to initialize class properties from JSON
    static fromJson(json: any): Cluster {
      return new Cluster(
        json.center_lat,
        json.center_long,
        json.location_ids
      );
    }
  }