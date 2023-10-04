import { useRef, useEffect, useState } from "react";
import { useOfferings } from "../../contexts/OfferingsContext";
import MapSettingsModal from "./MapSettingsModal";
import MapStatisticsModal from "./MapStatisticsModal";
import { Button, Container, Row, Col, Spinner } from "react-bootstrap";

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
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<Settings>({
    mapMode: "cluster",
    dataSource: "db",
    animateRoutes: false,
  });

  const lng = 9.446113815133662;
  const lat = 47.66559693227496;
  const zoom = 9;
  const { trips, offerings, boundaries } = useOfferings();

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
        console.log("map loaded");
        setupMapFeatures(mapInstance, trips, offerings, boundaries);

        setMap(mapInstance);
        if (
          offerings.length > 0 &&
          trips.length > 0 &&
          boundaries.features.length > 0
        ) {
          setIsLoading(false);
        }
      });

      // Clean up on unmount
      return () => mapInstance.remove();
    }
  }, [trips, offerings, boundaries]);

  const applySettings = (settings: Settings) => {
    setSettings(settings);
    handleCloseSettingsModal();
  };

  useEffect(() => {
    if (map && boundaries?.features) {
      const allLayers = [
        "germany_overlay",
        "offering_lines",
        "line-dashed",
        "offering_markers",
        "trip_markers",
        "trip_lines",
      ];

      const layersByMode = {
        offering: ["offering_lines", "offering_markers"],
        cluster: ["germany_overlay"],
        trip: ["trip_markers", "trip_lines"],
        match: ["trip_markers", "trip_lines"],
      };

      const visibleLayers = layersByMode[settings.mapMode] || [];

      if (
        settings.animateRoutes &&
        (settings.mapMode === "offering" || settings.mapMode === "trip")
      ) {
        visibleLayers.push("line-dashed");
      }

      allLayers.forEach((layer) => {
        map.setLayoutProperty(
          layer,
          "visibility",
          visibleLayers.includes(layer) ? "visible" : "none"
        );
      });

      if (visibleLayers.includes("line-dashed")) {
        map.moveLayer("line-dashed", visibleLayers[0]);
      }
      if (visibleLayers.includes(settings.mapMode + "_lines")) {
        map.moveLayer(settings.mapMode + "_lines", visibleLayers[0]);
      }
    }
  }, [map, settings]);

  console.log("load normal");
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
            <Button
              className="m-3"
              variant="primary"
              onClick={handleShowStatisticsModal}
            >
              Open Statistics
            </Button>
          </Col>
          <Col className="d-flex justify-content-center">
            <h2 className="m-3">Cargo Pilot Map View</h2>
          </Col>
          <Col className="d-flex justify-content-end">
            <Button
              className="m-3"
              variant="primary"
              onClick={handleShowSettingsModal}
            >
              Open Settings
            </Button>
          </Col>
        </Row>
      </Container>
      <div className="map-container" ref={mapContainerRef} />

      {/* Overlay the spinner if data is still loading */}
      {isLoading && (
        <Container
          fluid
          className="d-flex align-items-center justify-content-center position-absolute"
          style={{
            top: 60,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
            background: "rgba(255,255,255,255)",
          }}
        >
          <Row>
            <Col className="d-flex justify-content-center">
              <Spinner
                className="m-3"
                animation="border"
                role="status"
                style={{ width: "3rem", height: "3rem" }}
              >
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </Col>
          </Row>
          <Row>
            <h3>Fetching data...</h3>
          </Row>
        </Container>
      )}
    </>
  );
}

export default MapboxMap;
