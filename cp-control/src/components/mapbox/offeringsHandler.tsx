import { Map as MapboxMap, MapMouseEvent } from "mapbox-gl";
import mapboxgl from "mapbox-gl";
import { FeatureCollection, Point, Feature } from "geojson";

interface Offering {
  id: number;
  load_weight: number;
  load_meter: number;
  load_percentage: number;
  source: string;
  origin: {
    id: number;
    zip_code: number;
    city: string;
    long: number;
    lat: number;
    timestamp: number;
  };
  destination: {
    id: number;
    zip_code: number;
    city: string;
    long: number;
    lat: number;
    timestamp: number;
  };
}

export const getOfferingsGeoJson = (offerings: Offering[]) => {
  const offeringMarkerData: FeatureCollection<Point> = {
    type: "FeatureCollection",
    features: [],
  };

  offerings.forEach((offering) => {
    const origin_marker: Feature<Point> = {
      type: "Feature",
      properties: {
        color: "green",
        type: "Origin",
        id: offering.origin.id,
        city: offering.origin.city,
        source: offering.source,
        timestamp: offering.origin.timestamp,
      },
      geometry: {
        type: "Point",
        coordinates: [offering.origin.long, offering.origin.lat],
      },
    };

    const destination_marker: Feature<Point> = {
      type: "Feature",
      properties: {
        color: "red",
        type: "Destination",
        city: offering.destination.city,
        id: offering.destination.id,
        source: offering.source,
        timestamp: offering.destination.timestamp,
      },
      geometry: {
        type: "Point",
        coordinates: [offering.destination.long, offering.destination.lat],
      },
    };

    offeringMarkerData.features.push(origin_marker);
    offeringMarkerData.features.push(destination_marker);
  });

  return offeringMarkerData;
};

export const addOfferingsToMap = (
  map: MapboxMap,
  offerings: FeatureCollection
) => {
  const source = map.getSource(
    "offering_marker_data"
  ) as mapboxgl.GeoJSONSource;

  if (!source) {
    map.addSource(`offering_marker_data`, {
      type: "geojson",
      data: offerings,
    });

    map.addLayer({
      id: "offering_markers",
      type: "symbol",
      source: "offering_marker_data",
      layout: {
        "icon-image": "custom-marker",
        "icon-offset": [0, -20],
      },
    });

    map.setLayoutProperty("offering_markers", "visibility", "none");
  } else {
    source.setData(offerings);
  }
};

export function addOfferingClusterToMap(
  map: MapboxMap,
  offerings: FeatureCollection
) {
  const source = map.getSource(
    "offering_cluster_data"
  ) as mapboxgl.GeoJSONSource;

  if (!source) {
    console.log("add source");
    map.addSource("offering_cluster_data", {
      type: "geojson",
      // Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
      // from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
      data: offerings,
      cluster: true,
      clusterMaxZoom: 14, // Max zoom to cluster points on
      clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
    });

    map.addLayer({
      id: "offering_clusters",
      type: "circle",
      source: "offering_cluster_data",
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
      id: "offering_cluster_count",
      type: "symbol",
      source: "offering_cluster_data",
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
        "text-size": 12,
      },
    });

    map.addLayer({
      id: "unclustered_offering",
      type: "circle",
      source: "offering_cluster_data",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": ["get", "color"],
        "circle-radius": 10,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#fff",
      },
    });

    map.on("click", "unclustered_offering", (e) => {
      const feature = e.features?.[0];
      if (feature) {
        const dateString = new Date(
          feature.properties?.timestamp * 1000
        ).toLocaleString("de-DE");

        // Assert that geometry is of a type that has coordinates
        const geometry =
          feature.geometry as mapboxgl.MapboxGeoJSONFeature["geometry"];
        const description = `<b><h7>Location #${feature.properties?.id}</h7></b><br/>Source: ${feature.properties?.source}<br/>Time: ${dateString}`;

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
      "offering_clusters",
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
          "offering_cluster_data"
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

    map.on("mouseenter", "unclustered_offering", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "unclustered_offering", () => {
      map.getCanvas().style.cursor = "";
    });

    map.on("mouseenter", "offering_clusters", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "offering_clusters", () => {
      map.getCanvas().style.cursor = "";
    });
  }
}
