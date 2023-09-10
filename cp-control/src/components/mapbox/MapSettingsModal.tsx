import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import { useState } from "react";

function MapSettingsModal({ show, onHide, onApplySettings }) {
  const [settings, setSettings] = useState({
    mapMode: "cluster",
    dataSource: "db",
    animateRoutes: false,
  });

  // Function to handle changes in the map mode radio button selection
  const handleMapModeChange = (event) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      mapMode: event.target.id,
    }));
  };

  // Function to handle changes in the data source checkbox selection
  const handleDataSourceChange = (event) => {
    const newDataSource = event.target.id;
    setSettings((prevSettings) => ({
      ...prevSettings,
      dataSource: prevSettings.dataSource.includes(newDataSource)
        ? prevSettings.dataSource.replace(newDataSource, "").trim()
        : [prevSettings.dataSource, newDataSource].join(" ").trim(),
    }));
  };

  // Function to handle changes in the options checkbox selection
  const handleOptionsChange = (event) => {
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
            disabled
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
              checked={settings.dataSource.includes("db")}
              onChange={handleDataSourceChange}
            />
            <Form.Check
              disabled
              type="checkbox"
              id="transics"
              label="Transics"
              checked={settings.dataSource.includes("transics")}
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
