import { FeatureCollection, Point, Feature } from "geojson";
import { Map as MapboxMap } from "mapbox-gl";
import { Cluster } from "./Cluster";

interface Offering {
  id: number;
  load_weight: number;
  load_meter: number;
  load_percentage: number;
  origin: {
    geo_location: {
      long: number;
      lat: number;
    }
    admin_location: {
      postal_code: string;
      city: string;
      country: string
    }
    id: number;
  };
  destination: {
    geo_location: {
      long: number;
      lat: number;
    }
    admin_location: {
      postal_code: string;
      city: string;
      country: string
    }
    id: number;
  };
}

const heightFactor = 500;

export function setCityBoundariesGeoJson(
  boundaries: FeatureCollection,
  offerings: Offering[]
) {
  const cityCodes: Record<string, number> = {};

  const incrementCityCodeCount = (zipCode: number) => {
    cityCodes[zipCode] = (cityCodes[zipCode] || 0) + 1;
  };

  offerings.forEach((offering) => {
    incrementCityCodeCount(parseInt(offering.origin.admin_location.postal_code));
    incrementCityCodeCount(parseInt(offering.destination.admin_location.postal_code));
  });

  if (boundaries.features) {
    const newFeatures = boundaries.features.filter((feature) => {
      const numberOfCityCodes =
        cityCodes[parseInt(feature?.properties?.postcode, 10)];
      if (numberOfCityCodes && feature?.properties) {
        feature.properties.height = numberOfCityCodes * heightFactor;
        feature.properties.base_height = 0;
        feature.properties.color = "#4287f5";
        return true;
      } else if (feature?.properties) {
        feature.properties.color = "white";
        return false;
      }
    });
    boundaries.features = newFeatures;
  }
}



export function addCityBoundariesToMap(
  map: MapboxMap,
  boundaries: FeatureCollection
) {
  const source = map.getSource("germany") as mapboxgl.GeoJSONSource;

  if (!source) {
    map.addSource("germany", {
      type: "geojson",
      buffer: 500,
      tolerance: 2,

      //Each feature in this GeoJSON file contains values for
      // `properties.height`, `properties.base_height`,
      // and `properties.color`.
      // In `addLayer` you will use expressions to set the new
      // layer's paint properties based on these values.

      // @ts-ignore
      data: boundaries,
    });

    map.addLayer({
      id: "germany_overlay",
      type: "fill-extrusion",
      source: "germany",
      paint: {
        // Get the `fill-extrusion-color` from the source `color` property.
        "fill-extrusion-color": ["get", "color"],

        // Get `fill-extrusion-height` from the source `height` property.
        "fill-extrusion-height": ["get", "height"],

        // Get `fill-extrusion-base` from the source `base_height` property.
        "fill-extrusion-base": ["get", "base_height"],

        // Make extrusions slightly opaque to see through indoor walls.
        "fill-extrusion-opacity": 1,
      },
    });

    map.setLayoutProperty("germany_overlay", "visibility", "none");
  } else {
    source.setData(boundaries);
  }
}


export function getClusterGeoJson(clusters: Cluster[]): FeatureCollection<Point> {

  const clusterMarkerData: FeatureCollection<Point> = {
    type: "FeatureCollection",
    features: [],
  };

  clusters.forEach((cluster) => {

    var numClusterItems = cluster.location_ids.length
    if (numClusterItems == 0) {
      numClusterItems += 1;
    }

    const clusterMarker: Feature<Point> = {
      type: "Feature",
      properties: {
        numLocations: cluster.number_of_locations,
      },
      geometry: {
        type: "Point",
        coordinates: [cluster.center_long, cluster.center_lat],
      },
    }

    clusterMarkerData.features.push(clusterMarker)
  })
  return clusterMarkerData
}

export function addClusterToMap(map: MapboxMap, clusters: FeatureCollection) {
  const source = map.getSource(
    "cluster_data"
  ) as mapboxgl.GeoJSONSource;

  if (!source) {
    map.addSource(`cluster_data`, {
      type: "geojson",
      data: clusters,
    });

    map.addLayer({
      id: "cluster",
      type: "circle",
      source: "cluster_data",
      paint: {
        "circle-color": "#3399ff",
        "circle-radius": 20,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#fff",
      },
    });

    map.addLayer({
      id: 'cluster_count',
      type: 'symbol',
      source: 'cluster_data',
      layout: {
      'text-field': ['get', 'numLocations'],
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 12
      }
      });
  } else {
    source.setData(clusters);
  }
}