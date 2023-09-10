import { Map as MapboxMap } from "mapbox-gl";
import mapboxgl from "mapbox-gl";
import germany_boundaries from "./germany_boundaries";

const heightFactor = 1000

export const setupMapFeatures = (map: MapboxMap, offerings) => {
  map.addControl(new mapboxgl.NavigationControl(), "top-left");

  const markerData = {
    type: "FeatureCollection",
    features: [],
  };

  const lineData = {
    type: "FeatureCollection",
    features: [],
  };

  let cityCodes = {};

  const incrementCityCodeCount = (zipCode) => {
    cityCodes[zipCode] = (cityCodes[zipCode] || 0) + 1;
  };
  
  
  offerings.forEach((offering) => {


    incrementCityCodeCount(offering.origin.zip_code);
    incrementCityCodeCount(offering.destination.zip_code);

    
    markerData.features.push({
      type: "Feature",
      properties: { color: "green", city: offering.origin.city },
      geometry: {
        type: "Point",
        coordinates: [offering.origin.long, offering.origin.lat],
      },
    });

    markerData.features.push({
      type: "Feature",
      properties: { color: "red", city: offering.destination.city },
      geometry: {
        type: "Point",
        coordinates: [offering.destination.long, offering.destination.lat],
      },
    });

    lineData.features.push({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [offering.origin.long, offering.origin.lat],
          [offering.destination.long, offering.destination.lat],
        ],
      },
    });
  });

  console.log(cityCodes);

  map.loadImage(
    "https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png",
    (error, image) => {
      if (error) throw error;
      map.addImage("custom-marker", image);
    }
  );

  map.addSource(`marker_data`, {
    type: "geojson",
    data: markerData,
  });

  map.addLayer({
    id: "markers",
    type: "symbol",
    source: "marker_data",
    layout: {
      "icon-image": "custom-marker",
      "icon-offset": [0, -20],
    },
  });

  map.addSource(`line_data`, {
    type: "geojson",
    data: lineData,
  });

  map.addLayer({
    id: `lines`,
    type: "line",
    source: `line_data`,
    paint: {
      "line-width": 4,
      "line-color": "grey",
      "line-opacity": 0.4,
    },
  });

  // add a line layer with line-dasharray set to the first value in dashArraySequence
  map.addLayer({
    type: "line",
    source: "line_data",
    id: "line-dashed",
    paint: {
      "line-color": "red",
      "line-width": 6,
      "line-dasharray": [0, 4, 3],
    },
  });

  const newFeatures = germany_boundaries.features.filter((feature, index) => {
    const numberOfCityCodes =
      cityCodes[parseInt(feature.properties.postcode, 10)];
    if (numberOfCityCodes) {
      feature.properties.height = numberOfCityCodes * heightFactor;
      feature.properties.base_height = 0;
      feature.properties.color = "#4287f5";
      return true;
    } else {
      feature.properties.color = "white";
      return false;
    }
  });

  germany_boundaries.features = newFeatures;

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
    data: germany_boundaries,
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

  // When a click event occurs on a feature in the places layer, open a popup at the
  // location of the feature, with description HTML from its properties.
  map.on("click", "markers", (e) => {
    // Copy coordinates array.
    const coordinates = e.features[0].geometry.coordinates.slice();
    const description = e.features[0].properties.city;

    // Ensure that if the map is zoomed out such that multiple
    // copies of the feature are visible, the popup appears
    // over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    new mapboxgl.Popup().setLngLat(coordinates).setHTML(description).addTo(map);
  });

  map.on("click", "germany_overlay", (e) => {
    // Copy coordinates array.
    //const coordinates = e.features[0].geometry.coordinates[0][0].slice();
    const coordinates = [e.lngLat["lng"], e.lngLat["lat"]];
    //const description = e.features[0].properties.name;

    const description = `<b><h7>${e.features[0].properties.name}</h7></b><br /><h7>Postcode: ${e.features[0].properties.postcode}</h7><br /><h7>No. Trips: ${((e.features[0].properties.height)/heightFactor)}</h7>`;
    // Ensure that if the map is zoomed out such that multiple
    // copies of the feature are visible, the popup appears
    // over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    new mapboxgl.Popup().setLngLat(coordinates).setHTML(description).addTo(map);
  });
  
};
