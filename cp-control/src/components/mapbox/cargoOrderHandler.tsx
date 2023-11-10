import { Map as MapboxMap, MapMouseEvent } from "mapbox-gl";
import mapboxgl from "mapbox-gl";
import { FeatureCollection, Point, Feature } from "geojson";

interface CargoOrder {
  id: number;
  data_source: string;
  origin: {
    id: number;
    timestamp: number;
    admin_location: {
      postal_code: string;
      city: string;
      country: string;
    }
    geo_location: {
      lat: number;
      long: number;
    }
  };
  destination: {
    id: number;
    timestamp: number;
    admin_location: {
      postal_code: string;
      city: string;
      country: string;
    }
    geo_location: {
      lat: number;
      long: number;
    }
  };
  cargo_item: {
    loading_meter: number;
    weight: number;
    load_carrier: boolean;
    load_carrier_nestable: boolean;
  }
}

export const getCargoOrderGeoJson = (cargoOrders: CargoOrder[]) => {
  const cargoOrderMarkerData: FeatureCollection<Point> = {
    type: "FeatureCollection",
    features: [],
  };

  cargoOrders.forEach((order) => {
    if (order.origin.geo_location !== undefined && order.destination.geo_location !== undefined) {
    const origin_marker: Feature<Point> = {
      type: "Feature",
      properties: {
        color: "green",
        type: "Origin",
        id: order.id,
        city: order.origin.admin_location.city,
        source: order.data_source,
        timestamp: order.origin.timestamp,
        loading_meter: order.cargo_item.loading_meter,
        weight: order.cargo_item.weight
      },
      geometry: {
        type: "Point",
        coordinates: [order.origin.geo_location.long, order.origin.geo_location.lat],
      },
    };

    const destination_marker: Feature<Point> = {
      type: "Feature",
      properties: {
        color: "red",
        type: "Destination",
        id: order.destination.id,
        city: order.destination.admin_location.city,
        source: order.data_source,
        timestamp: order.destination.timestamp,
        loading_meter: order.cargo_item.loading_meter,
        weight: order.cargo_item.weight
      },
      geometry: {
        type: "Point",
        coordinates: [order.destination.geo_location.long, order.destination.geo_location.lat],
      },
    };

    cargoOrderMarkerData.features.push(origin_marker);
    cargoOrderMarkerData.features.push(destination_marker);
  }
  });

  return cargoOrderMarkerData;
};

export const addCargoOrdersToMap = (
  map: MapboxMap,
  cargoOrders: FeatureCollection
) => {
  const source = map.getSource(
    "cargo_order_marker_data"
  ) as mapboxgl.GeoJSONSource;

  if (!source) {
    map.addSource("cargo_order_marker_data", {
      type: "geojson",
      data: cargoOrders,
    });

    map.addLayer({
      id: "cargo_order_markers",
      type: "circle",
      source: "cargo_order_marker_data",
      paint: {
        "circle-color": ["get", "color"],
        "circle-radius": 10,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#fff",
      },
    });

    map.on("click", "cargo_order_markers", (e) => {
      const feature = e.features?.[0];
      if (feature) {
        const dateString = new Date(
          feature.properties?.timestamp * 1000
        ).toLocaleString("de-DE");

        // Assert that geometry is of a type that has coordinates
        const geometry =
          feature.geometry as mapboxgl.MapboxGeoJSONFeature["geometry"];
        const description = `<b><h7>Order #${feature.properties?.id}</h7></b><br/>Type: ${feature.properties?.type}<br/>Source: ${feature.properties?.source}<br/>Time: ${dateString}<br/>Load Meter: ${feature.properties?.loading_meter}m<br/>Load Weight: ${feature.properties?.weight}kg`;

        if (
          geometry.type !== "GeometryCollection" &&
          geometry.coordinates &&
          description
        ) {
          if (geometry.type === "Point") {
            let coordinates = geometry.coordinates.slice() as [number, number];

            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            new mapboxgl.Popup()
              .setLngLat(coordinates)
              .setHTML(description)
              .addTo(map);
          } else {
            console.error("Geometry type is not a Point");
          }
        } else {
          console.error("Feature geometry or properties are undefined");
        }
      }
    });

    map.on("mouseenter", "cargo_order_markers", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "cargo_order_markers", () => {
      map.getCanvas().style.cursor = "";
    });

    map.setLayoutProperty("cargo_order_markers", "visibility", "none");
  } else {
    source.setData(cargoOrders);
  }
};

