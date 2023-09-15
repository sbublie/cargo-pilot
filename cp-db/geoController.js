const fs = require('fs').promises;

async function getGeo(req, res) {
  let geoJSONData = {};

  try {
    const data = await fs.readFile('germany.geojson', 'utf8');
    geoJSONData = JSON.parse(data);
  } catch (err) {
    console.error('Error:', err);
    return res.json({ message: 'Error reading or parsing the GeoJSON file' });
  }
  
  res.json({ geoJSONData });
}

module.exports = {
  getGeo,
};

