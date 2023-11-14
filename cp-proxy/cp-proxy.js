const express = require("express");
const http = require("http");
const https = require("https");
const proxy = require("express-http-proxy");
const path = require("path");

const app = express();

if (process.env.ENABLE_HTTPS === "true") {
  const privateKey = fs.readFileSync("./cert/privkey.pem", "utf8");
  const certificate = fs.readFileSync("./cert/cert.pem", "utf8");
  const ca = fs.readFileSync("./cert/chain.pem", "utf8");

  const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca,
  };

  // Redirect all http traffic to https
  app.all("*", (req, res, next) => {
    req.secure ? next() : res.redirect("https://" + req.headers.host + req.url);
  });

  const httpsServer = https.createServer(credentials, app);

  httpsServer.listen(443, () => {
    console.log("HTTPS Server started");
  });
}

// Configure proxy for API access
app.use("/api/db", proxy("http://cp-db:5000"));
app.use("/api/analyzer", proxy("http://cp-analyzer:5000"));
app.use("/map", proxy("http://cp-control:80/map"));
app.use("/optimizer", proxy("http://cp-control:80/optimizer"));
app.use("/", proxy("http://cp-control:80"));

// Create and start both http and https server to handle all incoming traffic
const httpServer = http.createServer(app);

httpServer.listen(80, () => {
  console.log("HTTP Server started");
});
