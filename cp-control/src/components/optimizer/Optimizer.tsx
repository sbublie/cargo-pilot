import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useState } from "react";
import { ConfigModal, DeliveryConfig } from "./ConfigModal";
import { getCalcRoutes } from "../ApiHandler";

const Optimizer: React.FC = () => {
  // Define the component's logic and UI here
  const [showConfigModal, setShowConfigModal] = useState(true);
  const [results, setResults] = useState<any>({result:{OTD: 0, average_km: 0, average_utl_loading_meter: 0, average_utl_weight: 0, num_trips: 0, orders_not_placed: 0, relevant_orders: 0, total_km: 0, trips: {}}}); // State to store results

  //const handleOpenConfigModal = () => setShowConfigModal(true);
  const handleCloseConfigModal = () => setShowConfigModal(false);

  const applySettings = (settings: DeliveryConfig) => {
    handleCloseConfigModal();
    // Call the API with the settings
    console.log(settings);
    getCalcRoutes(settings)
      .then((data) => {
        // Store the results in state
        setResults(data);
      })
      .catch((error) => {
        console.error("Error fetching data: ", error);
      });
    // TODO: Show results on Page
  };

  return (
    <>
      <ConfigModal
        show={showConfigModal}
        onHide={handleCloseConfigModal}
        onApplySettings={applySettings}
      ></ConfigModal>
      <Container fluid>
        <Row>
          <Col className="d-flex justify-content-center">
            <h2 className="m-3">Cargo Pilot Optimizer</h2>
          </Col>
        </Row>
        <Row>
          <Col>
            <h2>Optimization Results</h2>

            <p>Number of Orders: {results.result.relevant_orders}</p>
            <p>Number of Trips: {results.result.num_trips}</p>
            <p>OTD: {results.result.OTD}</p>
            <p>Orders not placed: {results.result.orders_not_placed}</p>
            <p>Total kilometers: {results.result.total_km}</p>
            <p>Average km per trip: {results.result.average_km}</p>
            <p>Average Utilization Loading Meter: {results.result.average_utl_loading_meter}</p>
            <p>Average Utilization Weight: {results.result.average_utl_weight}</p>
            <p>Trips: {JSON.stringify(results.result.trips)}</p>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Optimizer;
