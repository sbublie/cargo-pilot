import { FeatureCollection, Point, Feature } from "geojson";
import mapboxgl from "mapbox-gl";
import { Map as MapboxMap } from "mapbox-gl";

import { TransportItem } from "./models/TransportItem";
import { Settings } from "./models/Settings";

export function getTransportItemGeoJson(
  transportItems: TransportItem[],
  settings: Settings
): FeatureCollection<Point> {
  const transportItemData: FeatureCollection<Point> = {
    type: "FeatureCollection",
    features: [],
  };

  var minTimestamp = 0;
  var maxTimestamp = 99999999999;

  if (settings.applyFilter) {
    minTimestamp = settings.startTimestamp;
    maxTimestamp = settings.endTimestamp;
  }

  transportItems.forEach((transportItem) => {
    if (
      transportItem.origin.geo_location !== undefined &&
      transportItem.origin.geo_location !== null &&
      transportItem.destination.geo_location !== undefined &&
      transportItem.destination.geo_location !== null &&
      transportItem.origin.timestamp >= minTimestamp &&
      transportItem.destination.timestamp <= maxTimestamp
    ) {
      if (settings.dataSource.includes(transportItem.data_source)) {
        let origin_city = "None";
        if (transportItem.origin.admin_location != null) {
          origin_city = transportItem.origin.admin_location.city;
        }

        const origin_marker: Feature<Point> = {
          type: "Feature",
          properties: {
            color: "green",
            type: "Origin",
            id: transportItem.id,
            city: origin_city,
            source: transportItem.data_source,
            timestamp: transportItem.origin.timestamp,
            loading_meter: transportItem.cargo_item.loading_meter,
            weight: transportItem.cargo_item.weight,
          },
          geometry: {
            type: "Point",
            coordinates: [
              transportItem.origin.geo_location.long,
              transportItem.origin.geo_location.lat,
            ],
          },
        };

        let destination_city = "None";
        if (transportItem.origin.admin_location != null) {
          destination_city = transportItem.origin.admin_location.city;
        }

        const destination_marker: Feature<Point> = {
          type: "Feature",
          properties: {
            color: "red",
            type: "Destination",
            id: transportItem.id,
            city: destination_city,
            source: transportItem.data_source,
            timestamp: transportItem.destination.timestamp,
            loading_meter: transportItem.cargo_item.loading_meter,
            weight: transportItem.cargo_item.weight,
          },
          geometry: {
            type: "Point",
            coordinates: [
              transportItem.destination.geo_location.long,
              transportItem.destination.geo_location.lat,
            ],
          },
        };

        transportItemData.features.push(origin_marker);
        transportItemData.features.push(destination_marker);
      }
    }
  });
  return transportItemData;
}

export const addTransportItemsToMap = (
  map: MapboxMap,
  transportItems: FeatureCollection
) => {
  const source = map.getSource(
    "transport_items_marker_data"
  ) as mapboxgl.GeoJSONSource;

  if (!source) {
    map.addSource("transport_items_marker_data", {
      type: "geojson",
      data: transportItems,
    });

    map.addLayer({
      id: "transport_items_markers",
      type: "circle",
      source: "transport_items_marker_data",
      paint: {
        "circle-color": ["get", "color"],
        "circle-radius": 10,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#fff",
      },
    });

    map.on("click", "transport_items_markers", (e) => {
      const feature = e.features?.[0];
      if (feature) {
        const dateString = new Date(
          feature.properties?.timestamp * 1000
        ).toLocaleString("de-DE");

        // Assert that geometry is of a type that has coordinates
        const geometry =
          feature.geometry as mapboxgl.MapboxGeoJSONFeature["geometry"];
        const description = `<b><h7>Item #${feature.properties?.id}</h7></b><br/>Type: ${feature.properties?.type}<br/>Source: ${feature.properties?.source}<br/>Time: ${dateString}<br/>Load Meter: ${feature.properties?.loading_meter}m<br/>Load Weight: ${feature.properties?.weight}kg`;

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

    map.on("mouseenter", "transport_items_markers", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "transport_items_markers", () => {
      map.getCanvas().style.cursor = "";
    });

    map.setLayoutProperty("transport_items_markers", "visibility", "none");
  } else {
    source.setData(transportItems);
  }
};
