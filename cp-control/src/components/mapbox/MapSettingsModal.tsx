import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import { useState, ChangeEvent, FC } from "react";
import Datetime from "react-datetime";
import moment, { Moment } from "moment";

import "react-datetime/css/react-datetime.css";
import "moment/dist/locale/de";

import { Settings } from "./MapboxMap";

interface MapSettingsModalProps {
  show: boolean;
  onHide: () => void;
  onApplySettings: (settings: Settings) => void;
}

const MapSettingsModal: FC<MapSettingsModalProps> = ({
  show,
  onHide,
  onApplySettings,
}) => {
  const [settings, setSettings] = useState<Settings>({
    mapMode: "cluster",
    dataSource: "db",
    animateRoutes: false,
    applyFilter: true,
    startTimestamp: 1672614000,
    endTimestamp: 1672700399,
    showCluster: false,
    eps: 0.5,
    minSamples: 5,
  });

  const handleTimestampChange = (value: string | Moment, type: 'startTimestamp' | 'endTimestamp') => {
    const momentValue = moment(value);
  
    setSettings({
      ...settings,
      [type]: momentValue.toDate().getTime() / 1000,
    });
  };

  const handleMapModeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const mapModes: Record<string, Settings["mapMode"]> = {
      activity_cluster: "activity_cluster",
      cargo_order: "cargo_order",
      trip: "trip",
      cluster: "cluster",
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
    const dataSources: Record<string, Settings["dataSource"]> = {
      db: "db",
      transics: "transics",
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    // Check the type of the input
    const inputValue =
      type === "checkbox" ? e.target.checked : parseFloat(value) || 0;
    setSettings({ ...settings, [name]: inputValue });
  };

  return (
    <Modal show={show} onHide={onHide} backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>Map Settings</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form className="mb-3">
          <h5>Filter</h5>
          <Form.Check
            type="checkbox"
            name="applyFilter"
            id="applyFilter"
            label="Apply filter"
            checked={settings.applyFilter}
            onChange={handleInputChange}
          />
        </Form>
        {settings.applyFilter && ( // Render DateTime only if applyFilter is true
          <Form>
            <Form.Group key="startTimestamp">
              <Form.Label>Start time for filter</Form.Label>
              <Datetime
                locale="de"
                initialValue={moment.unix(settings.startTimestamp)}
                onChange={(value: string | Moment) => handleTimestampChange(value, 'startTimestamp')}
              ></Datetime>
            </Form.Group>
            <Form.Group key="endTimestamp">
              <Form.Label>End time for filter</Form.Label>
              <Datetime
                locale="de"
                initialValue={moment.unix(settings.endTimestamp)}
                onChange={(value: string | Moment) => handleTimestampChange(value, 'endTimestamp')}
              ></Datetime>
            </Form.Group>
          </Form>
        )}

        <Form className="mt-3">
          <h5>Cluster</h5>
          <Form.Check
            type="checkbox"
            name="showCluster"
            id="showCluster"
            label="Show cluster"
            checked={settings.showCluster}
            onChange={handleInputChange}
          />
        </Form>
        {settings.showCluster && (
          <Form>
            <Form.Label>Enter eps</Form.Label>
            <Form.Control
              type="number"
              name="eps"
              placeholder="Enter EPS"
              value={settings.eps}
              onChange={handleInputChange}
              min={0.01}
              step={0.01}
              max={10}
            />
            <Form.Label>Enter minimum samples</Form.Label>
            <Form.Control
              type="number"
              name="minSamples"
              placeholder="Enter minimum samples"
              value={settings.minSamples}
              onChange={handleInputChange}
              min={1}
              step={1}
              max={10}
            />
          </Form>
        )}
        <Form>
          <div key="Form1" className="mt-3">
            <h5>Select the Map Mode</h5>
            <Form.Check
              type="radio"
              id="cluster"
              label="All Locations + Clusters"
              checked={settings.mapMode === "cluster"}
              onChange={handleMapModeChange}
            />
            <Form.Check
              disabled
              type="radio"
              id="activity_cluster"
              label="3D-Cluster"
              checked={settings.mapMode === "activity_cluster"}
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
};

export default MapSettingsModal;
