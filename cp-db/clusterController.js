const { Cluster } = require("./models");

// Function to get all clusters
async function getAllClusters(req, res) {
  try {
    const clusters = await Cluster.findAll();
    res.json(clusters);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function addCluster(req, res) {
  try {
    const { center_lat, center_long, location_ids } = req.body;

    // Validate that all required fields are present in the request body
    if (!center_lat || !center_long || !location_ids) {
      return res.status(400).json({
        message: `center_lat, center_long and location_ids are required fields.`,
      });
    }
    const newCluster = await Cluster.create({
      center_lat,
      center_long,
      location_ids,
    });
    res.status(201).json(newCluster);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error: " + error });
  }
}

async function getCluster(req, res) {
  try {
    const clusterId = req.params.id;
    const cluster = await Cluster.findByPk(clusterId);

    if (!cluster) {
      return res.status(404).json({ message: "Cluster not found" });
    }

    res.json(cluster);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function deleteCluster(req, res) {
  try {
    const clusterId = req.params.id;
    const cluster = await Cluster.findByPk(clusterId);

    if (!cluster) {
      return res.status(404).json({ message: "Cluster not found" });
    }

    await cluster.destroy();
    res.json({ message: "Cluster deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  getAllClusters,
  addCluster,
  getCluster,
  deleteCluster,
};
