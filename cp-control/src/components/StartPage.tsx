import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { Card } from "react-bootstrap";

function StartPage() {
  return (
    <>
      <Container>
        <Card>
          <Card.Body>
            <Row
              className="justify-content-center align-items-center text-center"
              style={{ minHeight: "70vh" }}
            >
              <Col md={8}>
                <h1 className="text-center">Welcome to Cargo Pilot</h1>
                <h3 className="text-center mb-20">
                  This page is currently being updated. Please come back later!
                </h3>
                <hr />
                <h5>
                  Within the research project in cooperation with Universidade
                  de Aveiro
                </h5>
                <i>
                  <h5>
                    “Empty and low utilization route driving patterns for
                    transport logistic trucks: identification and optimization
                    of vehicles utilization”
                  </h5>
                </i>
                <h5>
                  this website was created to support transport logistic
                  companies to increase the utilization of their existing truck
                  fleets in a sustainable way.
                </h5>
                <h2>Center for Digitization in Mobility Systems (ZDM)</h2>
                <h5>
                  The Center for Digitization in Mobility Systems (ZDM)
                  specializes in digitization in transportation. Students can
                  thus deepen their knowledge in the field of automated and
                  connected driving. For companies, ZDM offers support in the
                  evaluation and deployment of digitization technologies.
                </h5>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>
    </>
  );
}

export default StartPage;
