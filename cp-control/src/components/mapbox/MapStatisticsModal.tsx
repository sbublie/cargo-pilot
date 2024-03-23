import React from 'react';
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { getClusterRelations } from "../ApiHandler";
import { Settings } from "./models/Settings";
import { ClusterRelation } from "./Cluster";
import { useRef, useEffect, useState } from "react";

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
      setClusterRelations([])
    }
  }, [show]);

  // Sort the clusterRelations array based on relation_count in descending order
  const sortedClusterRelations = [...clusterRelations].sort((a, b) => b.relation_count - a.relation_count);

  return (
    <Modal show={show} onHide={onHide} backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>Statistics</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!settings.showCluster && <>Please enable clustering in settings!</>}
        <Col>
        {settings.showCluster && <>Origin Cluster -{'>'} Destination Clutser: Number of Trips</>}<br /><br />
        {sortedClusterRelations.map((clusterRelation) => (
        <React.Fragment key={clusterRelation.origin_cluster + '-' + clusterRelation.destination_cluster}>
          {clusterRelation.origin_cluster + " -> " + clusterRelation.destination_cluster + ": " + clusterRelation.relation_count}
          <br />
        </React.Fragment>
      ))}
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
