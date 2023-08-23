import { useRef, useEffect, } from "react";

import mapboxgl from "mapbox-gl";
import "./mapbox_style.css"

import germany_boundaries from "./germany_boundaries"
mapboxgl.accessToken = "";

function MapboxMap() {
  const mapContainer = useRef(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const lng = 9.446113815133662;
  const lat = 47.66559693227496;
  const zoom = 9

  useEffect(() => {
    if (!map.current && mapContainer.current) {
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng, lat],
      zoom: zoom,
      pitch: 50,
    });

    map.current.on('load', () => {
        map.current?.addSource('floorplan', {
        'type': 'geojson',
        /*
        * Each feature in this GeoJSON file contains values for
        * `properties.height`, `properties.base_height`,
        * and `properties.color`.
        * In `addLayer` you will use expressions to set the new
        * layer's paint properties based on these values.
        */
        // @ts-ignore
        'data': germany_boundaries

        });

        map.current?.addLayer({
        'id': 'room-extrusion',
        'type': 'fill-extrusion',
        'source': 'floorplan',
        'paint': {
        // Get the `fill-extrusion-color` from the source `color` property.
        'fill-extrusion-color': ['get', 'color'],
         
        // Get `fill-extrusion-height` from the source `height` property.
        'fill-extrusion-height': ['get', 'height'],
         
        // Get `fill-extrusion-base` from the source `base_height` property.
        'fill-extrusion-base': ['get', 'base_height'],
         
        // Make extrusions slightly opaque to see through indoor walls.
        'fill-extrusion-opacity': 0.7
        }
        });
        });
      }
  });

  return (
    <div>
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}

export default MapboxMap;