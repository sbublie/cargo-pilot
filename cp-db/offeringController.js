const { Offering } = require("./models");

// Function to get all offerings
async function getAllOfferings(req, res) {
  try {
    const offerings = await Offering.findAll();
    res.json(offerings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function addOffering(req, res) {
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
    const offeringData = {
      destination_id,
      origin_id,
      source,
      type,
    };

    // Include optional fields if they exist in the request body
    if (customer) {
      offeringData.customer = customer;
    }
    if (vehicle) {
      offeringData.vehicle = vehicle;
    }
    if (load_percentage !== undefined) {
      offeringData.load_percentage = load_percentage;
    }
    if (load_meter !== undefined) {
      offeringData.load_meter = load_meter;
    }
    if (load_weight !== undefined) {
      offeringData.load_weight = load_weight;
    }

    const newOffering = await Offering.create(offeringData);

    res.status(201).json(newOffering);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error: " + error });
  }
}

async function getOffering(req, res) {
  try {
    const offeringId = req.params.id;
    const offering = await Offering.findByPk(offeringId);

    if (!offering) {
      return res.status(404).json({ message: "Offering not found" });
    }

    res.json(offering);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function deleteOffering(req, res) {
  try {
    const offeringId = req.params.id;
    const offering = await Offering.findByPk(offeringId);

    if (!offering) {
      return res.status(404).json({ message: "Offering not found" });
    }

    await offering.destroy();
    res.json({ message: "Offering deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  getAllOfferings,
  addOffering,
  getOffering,
  deleteOffering,
};
