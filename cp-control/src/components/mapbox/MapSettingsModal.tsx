import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import { useState, ChangeEvent, FC } from "react";
import Datetime from "react-datetime";
import moment, { Moment } from "moment";

import "react-datetime/css/react-datetime.css";
import "moment/dist/locale/de";

import { Settings, defaultSettings } from "./models/Settings";

interface MapSettingsModalProps {
  show: boolean;
  onHide: () => void;
  onApplySettings: (settings: Settings) => void;
  allDataSources: string[]
}

const MapSettingsModal: FC<MapSettingsModalProps> = ({
  show,
  onHide,
  onApplySettings,
  allDataSources,
}) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  //console.log(allDataSources)

  const handleTimestampChange = (
    value: string | Moment,
    type: "startTimestamp" | "endTimestamp"
  ) => {
    const momentValue = moment(value);

    setSettings({
      ...settings,
      [type]: momentValue.toDate().getTime() / 1000,
    });
  };

  const handleMapModeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const mapModes: Record<string, Settings["mapMode"]> = {
      items_cluster: "items_cluster",
      bar_map: "bar_map",
    };
    const newMapMode = mapModes[event.target.id];

    if (newMapMode) {
      setSettings((prevSettings: Settings) => ({
        ...prevSettings,
        mapMode: newMapMode,
      }));
    } else {
      console.error("Invalid map mode selected");
    }
  };

  const handleDataSourceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = event.target;

    setSettings((prevSettings: Settings) => {
      let updatedDataSource: string[] = [...prevSettings.dataSource]; // Copying the existing data source array

      if (checked) {
        updatedDataSource.push(id); // Add the data source to the array if checked
      } else {
        updatedDataSource = updatedDataSource.filter((source) => source !== id); // Remove the data source from the array if unchecked
      }

      return {
        ...prevSettings,
        dataSource: updatedDataSource,
      };
    });
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
                onChange={(value: string | Moment) =>
                  handleTimestampChange(value, "startTimestamp")
                }
              ></Datetime>
            </Form.Group>
            <Form.Group key="endTimestamp">
              <Form.Label>End time for filter</Form.Label>
              <Datetime
                locale="de"
                initialValue={moment.unix(settings.endTimestamp)}
                onChange={(value: string | Moment) =>
                  handleTimestampChange(value, "endTimestamp")
                }
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
              id="items_cluster"
              label="All Locations + Clusters"
              checked={settings.mapMode === "items_cluster"}
              onChange={handleMapModeChange}
            />
            <Form.Check
              type="radio"
              id="bar_map"
              label="3D-Cluster"
              checked={settings.mapMode === "bar_map"}
              onChange={handleMapModeChange}
            />
          </div>

          <div key="Form2" className="mb-3">
            <h5>Select the Data Sources</h5>
            {allDataSources.map((source) => (
              <Form.Check
                key={source}
                type="checkbox"
                id={source}
                label={source}
                onChange={handleDataSourceChange}
                checked={settings.dataSource.includes(source)}
              />
            ))}
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
