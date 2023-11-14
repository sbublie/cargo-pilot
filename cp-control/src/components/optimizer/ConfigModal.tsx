import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

interface DeliveryPromise {
  active: boolean;
  radius: number;
  percent_of_cargo: number;
  time_for_remaining_cargo: number;
}

/*
interface ReturnCorridor {
  distance_return_to_start: number;
  allowed_stays: number;
}
*/

export interface DeliveryConfig {
  start_time: number;
  end_time_incl: number;
  max_loading_meter: number;
  max_weight: number;
  num_trucks: number;
  max_travel_distance: number;
  cargo_stackable: boolean;
  max_waiting_time: number;
  focus_area: string;
  load_carrier: boolean;
  load_carrier_nestable: boolean;
  delivery_promise: DeliveryPromise;
  corridor_radius: number;
  allowed_stays: number;
}

interface ConfigModalProps {
  show: boolean;
  onHide: () => void;
  onApplySettings: (config: DeliveryConfig) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ show, onHide, onApplySettings }) => {
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig>({
    start_time: 1672614000,
    end_time_incl: 1672700399,
    max_loading_meter: 14,
    max_weight: 24000,
    num_trucks: 5,
    max_travel_distance: 2000,
    cargo_stackable: false,
    max_waiting_time: 86400,
    focus_area: "volume",
    load_carrier: false,
    load_carrier_nestable: false,
    delivery_promise: {
      active: false,
      radius: 0,
      percent_of_cargo: 0,
      time_for_remaining_cargo: 0,
    },
    corridor_radius: 20,
    allowed_stays: 1,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDeliveryConfig({ ...deliveryConfig, [name]: parseFloat(value) || 0 });
  };

  return (
    <div>
      <Modal show={show} onHide={onHide} backdrop="static" keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>Parameter for Cargo Optimization</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Start Time</Form.Label>
              <Form.Control
                type="number"
                name="start_time"
                placeholder="Enter Start Time"
                value={deliveryConfig.start_time}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>End Time</Form.Label>
              <Form.Control
                type="number"
                name="end_time_incl"
                placeholder="Enter End Time"
                value={deliveryConfig.end_time_incl}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Max Load Meter</Form.Label>
              <Form.Control
                type="number"
                name="max_loading_meter"
                placeholder="Enter Max Loading Meter"
                value={deliveryConfig.max_loading_meter}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Max Weight</Form.Label>
              <Form.Control
                type="number"
                name="max_weight"
                placeholder="Enter Max Weight"
                value={deliveryConfig.max_weight}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Number of Trucks</Form.Label>
              <Form.Control
                type="number"
                name="num_trucks"
                placeholder="Enter Number of Trucks"
                value={deliveryConfig.num_trucks}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Max Waiting Time</Form.Label>
              <Form.Control
                disabled
                type="number"
                name="max_waiting_time"
                placeholder="Enter Max Waiting Time"
                value={deliveryConfig.max_waiting_time}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Max Kilometers per Trip</Form.Label>
              <Form.Control
                type="number"
                name="max_travel_distance"
                placeholder="Max Kilometers per Trip"
                value={deliveryConfig.max_travel_distance}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Allowed Stays</Form.Label>
              <Form.Control
                disabled
                type="number"
                name="allowed_stays"
                placeholder="Enter Allowed Stays"
                value={deliveryConfig.allowed_stays}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Focus Area</Form.Label>
              <Form.Control
                disabled
                type="text"
                name="focus_area"
                placeholder="Enter Focus Area"
                value={deliveryConfig.focus_area}
                onChange={handleInputChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => onApplySettings(deliveryConfig)}>
            Calculate Routes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

