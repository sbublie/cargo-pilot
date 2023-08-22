const express = require("express");
const http = require("http");
const path = require("path");
const app = express();

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
