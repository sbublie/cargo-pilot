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
              className="justify-content-center align-items-center "
              style={{ minHeight: "70vh" }}
            >
              <Col md={9}>
                
                <h1 className="text-center">Welcome to ZDM Cargo Pilot</h1>
                <br />
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
                <br />
                <a href="https://www.ravensburg.dhbw.de/forschung-transfer/kompetenzzentren/zentrum-fuer-digitalisierung-in-mobilitaetssystemen">Zentrum für Digitalisierung in Mobilitätssystemen</a>
                <br />
                <b>Prof. Dudek</b>
                <div className="mt-4 mb-4" >in collaboration with</div>
                <a href="https://www.ua.pt/">Universidade de Aveiro</a>
                <br />
                <b>Prof. Dr. Ana Moura</b>
                <br />
                <b>Prof. Dr. Rui Borges</b>

              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>
    </>
  );
}

export default StartPage;