export function addCargoOrderClusterToMap(
  map: MapboxMap,
  cargoOrders: FeatureCollection
) {
  const source = map.getSource(
    "cargo_order_cluster_data"
  ) as mapboxgl.GeoJSONSource;

  if (!source) {
    console.log("add source");
    map.addSource("cargo_order_cluster_data", {
      type: "geojson",
      // Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
      // from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
      data: cargoOrders,
      cluster: true,
      clusterMaxZoom: 14, // Max zoom to cluster points on
      clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
    });

    map.addLayer({
      id: "cargo_order_clusters",
      type: "circle",
      source: "cargo_order_cluster_data",
      filter: ["has", "point_count"],
      paint: {
        // Use step expressions (https://docs.mapbox.com/style-spec/reference/expressions/#step)
        // with three steps to implement three types of circles:
        //   * Blue, 20px circles when point count is less than 100
        //   * Yellow, 30px circles when point count is between 100 and 750
        //   * Pink, 40px circles when point count is greater than or equal to 750
        "circle-color": [
          "step",
          ["get", "point_count"],
          "#51bbd6",
          100,
          "#f1f075",
          750,
          "#f28cb1",
        ],
        "circle-radius": ["step", ["get", "point_count"], 20, 100, 30, 750, 40],
      },
    });

    map.addLayer({
      id: "cargo_order_cluster_count",
      type: "symbol",
      source: "cargo_order_cluster_data",
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
        "text-size": 12,
      },
    });

    map.addLayer({
      id: "unclustered_cargo_order",
      type: "circle",
      source: "cargo_order_cluster_data",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": ["get", "color"],
        "circle-radius": 10,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#fff",
      },
    });

    map.on("click", "unclustered_cargo_order", (e) => {
      const feature = e.features?.[0];
      if (feature) {
        const dateString = new Date(
          feature.properties?.timestamp * 1000
        ).toLocaleString("de-DE");

        // Assert that geometry is of a type that has coordinates
        const geometry =
          feature.geometry as mapboxgl.MapboxGeoJSONFeature["geometry"];
        const description = `<b><h7>Order #${feature.properties?.id}</h7></b><br/>Source: ${feature.properties?.source}<br/>Time: ${dateString}`;

        if (
          geometry.type !== "GeometryCollection" &&
          geometry.coordinates &&
          description
        ) {
          if (geometry.type === "Point") {
            let coordinates = geometry.coordinates.slice() as [number, number];

            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            new mapboxgl.Popup()
              .setLngLat(coordinates)
              .setHTML(description)
              .addTo(map);
          } else {
            console.error("Geometry type is not a Point");
          }
        } else {
          console.error("Feature geometry or properties are undefined");
        }
      }
    });

    // inspect a cluster on click
    map.on(
      "click",
      "cargo_order_clusters",
      (e: MapMouseEvent & { features?: Array<any> }) => {
        // Ensure that features exist and it's not an empty array
        if (!e.features || e.features.length === 0) {
          return;
        }

        const clusterId = e.features[0].properties?.cluster_id;
        const coordinates = e.features[0].geometry?.coordinates;

        // Ensure that clusterId and coordinates exist
        if (!clusterId || !coordinates) {
          return;
        }

        const source = map.getSource(
          "cargo_order_cluster_data"
        ) as mapboxgl.GeoJSONSource; // Type cast to GeoJSONSource

        if (!source.getClusterExpansionZoom) {
          console.error(
            "Source does not have the method 'getClusterExpansionZoom'."
          );
          return;
        }

        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;

          map.easeTo({
            center: coordinates,
            zoom: zoom,
          });
        });
      }
    );

    map.on("mouseenter", "unclustered_cargo_order", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "unclustered_cargo_order", () => {
      map.getCanvas().style.cursor = "";
    });

    map.on("mouseenter", "cargo_order_clusters", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "cargo_order_clusters", () => {
      map.getCanvas().style.cursor = "";
    });
  }
}
