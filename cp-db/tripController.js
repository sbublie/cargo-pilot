const { Trip } = require("./models");

// Function to get all trips
async function getAllTrips(req, res) {
  try {
    const trips = await Trip.findAll();
    res.json(trips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function addTrip(req, res) {
  try {
    const { customer_id, destination_id, origin_id, source, type, vehicle_id } =
      req.body;

    // Validate that all required fields are present in the request body
    if (
      !customer_id ||
      !destination_id ||
      !origin_id ||
      !source ||
      !type ||
      !vehicle_id
    ) {
      return res
        .status(400)
        .json({
          message: `customer_id, destination_id, origin_id, source, type and vehicle_id are required fields.`,
        });
    }
    const newTrip = await Trip.create({
      customer_id,
      destination_id,
      origin_id,
      source,
      type,
      vehicle_id,
    });
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
