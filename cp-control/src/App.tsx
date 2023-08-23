//import OsmMap from "./components/OsmMap";
import MapboxMap from "./components/MapboxMap";
import StartPage from "./components/StartPage";
import { Link, NavLink, Routes, Route } from 'react-router-dom'
import { Navbar, Nav } from 'react-bootstrap'
function App() {
  return (
    <div className="container text-center">
      <Navbar bg="dark" variant="dark">
        {/* "Link" in brand component since just redirect is needed */}
        <div><h5>&nbsp;&nbsp;</h5></div>
        <Navbar.Brand as={Link} to="/">
          Cargo Pilot
        </Navbar.Brand>
        <Nav>
          {/* "NavLink" here since "active" class styling is needed */}
          <Nav.Link as={NavLink} to="/" >
            Home
          </Nav.Link>
          <Nav.Link as={NavLink} to="/map">
            Map
          </Nav.Link>
        </Nav>
      </Navbar>
      <div className="row">
        <Routes>
        <Route path="/" element={<StartPage/>} />
          <Route path="/map" element={<MapboxMap />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
