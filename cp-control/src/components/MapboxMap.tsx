import { useRef, useEffect, useState } from "react";
import { useOfferings } from "../contexts/OfferingsContext";
import MapSettingsModal from "./MapSettingsModal";
import Button from 'react-bootstrap/Button';

import mapboxgl from "mapbox-gl";
import "./mapbox_style.css";
import "mapbox-gl/dist/mapbox-gl.css";

import germany_boundaries from "./germany_boundaries";
import { Row } from "react-bootstrap";
import germany_boundaries from "./germany_boundaries"
mapboxgl.accessToken = "";

function MapboxMap() {
  const mapContainerRef = useRef<mapboxgl.Map | null>(null);
  const [map, setMap] = useState(null);
  const [show, setShow] = useState(false);
  const lng = 9.446113815133662;
  const lat = 47.66559693227496;
  const zoom = 9;
  const { offerings, mapState, setNewMapState } = useOfferings();

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  // Initialize map when component mounts
  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng, lat],
      zoom: zoom,
      pitch: 50,
    });

    map.on("load", () => {
      const markerData = {
        type: "FeatureCollection",
        features: [],
      };

      const lineData = {
        type: "FeatureCollection",
        features: [],
      };

      offerings.forEach((offering) => {
        /*
        new mapboxgl.Marker({ color: "green" })
          .setLngLat([offering.origin.long, offering.origin.lat])
          .addTo(map);
        new mapboxgl.Marker({ color: "red" })
          .setLngLat([offering.destination.long, offering.destination.lat])
          .addTo(map);
        */

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

      // technique based on https://jsfiddle.net/2mws8y3q/
      // an array of valid line-dasharray values, specifying the lengths of the alternating dashes and gaps that form the dash pattern
      const dashArraySequence = [
        [0, 4, 3],
        [0.5, 4, 2.5],
        [1, 4, 2],
        [1.5, 4, 1.5],
        [2, 4, 1],
        [2.5, 4, 0.5],
        [3, 4, 0],
        [0, 0.5, 3, 3.5],
        [0, 1, 3, 3],
        [0, 1.5, 3, 2.5],
        [0, 2, 3, 2],
        [0, 2.5, 3, 1.5],
        [0, 3, 3, 1],
        [0, 3.5, 3, 0.5],
      ];

      let step = 0;

      function animateDashArray(timestamp) {
        // Update line-dasharray using the next value in dashArraySequence. The
        // divisor in the expression `timestamp / 50` controls the animation speed.
        const newStep = parseInt((timestamp / 50) % dashArraySequence.length);

        if (newStep !== step) {
          map.setPaintProperty(
            "line-dashed",
            "line-dasharray",
            dashArraySequence[step]
          );
          step = newStep;
        }

        // Request the next frame of the animation.
        requestAnimationFrame(animateDashArray);
      }

      // start the animation
      animateDashArray(0);

      map.addSource("germany", {
        type: "geojson",
        
       /*   * Each feature in this GeoJSON file contains values for
         * `properties.height`, `properties.base_height`,
         * and `properties.color`.
         * In `addLayer` you will use expressions to set the new
         * layer's paint properties based on these values.
         *  */

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
          "fill-extrusion-opacity": 0.7,
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

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(description)
          .addTo(map);
      });

      setMap(map);
    });

    // Add navigation control (the +/- zoom buttons)
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Clean up on unmount
    return () => map.remove();
  }, [offerings]);

  function populateMap() {
    setNewMapState();
    if (mapState == "map") {
      map.setLayoutProperty("germany_overlay", "visibility", "none");
      map.setLayoutProperty("lines", "visibility", "none");
      map.setLayoutProperty("line-dashed", "visibility", "none");
      map.setLayoutProperty("markers", "visibility", "none");
    } else if (mapState == "empty") {
      map.setLayoutProperty("germany_overlay", "visibility", "visible");
      map.setLayoutProperty("lines", "visibility", "visible");
      map.setLayoutProperty("line-dashed", "visibility", "visible");
      map.setLayoutProperty("markers", "visibility", "visible");
    }
  }

  return (
    <>
      <MapSettingsModal show={show} onHide={handleClose}></MapSettingsModal>
      <div className="right-align">
      <Button onClick={handleShow} variant="primary">Open Settings</Button>{' '}
      </div>
      <div className="map-container" ref={mapContainerRef} />
    </>
  );
}

export default MapboxMap;
