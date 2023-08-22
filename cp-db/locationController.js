const { Location } = require("./models");

// Function to get all locations
async function getAllLocations(req, res) {
  try {
    const locations = await Location.findAll();
    res.json(locations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function addLocation(req, res) {
  try {
    const { lat, long, type, timestamp } = req.body;

    // Validate that all required fields are present in the request body
    if (!lat || !long || !type || !timestamp) {
      return res
        .status(400)
        .json({ message: `lat, long, and type are required fields.` });
    }
    const newLocation = await Location.create({ lat, long, type, timestamp });
    res.status(201).json(newLocation);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Internal server error: "+error });
  }
}

async function getLocation(req, res) {
  try {
    const locationId = req.params.id;
    const location = await Location.findByPk(locationId);

    if (!location) {
      return res.status(404).json({ message: "Location not found" });
    }

    res.json(location);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function deleteLocation(req, res) {
  try {
    const locationId = req.params.id;
    const location = await Location.findByPk(locationId);

    if (!location) {
      return res.status(404).json({ message: "Location not found" });
    }

    await location.destroy();
    res.json({ message: "Location deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  getAllLocations,
  addLocation,
  getLocation,
  deleteLocation
};
