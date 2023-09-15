import { useRef, useEffect, useState } from "react";
import { useOfferings } from "../../contexts/OfferingsContext";
import MapSettingsModal from "./MapSettingsModal";
import MapStatisticsModal from "./MapStatisticsModal";
import { Button, Container, Row, Col } from 'react-bootstrap';

import mapboxgl from "mapbox-gl";
import "./mapbox_style.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { setupMapFeatures } from "./mapFeatures";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY;

interface Settings {
  mapMode: "cluster" | "offering" | "trip" | "match";
  dataSource: "db" | "transics";
  animateRoutes: boolean;
}

function MapboxMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    mapMode: "cluster",
    dataSource: "db",
    animateRoutes: false,
  });

  const lng = 9.446113815133662;
  const lat = 47.66559693227496;
  const zoom = 9;
  const { offerings, boundaries } = useOfferings();

  const handleCloseSettingsModal = () => setShowSettingsModal(false);
  const handleShowSettingsModal = () => setShowSettingsModal(true);

  const handleCloseStatisticsModal = () => setShowStatisticsModal(false);
  const handleShowStatisticsModal = () => setShowStatisticsModal(true);

  // Initialize map when component mounts
  useEffect(() => {
    if (mapContainerRef.current) {
    const mapInstance = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng, lat],
      zoom: zoom,
      pitch: 50,
    });

    mapInstance.on("load", () => {
      setupMapFeatures(mapInstance, offerings, boundaries);

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
        const newStep = Math.floor((timestamp / 50) % dashArraySequence.length);

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
  }
  }, [offerings, boundaries]);

  const applySettings = (settings:Settings) => {
    setSettings(settings);

    handleCloseSettingsModal();
  };

  useEffect(() => {
    if (map && boundaries?.features) {
      if (settings.mapMode === "offering") {
        map.setLayoutProperty("germany_overlay", "visibility", "none");
        map.setLayoutProperty("lines", "visibility", "visible");
        if (settings.animateRoutes) {
          map.setLayoutProperty("line-dashed", "visibility", "visible");
        } else {
          map.setLayoutProperty("line-dashed", "visibility", "none");
        }
        map.setLayoutProperty("markers", "visibility", "visible");
        map.moveLayer('line-dashed', 'markers');
        map.moveLayer('lines', 'markers');
      }
      if (settings.mapMode === "cluster") {
        map.setLayoutProperty("germany_overlay", "visibility", "visible");
        map.setLayoutProperty("lines", "visibility", "none");
        map.setLayoutProperty("line-dashed", "visibility", "none");
        map.setLayoutProperty("markers", "visibility", "none");
      }
    }
  }, [map, settings]);

  return (
    <>
      <MapSettingsModal
        show={showSettingsModal}
        onHide={handleCloseSettingsModal}
        onApplySettings={applySettings}
      ></MapSettingsModal>
      <MapStatisticsModal
        show={showStatisticsModal}
        onHide={handleCloseStatisticsModal}
      ></MapStatisticsModal>
      <Container fluid>
        <Row>
          <Col className="d-flex justify-content-start">
            <Button className="m-3" variant="primary" onClick={handleShowStatisticsModal}>
              Open Statistics
            </Button>
          </Col>
          <Col className="d-flex justify-content-center">
            <h2 className="m-3">Cargo Pilot Map View</h2>
          </Col>
          <Col className="d-flex justify-content-end">
            <Button className="m-3" variant="primary" onClick={handleShowSettingsModal}>
              Open Settings
            </Button>
          </Col>
        </Row>
      </Container>
      <div className="map-container" ref={mapContainerRef} />
    </>
  );
}

export default MapboxMap;
