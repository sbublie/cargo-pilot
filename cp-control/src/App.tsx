//import OsmMap from "./components/OsmMap";
import MapboxMap from "./components/mapbox/MapboxMap";
import StartPage from "./components/StartPage";
import { Link, NavLink, Routes, Route, Navigate, RouteProps, useLocation  } from "react-router-dom";
import { Navbar, Nav } from "react-bootstrap";
import { OfferingsProvider } from "./contexts/OfferingsContext";
import { ApiHandler } from "./components/ApiHandler";
import Optimizer from "./components/optimizer/Optimizer";
import { version } from "../package.json";
import React, { useContext, FC, ReactNode } from "react";
import Login from "./components/login/LoginPage";

interface AuthContextProps {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
}

// 1. Create an Authentication Context
export const AuthContext = React.createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode
}

// 2. Auth Provider Component
const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isLoggedIn, setIsLoggedIn] = React.useState<boolean>(false); // Example state for authentication status

  // Example login function
  const login = () => {
    setIsLoggedIn(true);
    // Additional logic like setting tokens, etc.
  };

  // Example logout function
  const logout = () => {
    setIsLoggedIn(false);
    // Additional logic like clearing tokens, etc.
  };

  // Provide the authentication context value to children components
  const contextValue: AuthContextProps = { isLoggedIn, login, logout };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Auth Guard Component
const PrivateRoute: FC<RouteProps> = ({ element}) => {
  const authContext = useContext(AuthContext);
  const location = useLocation();

  // Check if authContext is undefined or null
  if (!authContext || !authContext.isLoggedIn) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} />;
  }

  return authContext.isLoggedIn ? element : <Navigate to="/login" />;
};

function App() {
  return (
    <OfferingsProvider>
      <AuthProvider>
        <ApiHandler />

        <Navbar bg="dark" variant="dark">
          {/* "Link" in brand component since just redirect is needed */}

          <Navbar.Brand as={Link} to="/" className="ms-4">
            Cargo Pilot
          </Navbar.Brand>
          <Nav>
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
              <div className="text-light me-4">v{version}</div>
            </Nav.Item>
          </Nav>
        </Navbar>

        <Routes>
        <Route path="/" element={<StartPage />} />
          <Route path="/login" element={<Login />} />
          {/* Protect routes that require authentication */}
          <Route
            path="/map"
            element={<PrivateRoute element={<MapboxMap />} />}
          />
          <Route
            path="/optimizer"
            element={<PrivateRoute element={<Optimizer />} />}
          />
        </Routes>
      </AuthProvider>
    </OfferingsProvider>
  );
}

export default App;
