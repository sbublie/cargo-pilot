import { Map as MapboxMap } from "mapbox-gl";
import mapboxgl from "mapbox-gl";
import {
  FeatureCollection,
  Point,
  Feature,
  LineString,
  Polygon,
} from "geojson";

const heightFactor = 500;
const markerLimit = 1000;

interface Offering {
  id: number;
  load_weight: number;
  load_meter: number;
  load_percentage: number;
  origin: {
    id: number;
    zip_code: number;
    city: string;
    long: number;
    lat: number;
  };
  destination: {
    id: number;
    zip_code: number;
    city: string;
    long: number;
    lat: number;
  };
}

export const setupMapFeatures = (
  map: MapboxMap,
  trips: Offering[],
  offerings: Offering[],
  boundaries: FeatureCollection<Polygon>
) => {
  console.log(boundaries);

  map.addControl(new mapboxgl.NavigationControl(), "top-left");

  const tripMarkerData: FeatureCollection<Point> = {
    type: "FeatureCollection",
    features: [],
  };

  const offeringMarkerData: FeatureCollection<Point> = {
    type: "FeatureCollection",
    features: [],
  };

  const tripLineData: FeatureCollection<LineString> = {
    type: "FeatureCollection",
    features: [],
  };

  const offeringLineData: FeatureCollection<LineString> = {
    type: "FeatureCollection",
    features: [],
  };

  const cityCodes: Record<string, number> = {};

  const incrementCityCodeCount = (zipCode: number) => {
    cityCodes[zipCode] = (cityCodes[zipCode] || 0) + 1;
  };

  trips.forEach((trip) => {

    //if (i < markerLimit) {

    const origin_marker: Feature<Point> = {
      type: "Feature",
      properties: {
        color: "green",
        type: "Origin",
        id: trip.origin.id,
        city: trip.origin.city,
      },
      geometry: {
        type: "Point",
        coordinates: [trip.origin.long, trip.origin.lat],
      },
    };

    const destination_marker: Feature<Point> = {
      type: "Feature",
      properties: {
        color: "red",
        type: "Destination",
        city: trip.destination.city,
        id: trip.destination.id,
      },
      geometry: {
        type: "Point",
        coordinates: [trip.destination.long, trip.destination.lat],
      },
    };

    tripMarkerData.features.push(origin_marker);
    tripMarkerData.features.push(destination_marker);

    const newLine: Feature<LineString> = {
      type: "Feature",
      properties: { trip_id: trip.id, load_percentage: trip.load_percentage },
      geometry: {
        type: "LineString",
        coordinates: [
          [trip.origin.long, trip.origin.lat],
          [trip.destination.long, trip.destination.lat],
        ],
      },
    };
    tripLineData.features.push(newLine);
  //}
  });

  offerings.forEach((offering, i) => {
    incrementCityCodeCount(offering.origin.zip_code);
    incrementCityCodeCount(offering.destination.zip_code);

    if (i < markerLimit) {

      const origin_marker: Feature<Point> = {
        type: "Feature",
        properties: {
          color: "green",
          type: "Origin",
          id: offering.origin.id,
          city: offering.origin.city,
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
        },
        geometry: {
          type: "Point",
          coordinates: [offering.destination.long, offering.destination.lat],
        },
      };

      offeringMarkerData.features.push(origin_marker);
      offeringMarkerData.features.push(destination_marker);

      const newLine: Feature<LineString> = {
        type: "Feature",
        properties: {
          offering_id: offering.id,
          load_meter: offering.load_meter,
          load_weight: offering.load_weight,
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [offering.origin.long, offering.origin.lat],
            [offering.destination.long, offering.destination.lat],
          ],
        },
      };
      offeringLineData.features.push(newLine);
    }
  });

  map.loadImage(
    "https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png",
    (error?: Error, image?: HTMLImageElement | ImageBitmap) => {
      if (error) throw error;
      if (image) {
        map.addImage("custom-marker", image);
      }
    }
  );

  map.addSource(`trip_marker_data`, {
    type: "geojson",
    data: tripMarkerData,
  });

  map.addLayer({
    id: "trip_markers",
    type: "symbol",
    source: "trip_marker_data",
    layout: {
      "icon-image": "custom-marker",
      "icon-offset": [0, -20],
    },
  });

  map.addSource(`offering_marker_data`, {
    type: "geojson",
    data: offeringMarkerData,
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

  map.addSource(`trip_line_data`, {
    type: "geojson",
    data: tripLineData,
  });

  map.addSource(`offering_line_data`, {
    type: "geojson",
    data: offeringLineData,
  });

  map.addLayer({
    id: `trip_lines`,
    type: "line",
    source: `trip_line_data`,
    paint: {
      "line-width": 4,
      "line-color": "grey",
      "line-opacity": 0.4,
    },
  });

  map.addLayer({
    id: `offering_lines`,
    type: "line",
    source: `offering_line_data`,
    paint: {
      "line-width": 4,
      "line-color": "grey",
      "line-opacity": 0.4,
    },
  });

  // add a line layer with line-dasharray set to the first value in dashArraySequence
  map.addLayer({
    type: "line",
    source: "offering_line_data",
    id: "line-dashed",
    paint: {
      "line-color": "red",
      "line-width": 6,
      "line-dasharray": [0, 4, 3],
    },
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
  }

  // When a click event occurs on a feature in the places layer, open a popup at the
  // location of the feature, with description HTML from its properties.
  map.on("click", "trip_markers", (e) => {
    const feature = e.features?.[0];
    if (feature) {
      // Assert that geometry is of a type that has coordinates
      const geometry =
        feature.geometry as mapboxgl.MapboxGeoJSONFeature["geometry"];
      const description = `<b><h7>${feature.properties?.type}</h7></b><br/>ID: ${feature.properties?.id}`;

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

  map.on("click", "trip_lines", (e) => {
    const feature = e.features?.[0];
    if (feature) {
      // Assert that geometry is of a type that has coordinates
      const geometry =
        feature.geometry as mapboxgl.MapboxGeoJSONFeature["geometry"];
      const description = `<b><h7>Trip ID: ${feature.properties?.trip_id}</h7></b><br/>Load: ${feature.properties?.load_percentage}%`;

      if (
        geometry.type !== "GeometryCollection" &&
        geometry.coordinates &&
        description
      ) {
        if (geometry.type === "LineString") {
          const coordinates = [e.lngLat.lng, e.lngLat.lat];

          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          new mapboxgl.Popup()
            .setLngLat(coordinates as [number, number])
            .setHTML(description)
            .addTo(map);
        } else {
          console.error("Geometry type is not a Line");
        }
      } else {
        console.error("Feature geometry or properties are undefined");
      }
    }
  });

  map.on("click", "offering_markers", (e) => {
    const feature = e.features?.[0];
    if (feature) {
      // Assert that geometry is of a type that has coordinates
      const geometry =
        feature.geometry as mapboxgl.MapboxGeoJSONFeature["geometry"];

      const city = feature.properties?.city;
      const city_lower = city.charAt(0).toUpperCase() + city.slice(1);

      const description = `<b><h7>${feature.properties?.type}</h7></b><br/>ID: ${feature.properties?.id}<br/>City: ${city_lower} `;

      if (
        geometry.type !== "GeometryCollection" &&
        geometry.coordinates &&
        description
      ) {
        const coordinates = [e.lngLat.lng, e.lngLat.lat];

        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        new mapboxgl.Popup()
          .setLngLat(coordinates as [number, number])
          .setHTML(description)
          .addTo(map);
      } else {
        console.error("Feature geometry or properties are undefined");
      }
    }
  });

  map.on("click", "germany_overlay", (e) => {
    if (!e.features || !e.features[0]?.properties) {
      console.error("Feature properties are undefined");
      return;
    }

    const coordinates = [e.lngLat.lng, e.lngLat.lat];
    const { name, postcode, height } = e.features[0].properties;

    const description = `<b><h7>${name}</h7></b><br /><h7>Postcode: ${postcode}</h7><br /><h7>No. Trips: ${
      height / heightFactor
    }</h7>`;

    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    new mapboxgl.Popup()
      .setLngLat(coordinates as [number, number])
      .setHTML(description)
      .addTo(map);
  });
};
