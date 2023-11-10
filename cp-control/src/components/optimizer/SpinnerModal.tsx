import React from "react";
import { Modal, Button, Spinner, Row, Col } from "react-bootstrap";

interface SpinnerModalProps {
  show: boolean;
  onHide: () => void;
}

interface NotificationModalProps {
  show: boolean;
  onClose: () => void;
  text: string;
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
              &nbsp; &nbsp; Calculate optimal Routes...
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
