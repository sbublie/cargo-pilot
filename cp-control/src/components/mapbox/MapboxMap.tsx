import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import { Button, Container, Row, Col } from "react-bootstrap";

import { useOfferings } from "../../contexts/OfferingsContext";
import MapSettingsModal from "./MapSettingsModal";
import MapStatisticsModal from "./MapStatisticsModal";
import {
  addCustomImageToMap,
  addControlsToMap,
  setVisibleMapLayers,
} from "./mapFeatures";
import { getTripsGeoJson, addTripClusterToMap } from "./tripHandler";
import {
  getOfferingsGeoJson,
  addOfferingClusterToMap,
} from "./offeringsHandler";
import {
  addCityBoundariesToMap,
  setCityBoundariesGeoJson,
} from "./clusterHandler";

import "./mapbox_style.css";
import "mapbox-gl/dist/mapbox-gl.css";

// Set the Mapbox API token from the .env file
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY;

export interface Settings {
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

  const { offerings, trips, boundaries } = useOfferings();

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
        addCustomImageToMap(mapInstance);
        addControlsToMap(mapInstance);
        setMap(mapInstance);
      });

      // Clean up on unmount
      return () => mapInstance.remove();
    }
  }, []);

  useEffect(() => {
    if (map) {
      const offeringsGeoJson = getOfferingsGeoJson(offerings);
      addOfferingClusterToMap(map, offeringsGeoJson);

      const tripsGeoJson = getTripsGeoJson(trips);
      addTripClusterToMap(map, tripsGeoJson);

      setCityBoundariesGeoJson(boundaries, offerings);
      addCityBoundariesToMap(map, boundaries);

      setVisibleMapLayers(map, settings);
    }
  }, [map, offerings, trips, boundaries, settings]);

  const applySettings = (settings: Settings) => {
    setSettings(settings);
    handleCloseSettingsModal();
  };

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
    </>
  );
}

export default MapboxMap;
