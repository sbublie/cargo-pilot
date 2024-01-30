import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useState, useRef, useEffect } from "react";
import { ConfigModal, DeliveryConfig } from "./ConfigModal";
import {
  SpinnerModal,
  NotificationModal,
  StatisticsModal,
} from "./SpinnerModal";
import { getCalcRoutes } from "../ApiHandler";
import {
  getProjectedTripsLineGeoJson,
  getProjectedTripsPointGeoJson,
  addProjectedTripsToMap,
} from "./mapFeatures";
import mapboxgl from "mapbox-gl";

import "./mapbox_style.css";
import "mapbox-gl/dist/mapbox-gl.css";

// Set the Mapbox API token from the .env file
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY;

const Optimizer: React.FC = () => {
  // Define the component's logic and UI here
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(true);
  const [showSpinnerModal, setShowSpinnerModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);
  const [notificationText, setNotificationText] = useState("");

  const [results, setResults] = useState<any>({
    result: {
      average_distance: 0,
      number_trips: 0,
      total_distance: 0,
      trips: [],
    },
  }); // State to store results

  const handleCloseConfigModal = () => setShowConfigModal(false);
  const handleCloseStatisticsModal = () => setShowStatisticsModal(false);
  const handleShowStatisticsModal = () => {
    setShowStatisticsModal(true);
  };
  const handleCloseNotificationModal = () => {
    setShowNotificationModal(false);
    setShowConfigModal(true);
  };

  const clearMapContent = () => {
    if (map) {
      const source_lines = map.getSource("projected_trips_lines") as mapboxgl.GeoJSONSource;
      source_lines.setData({
        type: "FeatureCollection",
        features: [],
      });
      const source_points = map.getSource("projected_trips_points") as mapboxgl.GeoJSONSource;
      source_points.setData({
        type: "FeatureCollection",
        features: [],
      });
    }
  };
  const handleReload = () => {
    setShowConfigModal(true);
    clearMapContent();
  };

  const lng = 9.969391007692515;
  const lat = 50.292267569907885;
  const zoom = 7;

  // Initialize map when component mounts
  useEffect(() => {
    if (mapContainerRef.current) {
      const mapInstance = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/sbublies/clrzgt15k00wg01r41xhe7xol",
        center: [lng, lat],
        zoom: zoom,
        pitch: 0,
      });

      mapInstance.on("load", () => {
        //addCustomImageToMap(mapInstance);
        //addControlsToMap(mapInstance);
        setMap(mapInstance);
      });

      // Clean up on unmount
      return () => mapInstance.remove();
    }
  }, []);

  useEffect(() => {
    if (map && results.result.trips !== undefined) {
      const lineGeoJson = getProjectedTripsLineGeoJson(results);
      const pointGeoJson = getProjectedTripsPointGeoJson(results);
      addProjectedTripsToMap(map, lineGeoJson, pointGeoJson);
    } else if (map && results.result.trips === undefined) {
      setNotificationText(
        "no_results"
      );
      setShowNotificationModal(true);
    }
  }, [map, results]);

  const applySettings = (settings: DeliveryConfig) => {
    handleCloseConfigModal();
    setShowSpinnerModal(true);
    // Call the API with the settings
    getCalcRoutes(settings)
      .then((data) => {
        // Store the results in state
        setResults(data);
        setShowSpinnerModal(false);
      })
      .catch((error) => {
        console.error("Error fetching data: ", error);
        setShowSpinnerModal(false);
        setNotificationText(
          "error"
        );
        setShowNotificationModal(true);
      });
    // TODO: Show results on Page
  };

  return (
    <>
      <ConfigModal
        show={showConfigModal}
        onHide={handleCloseConfigModal}
        onApplySettings={applySettings}
      ></ConfigModal>
      <SpinnerModal
        show={showSpinnerModal}
        onHide={() => setShowSpinnerModal(false)}
      ></SpinnerModal>
      <NotificationModal
        show={showNotificationModal}
        onClose={handleCloseNotificationModal}
        text={notificationText}
      ></NotificationModal>
      <StatisticsModal
        show={showStatisticsModal}
        onClose={handleCloseStatisticsModal}
        trips={results}
      ></StatisticsModal>
      <Container fluid>
        <Row>
          <Col className="d-flex justify-content-start">
            <Button
              className="m-3"
              variant="primary"
              onClick={handleShowStatisticsModal}
            >
              Show Statistics
            </Button>
          </Col>
          <Col className="d-flex justify-content-center">
            <h2 className="m-3">Cargo Pilot Optimizer</h2>
          </Col>
          <Col className="d-flex justify-content-end">
            <Button className="m-3" variant="primary" onClick={handleReload}>
              New Calculation
            </Button>
          </Col>
        </Row>
      </Container>
      <div className="map-container" ref={mapContainerRef} />
    </>
  );
};

export default Optimizer;
