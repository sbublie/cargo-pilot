import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { useOfferings } from "../../contexts/OfferingsContext";

interface MapStatisticsModalProps {
  show: boolean;
  onHide: () => void;
}


function MapStatisticsModal({ show, onHide }: MapStatisticsModalProps) {
  const { stats } = useOfferings();

  let no_of_offerings = "";
  let org_count = "";
  let org_zip = "";
  let dest_count = "";
  let dest_zip = "";
  let offering_relation_origin = "";
  let offering_relation_destination = "";
  let offering_relation_count = "";

  if (stats?.offerings) {
    no_of_offerings = stats.offerings.no_of_offerings?.toString() || "";
    org_count = stats.offerings.occurrence_of_origins?.["1"]?.count?.toString() || "";
    org_zip = stats.offerings.occurrence_of_origins?.["1"]?.zip_code || "";
    dest_count = stats.offerings.occurrence_of_destinations?.["1"]?.count?.toString() || "";
    dest_zip = stats.offerings.occurrence_of_destinations?.["1"]?.zip_code || "";
    offering_relation_origin = stats.offerings.offering_relation?.["1"]?.origin || "";
    offering_relation_destination = stats.offerings.offering_relation?.["1"]?.destination || "";
    offering_relation_count = stats.offerings.offering_relation?.["1"]?.count?.toString() || "";
  }

  return (
    <Modal show={show} onHide={onHide} backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>Statistics</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Col>
          <Row className="justify-content-center align-items-center text-center">
            {" "}
            Total number of offerings loaded: {no_of_offerings}
          </Row>
          <Row className="justify-content-center align-items-center text-center">
            {" "}
            Busiest trip origin: {org_zip} with {org_count} trips
          </Row>
          <Row className="justify-content-center align-items-center text-center">
            Busiest trip destination: {dest_zip} with {dest_count} trips
          </Row>
          <Row className="justify-content-center align-items-center text-center">
            Most trips: {offering_relation_count} from {offering_relation_origin} to {offering_relation_destination}
          </Row>
        </Col>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default MapStatisticsModal;
