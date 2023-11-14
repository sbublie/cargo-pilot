import React from "react";
import { Modal, Button, Spinner, Row, Col } from "react-bootstrap";
import { ProjectedTripResult } from "./mapFeatures";

interface SpinnerModalProps {
  show: boolean;
  onHide: () => void;
}

interface NotificationModalProps {
  show: boolean;
  onClose: () => void;
  text: string;
}

interface StatisticsModalProps {
  show: boolean;
  onClose: () => void;
  trips: ProjectedTripResult;
}

export const SpinnerModal: React.FC<SpinnerModalProps> = ({ show, onHide }) => {
  return (
    <div>
      <Modal show={show} onHide={onHide} backdrop="static" keyboard={false}>
        <Modal.Body>
          <Row>
            <Col className="d-flex justify-content-start">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              &nbsp; &nbsp; Calculate optimal routes...
            </Col>
          </Row>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export const NotificationModal: React.FC<NotificationModalProps> = ({
  show,
  onClose,
  text,
}) => {
  return (
    <div>
      <Modal show={show} backdrop="static" keyboard={false}>
        <Modal.Body>{text}</Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export const StatisticsModal: React.FC<StatisticsModalProps> = ({
  show,
  onClose,
  trips,
}) => {
  return (
    <div>
      <Modal show={show} backdrop="static" keyboard={false}>
        <Modal.Body style={{
      maxHeight: 'calc(100vh - 210px)',
      overflowY: 'auto'
     }}>
        <b>Total Trips:</b> {trips.result.number_trips}<br/>
        <b>Number of dropped stops:</b> {trips.result.num_of_dropped_nodes}<br/>
        <b>Average distance per trip:</b> {trips.result.average_distance} km<br/>
        <b>Total distance:</b> {trips.result.total_distance} km<br/>
        <br/>
        {trips.result.trips.map((trip) => (
          <div>
            <b>Trip ID:</b> {trip.id}<br/>
            - Number of driving sections: {trip.num_driving_sections}<br/>
            - Total loading meter utilization: {trip.total_loading_meter_utilization} %<br/>
            - Total weight utilization: {trip.total_weight_utilization} %<br/>
            <br/>
          </div>
          
        ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
