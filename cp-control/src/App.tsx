import OsmMap from "./components/OsmMap";
import { Link, Route, Routes } from "react-router-dom";
import { Navbar, Nav, Form, FormControl, Button, NavItem } from 'react-bootstrap';

function App() {
  return (
    <div className="container text-center">
      <Navbar >
            <Navbar.Brand as={Link} to="/" >Cargo Pilot</Navbar.Brand>
            <Navbar.Collapse>
              <Nav className="mr-auto">
                <NavItem href="/">
                  <Nav.Link as={Link} to="/" >Home</Nav.Link>
                </NavItem>
                <NavItem href="/map">
                  <Nav.Link as={Link} to="/map" >Map</Nav.Link>
                </NavItem>
              </Nav>
            </Navbar.Collapse>
          </Navbar>
      <div className="row">
        <Routes>
          <Route path="/" element={<h1>Moin</h1>} />
          <Route path="/map" element={<OsmMap />} />
          
        </Routes>
      </div>
    </div>
  );
}

export default App;
