const { TripMatch } = require("./models");

// Function to get all tripMatches
async function getAllTripMatches(req, res) {
  try {
    const tripMatches = await TripMatch.findAll();
    res.json(tripMatches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function addTripMatch(req, res) {
  try {
    const { relatedTripPatternId, relatedOfferings } = req.body;

    // Validate that all required fields are present in the request body
    if (!relatedTripPatternId || !relatedOfferings) {
      return res.status(400).json({
        message: `relatedTripPatternId and relatedOfferings are required fields.`,
      });
    }

    const tripMatchData = {
      relatedTripPatternId,
      relatedOfferings,
    };

    const newTripMatch = await TripMatch.create(tripMatchData);
    res.status(201).json(newTripMatch);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error: " + error });
  }
}

async function getTripMatch(req, res) {
  try {
    const tripMatchId = req.params.id;
    const tripMatch = await TripMatch.findByPk(tripMatchId);

    if (!tripMatch) {
      return res.status(404).json({ message: "TripMatch not found" });
    }

    res.json(tripMatch);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function deleteTripMatch(req, res) {
  try {
    const tripMatchId = req.params.id;
    const tripMatch = await TripMatch.findByPk(tripMatchId);

    if (!tripMatch) {
      return res.status(404).json({ message: "TripMatch not found" });
    }

    await tripMatch.destroy();
    res.json({ message: "TripMatch deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  getAllTripMatches,
  addTripMatch,
  getTripMatch,
  deleteTripMatch,
};
