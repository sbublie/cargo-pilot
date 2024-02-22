
interface CargoItem {
    load_carrier: boolean;
    load_carrier_nestable: boolean;
    loading_meter: number;
    weight: number;
}

interface Vehicle {
    id: number;
    type: string;
    max_loading_meter: number;
    max_weight: number;
    stackable: boolean;
}

interface GeoLocation {
    lat: number;
    long: number;
}

interface AdminLocation {
    postal_code: number;
    city: string;
    country: string;
    street: string;
}

interface Location {
    id: number;
    timestamp: number;
    geo_location: GeoLocation;
    admin_location: AdminLocation;
}

export interface TransportItem {
    id: string;
    type: string;
    data_source: string;
    origin: Location;
    destination: Location;
    cargo_item: CargoItem;
    vehicle: Vehicle;
    customer: string;
    route_locations: [Location];
}

export interface TransportItemCollection {
    items: [TransportItem]
}