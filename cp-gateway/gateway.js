// Import dependencies
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors')

// PostgreSQL database configuration
const pool = new Pool({
  user: 'pguser',
  host: 'cp-db',
  database: 'cargo_database',
  password: 'pdb&3Xif',
  port: 5432, // Change if your PostgreSQL server runs on a different port
});

// Create Express application
const app = express();
const port = 5001

// Parse JSON request bodies
app.use(bodyParser.json());
app.use(cors());
app.options('*', cors())

// Get all clusters
app.get('/clusters', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM clusters');
      const clusters = result.rows;
      client.release();
      res.json(clusters);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Get a single cluster by ID
  app.get('/clusters/:id', async (req, res) => {
    const clusterId = req.params.id;
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM clusters WHERE cluster_id = $1', [clusterId]);
      const cluster = result.rows[0];
      client.release();
  
      if (cluster) {
        res.json(cluster);
      } else {
        res.status(404).json({ error: 'Cluster not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Delete a cluster by ID
  app.delete('/clusters/:id', async (req, res) => {
    const clusterId = req.params.id;
    try {
      const client = await pool.connect();
      await client.query('DELETE FROM clusters WHERE cluster_id = $1', [clusterId]);
      client.release();
      res.json({ message: 'Cluster deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Add a new cluster
  app.post('/clusters', async (req, res) => {
    const { cluster_name, center_lat, center_long } = req.body;
    try {
      const client = await pool.connect();
      const result = await client.query(
        'INSERT INTO clusters (cluster_name, center_lat, center_long) VALUES ($1, $2, $3) RETURNING *',
        [cluster_name, center_lat, center_long]
      );
      const newCluster = result.rows[0];
      client.release();
      res.status(201).json(newCluster);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Modify an existing cluster by ID
  app.put('/clusters/:id', async (req, res) => {
    const clusterId = req.params.id;
    const { cluster_name, center_lat, center_long } = req.body;
    try {
      const client = await pool.connect();
      const result = await client.query(
        'UPDATE clusters SET cluster_name = $1, center_lat = $2, center_long = $3 WHERE cluster_id = $4 RETURNING *',
        [cluster_name, center_lat, center_long, clusterId]
      );
      const updatedCluster = result.rows[0];
      client.release();
  
      if (updatedCluster) {
        res.json(updatedCluster);
      } else {
        res.status(404).json({ error: 'Cluster not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get all trips
app.get('/trips', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM trips');
      const trips = result.rows;
      client.release();
      res.json(trips);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Get a single trip by ID
  app.get('/trips/:id', async (req, res) => {
    const tripId = req.params.id;
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM trips WHERE trip_id = $1', [tripId]);
      const trip = result.rows[0];
      client.release();
  
      if (trip) {
        res.json(trip);
      } else {
        res.status(404).json({ error: 'Trip not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Delete a trip by ID
  app.delete('/trips/:id', async (req, res) => {
    const tripId = req.params.id;
    try {
      const client = await pool.connect();
      await client.query('DELETE FROM trips WHERE trip_id = $1', [tripId]);
      client.release();
      res.json({ message: 'Trip deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Add a new trip
  app.post('/trips', async (req, res) => {
    const { load, origin_lat, origin_long, destination_lat, destination_long, timestamp, cluster_ID } = req.body;
    try {
      const client = await pool.connect();
      const result = await client.query(
        'INSERT INTO trips (load, origin_lat, origin_long, destination_lat, destination_long, timestamp, cluster_ID) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [load, origin_lat, origin_long, destination_lat, destination_long, timestamp, cluster_ID]
      );
      const newTrip = result.rows[0];
      client.release();
      res.status(201).json(newTrip);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Modify an existing trip by ID
  app.put('/trips/:id', async (req, res) => {
    const tripId = req.params.id;
    const { load, origin_lat, origin_long, destination_lat, destination_long, timestamp, cluster_ID } = req.body;
    try {
      const client = await pool.connect();
      const result = await client.query(
        'UPDATE trips SET load = $1, origin_lat = $2, origin_long = $3, destination_lat = $4, destination_long = $5, timestamp = $6, cluster_ID = $7 WHERE trip_id = $8 RETURNING *',
        [load, origin_lat, origin_long, destination_lat, destination_long, timestamp, cluster_ID, tripId]
      );
      const updatedTrip = result.rows[0];
      client.release();
  
      if (updatedTrip) {
        res.json(updatedTrip);
      } else {
        res.status(404).json({ error: 'Trip not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });