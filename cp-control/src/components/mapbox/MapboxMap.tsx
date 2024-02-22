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
import {
  addCityBoundariesToMap,
  setCityBoundariesGeoJson,
  getClusterGeoJson,
  addClusterToMap
} from "./clusterHandler";
import { getClusters, getTransportItems } from "../ApiHandler";
import { getTransportItemGeoJson, addTransportItemsToMap } from "./transportItemHandler";


import { Cluster } from "./Cluster";
import { Settings } from "./models/Settings";

import "./mapbox_style.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { TransportItem } from "./models/TransportItem";


// Set the Mapbox API token from the .env file
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY;

function MapboxMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);
  const [clustersn, setClusters] = useState<Cluster[]>([]);
  const [transportItems, setTransportItems] = useState<TransportItem[]>([])
  const [settings, setSettings] = useState<Settings>({
    mapMode: "items_cluster",
    dataSource: ["DB", "Transics"],
    animateRoutes: false,
    applyFilter: true,
    startTimestamp: 1672614000,
    endTimestamp: 1672700399,
    showCluster: false,
    eps: 0.5,
    minSamples: 5
  });

  const lng = 9.896523259509264;
  const lat = 50.49052575476047;
  const zoom = 6;

  const { cargoOrders, boundaries } = useOfferings();

  const handleCloseSettingsModal = () => setShowSettingsModal(false);
  const handleShowSettingsModal = () => setShowSettingsModal(true);

  const handleCloseStatisticsModal = () => setShowStatisticsModal(false);
  const handleShowStatisticsModal = () => setShowStatisticsModal(true);

  // Initialize map when component mounts
  useEffect(() => {
    if (mapContainerRef.current) {
      const mapInstance = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lng, lat],
        zoom: zoom,
        pitch: 0,
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
    getTransportItems().then((transportItems) => {
      setTransportItems(transportItems.items)
    }).catch((error) => {
      console.error("Error fetching data: ", error);
    })
  }, [])

  useEffect(() => {
    if (map) {

      const transportItemsGeoJson = getTransportItemGeoJson(transportItems, settings);
      addTransportItemsToMap(map, transportItemsGeoJson)
      
      const clustersGeoJson = getClusterGeoJson(clustersn)
      addClusterToMap(map, clustersGeoJson)

      setCityBoundariesGeoJson(boundaries, cargoOrders);
      addCityBoundariesToMap(map, boundaries);

      setVisibleMapLayers(map, settings);
    }
  }, [map, transportItems, clustersn, boundaries, settings]);


  const applySettings = (settings: Settings) => {
    setSettings(settings);

    if (settings.showCluster) {
    getClusters(settings)
      .then((clusters) => {
        setClusters(clusters)
      }).catch((error) => {
        console.error("Error fetching data: ", error);
      });
    } else {
      setClusters([])
    }
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
              disabled
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
