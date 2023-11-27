//import OsmMap from "./components/OsmMap";
import MapboxMap from "./components/mapbox/MapboxMap";
import StartPage from "./components/StartPage";
import { Link, NavLink, Routes, Route } from "react-router-dom";
import { Navbar, Nav } from "react-bootstrap";
import { OfferingsProvider } from "./contexts/OfferingsContext";
import { ApiHandler } from "./components/ApiHandler";
import Optimizer from "./components/optimizer/Optimizer";

function App() {
  return (
    <OfferingsProvider>
      <ApiHandler />
      
        <Navbar bg="dark" variant="dark">
          {/* "Link" in brand component since just redirect is needed */}
          
          <Navbar.Brand as={Link} to="/" className="ms-4">
            Cargo Pilot
          </Navbar.Brand>
          <Nav >
            {/* "NavLink" here since "active" class styling is needed */}
            <Nav.Link as={NavLink} to="/">
              Home
            </Nav.Link>
            <Nav.Link as={NavLink} to="/map">
              Data Explorer
            </Nav.Link>
            <Nav.Link as={NavLink} to="/optimizer">
              Cargo Optimizer
            </Nav.Link>
            
          </Nav>
          <Nav className="ms-auto">
          <Nav.Item>
            <div className="text-light me-4" >
              v0.5.0
            </div>
          </Nav.Item>
        </Nav>
        </Navbar>
        
          <Routes>
            <Route path="/" element={<StartPage />} />
            <Route path="/map" element={<MapboxMap />} />
            <Route path="/optimizer" element={<Optimizer />} />
          </Routes>
        
      
    </OfferingsProvider>
  );
}

export default App;
