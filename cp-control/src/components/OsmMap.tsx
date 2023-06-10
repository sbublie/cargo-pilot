import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
} from "react-leaflet";
import React, { useState, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import "./osm_style.css";
import L from "leaflet";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [10, 41],
  popupAnchor: [2, -40],
});

L.Marker.prototype.options.icon = DefaultIcon;

function OsmMap() {

  const [data, setData] = useState<any[]>([]);
  // Function to make the API call
  const fetchData = async () => {
    try {
      const response = await fetch("http://cp-gateway:5001/trips");
      const jsonData = await response.json();
      setData(jsonData);
      console.log(jsonData);
    } catch (error) {
      console.log("Error:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <MapContainer
        center={[47.66556827380604, 9.44608097446138]}
        zoom={16}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {data ? (
          <>
            {data.map((trip) => (
              <React.Fragment key={trip.trip_id}>
                <Marker position={[trip.origin_lat, trip.origin_long]}></Marker>
                <Marker
                  position={[trip.destination_lat, trip.destination_long]}
                ></Marker>
                <Polyline positions={[[trip.origin_lat, trip.origin_long], [trip.destination_lat, trip.destination_long]]}></Polyline>
              </React.Fragment>
            ))}
          </>
        ) : (
          <p>Loading...</p>
        )}

      </MapContainer>
    </div>
  );
}

export default OsmMap;
