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
    if (!location_ids) {
      return res.status(400).json({
        message: `location_ids is a required field.`,
      });
    }

    const clusterData = {
      location_ids,
    };

    if (center_lat !== undefined) {
      clusterData.center_lat = center_lat;
    }
    if (center_long !== undefined) {
      clusterData.center_long = center_long;
    }

    const newCluster = await Cluster.create(clusterData);
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

async function deleteAllClusters(req, res) {
  try {
    await Cluster.destroy({ where: {} });  // This deletes all clusters
    res.json({ message: "All clusters deleted successfully" });
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
  deleteAllClusters
};
