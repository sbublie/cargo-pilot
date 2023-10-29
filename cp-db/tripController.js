const {
  CompletedTrip,
  Location,
  Vehicle,
  GeoLocation,
  AdminLocation,
  CargoItem
} = require("./models");

// Function to get all trips
async function getAllTrips(req, res) {
  try {
    const trips = await CompletedTrip.findAll({
      attributes: ["id", "customer", "data_source"],
      include: [
        {
          model: Location,
          as: "destination",
          attributes: ["timestamp"], // Include necessary attributes from Location model
          include: [
            {
              as: "admin_location",
              model: AdminLocation,
              attributes: ["street", "postal_code", "city", "country"], // Include necessary attributes from AdminLocation model
            },
            {
              as: "geo_location",
              model: GeoLocation,
              attributes: ["lat", "long"], // Include necessary attributes from GeoLocation model
            },
          ],
        },
        {
          model: Location,
          as: "origin",
          attributes: ["timestamp"], // Include necessary attributes from Location model
          include: [
            {
              as: "admin_location",
              model: AdminLocation,
              attributes: ["street", "postal_code", "city", "country"], // Include necessary attributes from AdminLocation model
            },
            {
              as: "geo_location",
              model: GeoLocation,
              attributes: ["lat", "long"], // Include necessary attributes from GeoLocation model
            },
          ],
        },
        {
          model: CargoItem,
          as: "cargo_item",
          attributes: [
            "loading_meter",
            "weight",
            "load_carrier",
            "load_carrier_nestable",
          ],
        },
        {
          model: Vehicle,
          as: "vehicle",
          attributes: ["id", "type", "stackable", "max_load_meter", "max_weight"],
        },
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
      data_source,
      origin,
      destination,
      cargo_item,
      customer,
      route_locations,
      vehicle,
    } = req.body;

    // Create GeoLocation for origin and destination
    const originGeoLocation = await GeoLocation.create(origin.geo_location);
    const destinationGeoLocation = await GeoLocation.create(
      destination.geo_location
    );
    const newCargoItem = await CargoItem.create({
      load_carrier: cargo_item.load_carrier,
      load_carrier_nestable: cargo_item.load_carrier_nestable,
      loading_meter: cargo_item.loading_meter,
      weight: cargo_item.weight,
    });

    const originLocation = await Location.create({
      timestamp: origin.timestamp,
    });
    await originLocation.setGeo_location(originGeoLocation);
    //await originLocation.setAdmin_location(originAdminLocation);

    const destinationLocation = await Location.create({
      timestamp: destination.timestamp,
    });
    await destinationLocation.setGeo_location(destinationGeoLocation);
    //await destinationLocation.setAdmin_location(destinationAdminLocation);

    const newVehicle = await Vehicle.findOne({ where: { id: vehicle.id } });

    if (!newVehicle) {
      newVehicle = await Vehicle.create({
      id: vehicle.id,
      type: vehicle.type,
      stackable: vehicle.stackable,
      max_load_meter: vehicle.max_load_meter,
      max_weight: vehicle.max_weight,
    });
    }

    const newCompletedTrip = await CompletedTrip.create({
      data_source: data_source,
      customer: customer,
    });

    await newCompletedTrip.setDestination(destinationLocation);
    await newCompletedTrip.setOrigin(originLocation);
    await newCompletedTrip.setCargo_item(newCargoItem);
    await newCompletedTrip.setVehicle(newVehicle);

    res.status(201).json(newCompletedTrip);
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
