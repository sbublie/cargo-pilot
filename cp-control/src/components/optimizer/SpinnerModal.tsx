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
      <Modal show={show} onHide={onHide} backdrop="static" keyboard={false} centered>
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
  let notificationText
  if (text === "no_results") {
    notificationText = "No results found!";
  } else if (text === "error") {
    notificationText = <div><b>Error while fetching</b><br/>This should not happen!<br/>Please report the error to the developer!</div> ;
  }

  return (
    <div>
      <Modal show={show} backdrop="static" keyboard={false} centered>
        <Modal.Body>{notificationText}</Modal.Body>
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
      <Modal show={show} backdrop="static" keyboard={false} centered>
        <Modal.Body style={{
      maxHeight: 'calc(100vh - 210px)',
      overflowY: 'auto'
     }}>
        <b>Delivered cargo orders:</b> {trips.result.number_of_orders - (trips.result.number_of_undelivered_orders)} of {trips.result.number_of_orders}<br/>
        <b>Average distance per trip:</b> {trips.result.average_distance_per_trip} km<br/>
        <b>Total distance:</b> {trips.result.total_distance} km<br/>
        <b>Number of sub-trips:</b> {trips.result.number_of_driving_sections}<br/>
        <b>Average Loading Meter Utilization:</b> {trips.result.average_loading_meter_utilization} %<br/>
        <b>Average Weight Utilization:</b> {trips.result.average_weight_utilization} %<br/>
        <br/>
        {trips.result.trips.map((trip) => (
          <div key={trip.id}>
            <b>Trip ID:</b> {trip.id}<br/>
            - Number of driving sections: {trip.number_of_driving_sections}<br/>
            - Total loading meter utilization: {trip.average_loading_meter_utilization} %<br/>
            - Total weight utilization: {trip.average_weight_utilization} %<br/>
            - Total distance: {trip.total_distance} km<br/>
            - Total driving time: {trip.total_time} min<br/>
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
