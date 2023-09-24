import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";

import { useState, ChangeEvent, FC } from 'react';

interface MapSettingsModalProps {
  show: boolean;
  onHide: () => void;
  onApplySettings: (settings: Settings) => void;
}

interface Settings {
  mapMode: "cluster" | "offering" | "trip" | "match";
  dataSource: "db" | "transics";
  animateRoutes: boolean;
}

const MapSettingsModal: FC<MapSettingsModalProps> = ({ show, onHide, onApplySettings }) => {
  const [settings, setSettings] = useState<Settings>({
    mapMode: "cluster",
    dataSource: "db",
    animateRoutes: false,
  });

  const handleMapModeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const mapModes: Record<string, Settings['mapMode']> = {
      cluster: "cluster",
      offering: "offering",
      trip: "trip",
      match: "match",
    };
    const newMapMode = mapModes[event.target.id];
    
    if (newMapMode) {
      setSettings((prevSettings) => ({
        ...prevSettings,
        mapMode: newMapMode,
      }));
    } else {
      console.error("Invalid map mode selected");
    }
  };

  const handleDataSourceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const dataSources: Record<string, Settings['dataSource']> = {
      db: "db",
      transics: "transics"
    };
    const newDataSource = dataSources[event.target.id];
    
    if (newDataSource) {
      setSettings((prevSettings) => ({
        ...prevSettings,
        dataSource: newDataSource,
      }));
    } else {
      console.error("Invalid data source selected");
    }
  };

  const handleOptionsChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      animateRoutes: event.target.checked,
    }));
  };

  return (
    <Modal show={show} onHide={onHide} backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>Map Settings</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <div key="Form1" className="mb-3">
            <h5>Select the Map Mode</h5>
            <Form.Check
              type="radio"
              id="cluster"
              label="3D-Cluster Mode"
              checked={settings.mapMode === "cluster"}
              onChange={handleMapModeChange}
            />
            <Form.Check
              type="radio"
              id="offering"
              label="Offering Mode"
              checked={settings.mapMode === "offering"}
              onChange={handleMapModeChange}
            />
            <Form.Check
              type="radio"
              id="trip"
              label="Trip Mode"
              checked={settings.mapMode === "trip"}
              onChange={handleMapModeChange}
            />
            <Form.Check
            disabled
              type="radio"
              id="march"
              label="Trip Match Mode"
              checked={settings.mapMode === "match"}
              onChange={handleMapModeChange}
            />
          </div>

          <div key="Form2" className="mb-3">
            <h5>Select the Data Sources</h5>
            <Form.Check
            disabled
              type="checkbox"
              id="db"
              label="DB"
              checked={true}
              onChange={handleDataSourceChange}
            />
            <Form.Check
              disabled
              type="checkbox"
              id="transics"
              label="Transics"
              checked={true}
              onChange={handleDataSourceChange}
            />
          </div>
          <div key="Form3" className="mb-3">
            <h5>Styling Options</h5>
            <Form.Check
              type="checkbox"
              id="animateRoutes"
              label="Animate Routes"
              checked={settings.animateRoutes}
              onChange={handleOptionsChange}
            />
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button variant="primary" onClick={() => onApplySettings(settings)}>
          Apply
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default MapSettingsModal;
