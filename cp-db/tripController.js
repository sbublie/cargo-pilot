const { Trip, Location } = require("./models");

// Function to get all trips
async function getAllTrips(req, res) {
  try {
    const trips = await Trip.findAll({
      include: [
        { model: Location, as: "destination"},
        { model: Location, as: "origin"},
      ],
    });
    res.json(trips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function addTrip(req, res) {
  try {
    const {
      customer,
      destination_id,
      origin_id,
      source,
      type,
      vehicle,
      load_percentage,
      load_meter,
      load_weight,
    } = req.body;

    // Validate that all required fields are present in the request body
    if (
      !destination_id ||
      !origin_id ||
      !source ||
      !type
    ) {
      return res.status(400).json({
        message: `destination_id, origin_id, source, and type are required fields.`,
      });
    }

    // Create an object with the required and optional fields
    const tripData = {

      destination_id,
      origin_id,
      source,
      type,
    };

    // Include optional fields if they exist in the request body
    if (customer) {
      tripData.customer = customer;
    }
    if (vehicle) {
      tripData.vehicle = vehicle;
    }
    if (load_percentage !== undefined) {
      tripData.load_percentage = load_percentage;
    }
    if (load_meter !== undefined) {
      tripData.load_meter = load_meter;
    }
    if (load_weight !== undefined) {
      tripData.load_weight = load_weight;
    }

    const newTrip = await Trip.create(tripData);

    res.status(201).json(newTrip);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error: " + error });
  }
}

async function getTrip(req, res) {
  try {
    const tripId = req.params.id;
    const trip = await Trip.findByPk(tripId);

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    res.json(trip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function deleteTrip(req, res) {
  try {
    const tripId = req.params.id;
    const trip = await Trip.findByPk(tripId);

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    await trip.destroy();
    res.json({ message: "Trip deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  getAllTrips,
  addTrip,
  getTrip,
  deleteTrip,
};
