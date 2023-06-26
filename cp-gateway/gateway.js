// Import dependencies
const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const cors = require("cors");

// PostgreSQL database configuration
const pool = new Pool({
  user: "pguser",
  host: "cp-db",
  database: "cargo_database",
  password: "pdb&3Xif",
  port: 5432, // Change if your PostgreSQL server runs on a different port
});

const privateKey = fs.readFileSync('./cert/privkey.pem', 'utf8')
const certificate = fs.readFileSync('./cert/cert.pem', 'utf8')
const ca = fs.readFileSync('./cert/chain.pem', 'utf8')

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca
};

// Create Express application
const app = express();
const port = 5001;

// Parse JSON request bodies
app.use(express.json());
app.use(cors());

// Get all clusters
app.get("/clusters", async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT * FROM clusters");
    const clusters = result.rows;
    client.release();
    res.json(clusters);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get a single cluster by ID
app.get("/clusters/:id", async (req, res) => {
  const clusterId = req.params.id;
  try {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT * FROM clusters WHERE cluster_id = $1",
      [clusterId]
    );
    const cluster = result.rows[0];
    client.release();

    if (cluster) {
      res.json(cluster);
    } else {
      res.status(404).json({ error: "Cluster not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a cluster by ID
app.delete("/clusters/:id", async (req, res) => {
  const clusterId = req.params.id;
  try {
    const client = await pool.connect();
    await client.query("DELETE FROM clusters WHERE cluster_id = $1", [
      clusterId,
    ]);
    client.release();
    res.json({ message: "Cluster deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add a new cluster
app.post("/clusters", async (req, res) => {
  const { cluster_name, center_lat, center_long } = req.body;
  try {
    const client = await pool.connect();
    const result = await client.query(
      "INSERT INTO clusters (cluster_name, center_lat, center_long) VALUES ($1, $2, $3) RETURNING *",
      [cluster_name, center_lat, center_long]
    );
    const newCluster = result.rows[0];
    client.release();
    res.status(201).json(newCluster);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Modify an existing cluster by ID
app.put("/clusters/:id", async (req, res) => {
  const clusterId = req.params.id;
  const { cluster_name, center_lat, center_long } = req.body;
  try {
    const client = await pool.connect();
    const result = await client.query(
      "UPDATE clusters SET cluster_name = $1, center_lat = $2, center_long = $3 WHERE cluster_id = $4 RETURNING *",
      [cluster_name, center_lat, center_long, clusterId]
    );
    const updatedCluster = result.rows[0];
    client.release();

    if (updatedCluster) {
      res.json(updatedCluster);
    } else {
      res.status(404).json({ error: "Cluster not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all trips
app.get("/trips", async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT * FROM trips");
    const trips = result.rows;
    client.release();
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get a single trip by ID
app.get("/trips/:id", async (req, res) => {
  const tripId = req.params.id;
  try {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT * FROM trips WHERE trip_id = $1",
      [tripId]
    );
    const trip = result.rows[0];
    client.release();

    if (trip) {
      res.json(trip);
    } else {
      res.status(404).json({ error: "Trip not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a trip by ID
app.delete("/trips/:id", async (req, res) => {
  const tripId = req.params.id;
  try {
    const client = await pool.connect();
    await client.query("DELETE FROM trips WHERE trip_id = $1", [tripId]);
    client.release();
    res.json({ message: "Trip deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add a new trip
app.post("/trips", async (req, res) => {
  const { load, origin_location_id, destination_location_id, timestamp } =
    req.body;
  try {
    const client = await pool.connect();
    const result = await client.query(
      "INSERT INTO trips (load, origin_location_id, destination_location_id, timestamp) VALUES ($1, $2, $3, $4) RETURNING *",
      [load, origin_location_id, destination_location_id, timestamp]
    );
    const newTrip = result.rows[0];
    client.release();
    res.status(201).json(newTrip);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a new location
app.post("/locations", (req, res) => {
  const { center_lat, center_long, cluster_id } = req.body;

  pool.query(
    "INSERT INTO locations (center_lat, center_long, cluster_id) VALUES ($1, $2, $3) RETURNING *",
    [center_lat, center_long, cluster_id],
    (error, results) => {
      if (error) {
        res
          .status(500)
          .json({ error: "An error occurred while creating the location." });
      } else {
        res.status(201).json(results.rows[0]);
      }
    }
  );
});

// Get all locations
app.get("/locations", (req, res) => {
  pool.query("SELECT * FROM locations", (error, results) => {
    if (error) {
      res
        .status(500)
        .json({ error: "An error occurred while retrieving the locations." });
    } else {
      res.status(200).json(results.rows);
    }
  });
});

// Get a single location by ID
app.get("/locations/:id", (req, res) => {
  const id = req.params.id;

  pool.query(
    "SELECT * FROM locations WHERE location_id = $1",
    [id],
    (error, results) => {
      if (error) {
        res
          .status(500)
          .json({ error: "An error occurred while retrieving the location." });
      } else if (results.rows.length === 0) {
        res.status(404).json({ error: "Location not found." });
      } else {
        res.status(200).json(results.rows[0]);
      }
    }
  );
});

// Update a location by ID
app.put("/locations/:id", (req, res) => {
  const id = req.params.id;
  const { center_lat, center_long, cluster_id } = req.body;

  pool.query(
    "UPDATE locations SET center_lat = $1, center_long = $2, cluster_id = $3 WHERE location_id = $4 RETURNING *",
    [center_lat, center_long, cluster_id, id],
    (error, results) => {
      if (error) {
        res
          .status(500)
          .json({ error: "An error occurred while updating the location." });
      } else if (results.rows.length === 0) {
        res.status(404).json({ error: "Location not found." });
      } else {
        res.status(200).json(results.rows[0]);
      }
    }
  );
});

// Delete a location by ID
app.delete("/locations/:id", (req, res) => {
  const id = req.params.id;

  pool.query(
    "DELETE FROM locations WHERE location_id = $1 RETURNING *",
    [id],
    (error, results) => {
      if (error) {
        res
          .status(500)
          .json({ error: "An error occurred while deleting the location." });
      } else if (results.rows.length === 0) {
        res.status(404).json({ error: "Location not found." });
      } else {
        res.status(200).json(results.rows[0]);
      }
    }
  );
});

// Create a new offering
app.post("/offerings", (req, res) => {
  const { load, origin_location_id, destination_location_id, timestamp } =
    req.body;

  pool.query(
    "INSERT INTO offerings (load, origin_location_id, destination_location_id, timestamp) VALUES ($1, $2, $3, $4) RETURNING *",
    [load, origin_location_id, destination_location_id, timestamp],
    (error, results) => {
      if (error) {
        res
          .status(500)
          .json({ error: "An error occurred while creating the offering." });
      } else {
        res.status(201).json(results.rows[0]);
      }
    }
  );
});

// Get all offerings
app.get("/offerings", (req, res) => {
  pool.query("SELECT * FROM offerings", (error, results) => {
    if (error) {
      res
        .status(500)
        .json({ error: "An error occurred while retrieving the offerings." });
    } else {
      res.status(200).json(results.rows);
    }
  });
});

// Get a single offering by ID
app.get("/offerings/:id", (req, res) => {
  const id = req.params.id;

  pool.query(
    "SELECT * FROM offerings WHERE offering_id = $1",
    [id],
    (error, results) => {
      if (error) {
        res
          .status(500)
          .json({ error: "An error occurred while retrieving the offering." });
      } else if (results.rows.length === 0) {
        res.status(404).json({ error: "Offering not found." });
      } else {
        res.status(200).json(results.rows[0]);
      }
    }
  );
});

// Update an offering by ID
app.put("/offerings/:id", (req, res) => {
  const id = req.params.id;
  const { load, origin_location_id, destination_location_id, timestamp } =
    req.body;

  pool.query(
    "UPDATE offerings SET load = $1, origin_location_id = $2, destination_location_id = $3, timestamp = $4 WHERE offering_id = $5 RETURNING *",
    [load, origin_location_id, destination_location_id, timestamp, id],
    (error, results) => {
      if (error) {
        res
          .status(500)
          .json({ error: "An error occurred while updating the offering." });
      } else if (results.rows.length === 0) {
        res.status(404).json({ error: "Offering not found." });
      } else {
        res.status(200).json(results.rows[0]);
      }
    }
  );
});

// Delete an offering by ID
app.delete("/offerings/:id", (req, res) => {
  const id = req.params.id;

  pool.query(
    "DELETE FROM offerings WHERE offering_id = $1 RETURNING *",
    [id],
    (error, results) => {
      if (error) {
        res
          .status(500)
          .json({ error: "An error occurred while deleting the offering." });
      } else if (results.rows.length === 0) {
        res.status(404).json({ error: "Offering not found." });
      } else {
        res.status(200).json(results.rows[0]);
      }
    }
  );
});

// Create and start https server to handle all incoming traffic
const httpsServer = https.createServer(credentials, app);


httpsServer.listen(port, () => {
  console.log('HTTPS Server started')
})


