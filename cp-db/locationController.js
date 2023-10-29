const { Location, GeoLocation, AdminLocation } = require("./models");

// Function to get all locations
async function getAllLocations(req, res) {
  try {
    const locations = await Location.findAll({
      attributes: ["id", "timestamp"],
      include: [
        {
          model: GeoLocation,
          as: "geo_location",
          attributes: ["lat", "long"],
        },
        {
          model: AdminLocation,
          as: "admin_location",
          attributes: ["street", "postal_code", "city", "country"], 
        },
      ],
    });
    res.json(locations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function addLocation(req, res) {
  try {
    const { lat, long, type, timestamp, zip_code, city, street, country } = req.body;

    // Validate that all required fields are present in the request body
    if (!type) {
      return res.status(400).json({ message: `type is a required field.` });
    }

    const locationData =  {
      type
    }

    if (lat != undefined) {
      locationData.lat = lat
    }
    if (long != undefined) {
      locationData.long = long
    }
    if (timestamp) {
      locationData.timestamp = timestamp
    }
    if (zip_code) {
      locationData.zip_code = zip_code
    }
    if (city) {
      locationData.city = city
    }
    if (street) {
      locationData.street = street
    }
    if (country) {
      locationData.country = country
    }

    const newLocation = await LocationOld.create(locationData);
    res.status(201).json(newLocation);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error: " + error });
  }
}

async function getLocation(req, res) {
  try {
    const locationId = req.params.id;
    const location = await LocationOld.findByPk(locationId);

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
    const location = await LocationOld.findByPk(locationId);

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
  deleteLocation,
};
