import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests"></meta>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
