import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";


export interface DeliveryConfig {
  start_time: number;
  end_time_incl: number;
  max_loading_meter: number;
  max_weight: number;
  num_trucks: number;
  days_per_trip: number;
  km_per_day: number;
  min_per_day: number;
  reuse_trucks: boolean;
  penalty_for_dropping_nodes: number;
  calculation_time_limit: number;
  waiting_time_days: number;
  delivery_promise_radius: number;
  delivery_promise_days: number;
  last_stop_distance: number;
}

interface ConfigModalProps {
  show: boolean;
  onHide: () => void;
  onApplySettings: (config: DeliveryConfig) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  show,
  onHide,
  onApplySettings,
}) => {
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig>({
    start_time: 1672614000,
    end_time_incl: 1672700399,
    max_loading_meter: 14,
    max_weight: 24000,
    num_trucks: 10,
    days_per_trip: 3,
    km_per_day: 800,
    min_per_day: 360,
    reuse_trucks: true,
    penalty_for_dropping_nodes: 1000000,
    calculation_time_limit: 5,
    waiting_time_days: 3,
    delivery_promise_radius: 300,
    delivery_promise_days: 1,
    last_stop_distance: 50,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    // Check the type of the input
    const inputValue = type === 'checkbox' ? e.target.checked : parseFloat(value) || 0;
    setDeliveryConfig({ ...deliveryConfig, [name]: inputValue });
  };

  return (
    <div>
      <Modal
        show={show}
        onHide={onHide}
        backdrop="static"
        keyboard={false}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Parameter for Cargo Optimization</Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            maxHeight: "calc(100vh - 210px)",
            overflowY: "auto",
          }}
        >
          <Form>
            <h5>S1: Base Parameter</h5>
            <Form.Group key="start_time">
              <Form.Label>Start time for order filter</Form.Label>
              <Form.Control
                type="number"
                name="start_time"
                placeholder="Enter Start Time"
                value={deliveryConfig.start_time}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group key="end_time_incl">
              <Form.Label>End time for order filter</Form.Label>
              <Form.Control
                type="number"
                name="end_time_incl"
                placeholder="Enter End Time"
                value={deliveryConfig.end_time_incl}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group key="max_loading_meter">
              <Form.Label>Max. loading meter</Form.Label>
              <Form.Control
                type="number"
                name="max_loading_meter"
                placeholder="Enter Max Loading Meter"
                value={deliveryConfig.max_loading_meter}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group key="max_weight">
              <Form.Label>Max. weight</Form.Label>
              <Form.Control
                type="number"
                name="max_weight"
                placeholder="Enter Max Weight"
                value={deliveryConfig.max_weight}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group key="num_trucks">
              <Form.Label>Number of trucks driving at the same time</Form.Label>
              <Form.Control
                type="number"
                name="num_trucks"
                placeholder="Enter number of trucks driving at the same time"
                value={deliveryConfig.num_trucks}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group key="days_per_trip">
              <Form.Label>
                Max. driving days per trip (800km / 6h per day)
              </Form.Label>
              <Form.Control
                type="number"
                name="days_per_trip"
                placeholder="Enter Number of days per Trip"
                value={deliveryConfig.days_per_trip}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group key="reuse_trucks">
              <Form.Label>Reuse trucks after they all returned to the depot</Form.Label>
              <Form.Check
                type="checkbox"
                name="reuse_trucks"
                placeholder="Reuse trucks"
                checked={deliveryConfig.reuse_trucks}
                onChange={handleInputChange}
              />
            </Form.Group>
            <br />
            <h5>S2: Waiting Time</h5>
            <Form.Group key="waiting_time_days">
              <Form.Label>Number of waiting days at the depot</Form.Label>
              <Form.Control
                type="number"
                name="waiting_time_days"
                placeholder="Enter Number of waiting days"
                value={deliveryConfig.waiting_time_days}
                onChange={handleInputChange}
              />
            </Form.Group>
            <br />
            <h5>S3: Delivery promise radius</h5>
            <Form.Group key="delivery_promise_radius">
              <Form.Label>
                Radius of the delivery promise around the depot
              </Form.Label>
              <Form.Control
                disabled
                type="number"
                name="delivery_promise_radius"
                placeholder="Radius of the delivery promise around the depot"
                value={deliveryConfig.delivery_promise_radius}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group key="delivery_promise_days">
              <Form.Label>Delivery promise in days</Form.Label>
              <Form.Control
                disabled
                type="number"
                name="delivery_promise_days"
                placeholder="Delivery promise in days"
                value={deliveryConfig.delivery_promise_days}
                onChange={handleInputChange}
              />
            </Form.Group>
            <br />
            <h5>S4: Last stop distance</h5>
            <Form.Group key="last_stop_distance">
              <Form.Label>
                Distance between the last stop and the depot
              </Form.Label>
              <Form.Control
                disabled
                type="number"
                name="last_stop_distance"
                placeholder="Distance between the last stop and the depot"
                value={deliveryConfig.last_stop_distance}
                onChange={handleInputChange}
              />
            </Form.Group>
            <br />
            <h5>Fine tuning</h5>
            <Form.Group key="calculation_time_limit">
              <Form.Label>Max. calculation time in seconds</Form.Label>
              <Form.Control
                
                type="number"
                name="calculation_time_limit"
                placeholder="Max. calculation time in seconds"
                value={deliveryConfig.calculation_time_limit}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group key="penalty_for_dropping_nodes">
              <Form.Label>Penalty for dropping nodes</Form.Label>
              <Form.Control
                type="number"
                name="penalty_for_dropping_nodes"
                placeholder="Penalty for dropping nodes"
                value={deliveryConfig.penalty_for_dropping_nodes}
                onChange={handleInputChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={() => onApplySettings(deliveryConfig)}
          >
            Calculate Routes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
