import React from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Col from "react-bootstrap/Col";
import { getClusterRelations } from "../ApiHandler";
import { Settings } from "./models/Settings";
import { ClusterRelation } from "./Cluster";
import { useEffect, useState } from "react";
import { Row } from "react-bootstrap";

interface MapStatisticsModalProps {
  show: boolean;
  onHide: () => void;
  settings: Settings;
}

function MapStatisticsModal({
  show,
  onHide,
  settings,
}: MapStatisticsModalProps) {
  const [clusterRelations, setClusterRelations] = useState<ClusterRelation[]>(
    []
  );

  useEffect(() => {
    if (settings.showCluster && settings.dataSource.length) {
      getClusterRelations(settings)
        .then((clusters) => {
          setClusterRelations(clusters);
        })
        .catch((error) => {
          console.error("Error fetching data: ", error);
        });
    } else {
      setClusterRelations([]);
    }
  }, [show]);

  // Sort the clusterRelations array based on relation_count in descending order
  const sortedClusterRelations = [...clusterRelations].sort(
    (a, b) => b.relation_count - a.relation_count
  );


  return (
    <Modal size={"lg"} show={show} onHide={onHide} backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>Statistics</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!settings.showCluster && <>Please enable clustering in settings!</>}
        <Row>
          <Col xs="auto">
            {<b>Org. cluster</b>} <br />
            {sortedClusterRelations.map((clusterRelation, index) => (
              <React.Fragment key={`${clusterRelation.origin_cluster}-${index}`}>
                {clusterRelation.origin_cluster}
                <br />
              </React.Fragment>
            ))}
          </Col>
          <Col xs="auto">
          <br />
            {sortedClusterRelations.map((_, index) => (
              <React.Fragment key={`${index}`}>
                {"->"}
                <br />
              </React.Fragment>
            ))}
          </Col>
          <Col xs="auto">
          {<b>Dest. cluster</b>}<br />
            {sortedClusterRelations.map((clusterRelation, index) => (
              <React.Fragment key={`${clusterRelation.destination_cluster}-${index}`}>
                {clusterRelation.destination_cluster}
                <br />
              </React.Fragment>
            ))}
          </Col>
          <Col xs="auto">
            {<b>Trips</b>}<br />
            {sortedClusterRelations.map((clusterRelation, index) => (
              <React.Fragment key={`${clusterRelation.relation_count}-${index}`}>
                {clusterRelation.relation_count}
                <br />
              </React.Fragment>
            ))}
          </Col>
          <Col xs="auto">
            {<b>Avg. weight</b>}<br />
            {sortedClusterRelations.map((clusterRelation, index) => (
              <React.Fragment key={`${((clusterRelation.average_weight / 24000) * 100).toFixed(2) + "%"}-${index}`}>
                {((clusterRelation.average_weight / 24000) * 100).toFixed(2) + "%"}
                <br />
              </React.Fragment>
            ))}
          </Col>
          <Col xs="auto">
            {<b>Avg. loading meter</b>}<br />
            {sortedClusterRelations.map((clusterRelation, index) => (
              <React.Fragment key={`${((clusterRelation.average_loading_meter / 24000) * 100).toFixed(2) + "%"}-${index}`}>
                {((clusterRelation.average_loading_meter / 14) * 100).toFixed(2) + "%"}
                <br />
              </React.Fragment>
            ))}
          </Col>
        </Row>
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
