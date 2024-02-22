import React, { useContext, useState, ChangeEvent, FormEvent } from "react";
import { AuthContext } from "./../../App";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Card, Col, Container, Form, Row } from "react-bootstrap";

const Login: React.FC = () => {
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();

  const correct_username = "";
  const correct_password = "";

  if (!authContext) {
    throw new Error("AuthContext is not provided!");
  }

  const { login } = authContext;
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<boolean>(false);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  let redirectPath = queryParams.get("redirect");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    setLoginError(false);
    e.preventDefault();
    // Your authentication logic here
    // For simplicity, let's assume the user is authenticated if username and password are not empty
    if (username == correct_username && password == correct_password) {
      login(); // Update authentication state
      // Redirect to the requested page
      if (redirectPath == null) {
        redirectPath = "/";
      }
      navigate(redirectPath); // Replace "/requested-page" with the actual URL of the requested page
    } else {
      setLoginError(true);
    }
  };

  const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  return (
    <div className="bg-light" style={{ minHeight: "100vh" }}>
      <Container>
        <Row
          className="justify-content-center align-items-center"
          style={{ minHeight: "50vh" }}
        >
          <Col md={6}>
            <Card className="p-4">
              <Card.Body>
                <h2>Login</h2>
                <Form onSubmit={handleSubmit}>
                  <Form.Group key="Username" className="mt-3">
                    <Form.Label>Enter username</Form.Label>
                    <Form.Control
                      placeholder="Username"
                      value={username}
                      onChange={handleUsernameChange}
                      className={loginError ? "is-invalid" : ""}
                    />
                  </Form.Group>
                  <Form.Group key="password" className="mt-3">
                    <Form.Label>Enter password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={handlePasswordChange}
                      className={loginError ? "is-invalid" : ""}
                    />
                  </Form.Group>
                  <Button variant="primary" type="submit" className="mt-4">
                    Login
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;
