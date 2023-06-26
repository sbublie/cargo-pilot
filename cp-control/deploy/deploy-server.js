const express = require("express");
const http = require('http');
const https = require('https');
const fs = require('fs')
const path = require('path')

const app = express();

const privateKey = fs.readFileSync('./cert/privkey.pem', 'utf8')
const certificate = fs.readFileSync('./cert/cert.pem', 'utf8')
const ca = fs.readFileSync('./cert/chain.pem', 'utf8')

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca
};

// Redirect all http traffic to https 
//app.all('*',(req, res, next) => {
//req.secure ? next() : res.redirect('https://' + req.headers.host + req.url)
//});

// Tell express to use publish the index.html file from the build folder on the base URL
app.use(express.static(path.join(__dirname, 'build')));
app.get('/', function(req, res){
   res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Create and start both http and https server to handle all incoming traffic
const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

httpServer.listen(80, () => {
  console.log('HTTP Server started')
})

httpsServer.listen(443, () => {
  console.log('HTTPS Server started')
})