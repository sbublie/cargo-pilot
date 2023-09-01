const port = 5000;

const express = require("express");
const cors = require("cors");
const sequelize = require("./db");

const app = express();
app.use(express.json());
app.use(cors());

const locationController = require("./locationController");
const clusterController = require("./clusterController");
const tripController = require("./tripController");
const offeringController = require("./offeringController");
const tripPatternController = require("./tripPatternController");
const tripMatchController = require("./tripMatchController");

app.get("/locations", locationController.getAllLocations);
app.post("/locations", locationController.addLocation);
app.get("/locations/:id", locationController.getLocation);
app.delete("/locations/:id", locationController.deleteLocation);

app.get("/clusters", clusterController.getAllClusters);
app.post("/clusters", clusterController.addCluster);
app.get("/clusters/:id", clusterController.getCluster);
app.delete("/clusters/:id", clusterController.deleteCluster);

app.get("/trips", tripController.getAllTrips);
app.post("/trips", tripController.addTrip);
app.get("/trips/:id", tripController.getTrip);
app.delete("/trips/:id", tripController.deleteTrip);

app.get("/offerings", offeringController.getAllOfferings);
app.post("/offerings", offeringController.addOffering);
app.get("/offerings/:id", offeringController.getOffering);
app.delete("/offerings/:id", offeringController.deleteOffering);

app.get("/tripPattern", tripPatternController.getAllTripPatterns);
app.post("/tripPattern", tripPatternController.addTripPattern);
app.get("/tripPattern/:id", tripPatternController.getTripPattern);
app.delete("/tripPattern/:id", tripPatternController.deleteTripPattern);

app.get("/tripMatches", tripMatchController.getAllTripMatches);
app.post("/tripMatches", tripMatchController.addTripMatch);
app.get("/tripMatches/:id", tripMatchController.getTripMatch);
app.delete("/tripMatches/:id", tripMatchController.deleteTripMatch);

sequelize
  .sync()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to the database:", error);
  });
