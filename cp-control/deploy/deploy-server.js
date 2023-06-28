const express = require("express");
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const app = express();
const proxy = require("express-http-proxy");
const authenticateToken = require('./authMiddleware');
const dotenv = require('dotenv');

dotenv.config();

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
// The order of the use commands here is important as the routes have a common base path
app.use("/api/routing", authenticateToken, proxy("http://cp-routing:8080"));
app.use("/api", authenticateToken, proxy("http://cp-gateway:5001"));


// Tell express to use publish the index.html file from the build folder on the base URL
app.use(express.static(path.join(__dirname, "build")));
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Create and start both http and https server to handle all incoming traffic
const httpServer = http.createServer(app);

httpServer.listen(80, () => {
  console.log("HTTP Server started");
});
