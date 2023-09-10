import { useRef, useEffect, useState } from "react";
import { useOfferings } from "../../contexts/OfferingsContext";
import MapSettingsModal from "./MapSettingsModal";
import Button from "react-bootstrap/Button";

import mapboxgl from "mapbox-gl";
import "./mapbox_style.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { setupMapFeatures } from "./mapFeatures";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY

function MapboxMap() {
  const mapContainerRef = useRef<mapboxgl.Map | null>(null);
  const [map, setMap] = useState(null);
  const [show, setShow] = useState(false);
  const [settings, setSettings] = useState({
    mapMode: "cluster",
    dataSource: "db",
    animateRoutes: false,
  });

  const lng = 9.446113815133662;
  const lat = 47.66559693227496;
  const zoom = 9;
  const { offerings, mapState, setNewMapState } = useOfferings();

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  // Initialize map when component mounts
  useEffect(() => {
    const mapInstance = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng, lat],
      zoom: zoom,
      pitch: 50,
    });

    mapInstance.on("load", () => {
      setupMapFeatures(mapInstance, offerings);

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

      const animateDashArray = (timestamp: number) => {
        // Update line-dasharray using the next value in dashArraySequence. The
        // divisor in the expression `timestamp / 50` controls the animation speed.
        const newStep = parseInt((timestamp / 50) % dashArraySequence.length);

        if (newStep !== step) {
          mapInstance.setPaintProperty(
            "line-dashed",
            "line-dasharray",
            dashArraySequence[step]
          );
          step = newStep;
        }

        // Request the next frame of the animation.
        requestAnimationFrame(animateDashArray);
      };
      

      animateDashArray(0);
      
      setMap(mapInstance);
    });

    // Clean up on unmount
    return () => mapInstance.remove();
  }, [offerings]);

  const applySettings = (settings) => {
    setSettings(settings);
   
    handleClose();
  };

  useEffect(() => {
    if (map) {
      console.log(settings);
      if (settings.mapMode === "offering") {
        
        map.setLayoutProperty("germany_overlay", "visibility", "none");
        map.setLayoutProperty("lines", "visibility", "visible");
        if (settings.animateRoutes) {
          map.setLayoutProperty("line-dashed", "visibility", "visible");
        } else {
          map.setLayoutProperty("line-dashed", "visibility", "none");
        }
        map.setLayoutProperty("markers", "visibility", "visible");
        
      }
      if (settings.mapMode === "cluster") {
        
        map.setLayoutProperty("germany_overlay", "visibility", "visible");
        map.setLayoutProperty("lines", "visibility", "visible");
        if (settings.animateRoutes) {
          map.setLayoutProperty("line-dashed", "visibility", "visible");
        } else {
          map.setLayoutProperty("line-dashed", "visibility", "none");
        }
        map.setLayoutProperty("markers", "visibility", "none");
        
      }
    }
  }, [map, settings]);

  return (
    <>
      <MapSettingsModal
        show={show}
        onHide={handleClose}
        onApplySettings={applySettings}
      ></MapSettingsModal>
      <div className="right-align">
        <Button onClick={handleShow} variant="primary">
          Open Settings
        </Button>{" "}
      </div>
      <div className="map-container" ref={mapContainerRef} />
    </>
  );
}

export default MapboxMap;
