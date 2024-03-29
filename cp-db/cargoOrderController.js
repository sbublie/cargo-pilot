const {
  CargoOrder,
  Location,
  GeoLocation,
  AdminLocation,
  CargoItem,
} = require("./models");

// Function to get all cargo orders
async function getAllCargoOrders(req, res) {
  try {
    const orders = await CargoOrder.findAll({
      attributes: ["data_source", "id", "customer"],
      include: [
        {
          model: Location,
          as: "destination",
          attributes: ["timestamp", "id"], // Include necessary attributes from Location model
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
          attributes: ["timestamp", "id"], // Include necessary attributes from Location model
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
      ],
    });

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function addCargoOrder(req, res) {
  try {
    const {
      data_source,
      origin,
      destination,
      cargo_item,
      customer,
      route_locations,
    } = req.body;

    const originLocation = await Location.create({
      timestamp: origin.timestamp,
    });
    const destinationLocation = await Location.create({
      timestamp: destination.timestamp,
    });

    if (origin.geo_location.lat != null && origin.geo_location.long && destination.geo_location.lat != null && destination.geo_location.long != null) {
      // Create GeoLocation for origin and destination
      const originGeoLocation = await GeoLocation.create(origin.geo_location);
      const destinationGeoLocation = await GeoLocation.create(
        destination.geo_location
      );
      await originLocation.setGeo_location(originGeoLocation);
      await destinationLocation.setGeo_location(destinationGeoLocation);
    }

    // Create AdminLocation for origin and destination
    const originAdminLocation = await AdminLocation.create(
      origin.admin_location
    );
    const destinationAdminLocation = await AdminLocation.create(
      destination.admin_location
    );
    await originLocation.setAdmin_location(originAdminLocation);
    await destinationLocation.setAdmin_location(destinationAdminLocation);

    const newCargoItem = await CargoItem.create({
      load_carrier: cargo_item.load_carrier,
      load_carrier_nestable: cargo_item.load_carrier_nestable,
      loading_meter: cargo_item.loading_meter,
      weight: cargo_item.weight,
    });

    const newCargoOrder = await CargoOrder.create({
      data_source: data_source,
      customer: customer, // Assuming you have an association with Customer model
    });

    await newCargoOrder.setDestination(destinationLocation);
    await newCargoOrder.setOrigin(originLocation);

    // Associate CargoOrder with CargoItem
    await newCargoOrder.setCargo_item(newCargoItem);

    // Respond with the newly created CargoOrder record
    res.status(201).json(newCargoOrder);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
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
  getAllCargoOrders,
  addCargoOrder,
  getLocation,
  deleteLocation,
};
