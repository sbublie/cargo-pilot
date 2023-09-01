const { TripPattern } = require("./models");

// Function to get all tripPatterns
async function getAllTripPatterns(req, res) {
  try {
    const tripPatterns = await TripPattern.findAll();
    res.json(tripPatterns);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function addTripPattern(req, res) {
  try {
    const { detectedPattern, relatedTripIds } = req.body;

    // Validate that all required fields are present in the request body
    if (!detectedPattern || !relatedTripIds) {
      return res.status(400).json({
        message: `location_ids is a required field.`,
      });
    }

    const tripPatternData = {
      detectedPattern,
      relatedTripIds,
    };

    const newTripPattern = await TripPattern.create(tripPatternData);
    res.status(201).json(newTripPattern);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error: " + error });
  }
}

async function getTripPattern(req, res) {
  try {
    const tripPatternId = req.params.id;
    const tripPattern = await TripPattern.findByPk(tripPatternId);

    if (!tripPattern) {
      return res.status(404).json({ message: "TripPattern not found" });
    }

    res.json(tripPattern);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function deleteTripPattern(req, res) {
  try {
    const tripPatternId = req.params.id;
    const tripPattern = await TripPattern.findByPk(tripPatternId);

    if (!tripPattern) {
      return res.status(404).json({ message: "TripPattern not found" });
    }

    await tripPattern.destroy();
    res.json({ message: "TripPattern deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  getAllTripPatterns,
  addTripPattern,
  getTripPattern,
  deleteTripPattern,
};
