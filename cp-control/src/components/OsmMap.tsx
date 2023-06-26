import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";
import React, { useState, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import "./osm_style.css";
import L from "leaflet";
import { decode } from "@googlemaps/polyline-codec";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const addrPath = "http://"

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [10, 41],
  popupAnchor: [2, -40],
});

var redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function OsmMap() {
  const [trips, setTrips] = useState<any[]>([]);
  const [offerings, setOfferings] = useState<any[]>([]);

  // Function to make the API call
  const fetchTrips = async () => {
    try {
      const response = await fetch("/api/trips");
      const jsonData = await response.json();

      const tripsWithRoutes = await Promise.all(
        jsonData.map(async (trip:any) => {
          const originResponse = await fetch(
            addrPath + `localhost:5001/locations/${trip.origin_location_id}`
          );
          const originLocation = await originResponse.json();
          const originLatLong = [
            originLocation.center_lat,
            originLocation.center_long,
          ];

          const destinationResponse = await fetch(
            addrPath + `localhost:5001/locations/${trip.destination_location_id}`
          );
          const destinationLocation = await destinationResponse.json();
          const destinationLatLong = [
            destinationLocation.center_lat,
            destinationLocation.center_long,
          ];

          const routeResponse = await fetch(
            addrPath + "cp-routing:5002/ors/v2/directions/driving-car/json",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                coordinates: [
                  originLatLong.reverse(),
                  destinationLatLong.reverse(),
                ],
              }),
            }
          );
          const routeData = await routeResponse.json();
          const decodedCoordinates = decode(routeData.routes[0].geometry, 5);
          return {
            ...trip,
            originLocation: originLocation,
            destinationLocation: destinationLocation,
            originLatLong: originLatLong.reverse(),
            destinationLatLong: destinationLatLong.reverse(),
            route: decodedCoordinates,
          };
        })
      );

      setTrips(tripsWithRoutes);
    } catch (error) {
      console.log("Error:", error);
    }
  };

    // Function to make the API call
    const fetchOfferings = async () => {
      try {
        const response = await fetch(addrPath + "localhost:5001/offerings");
        const jsonData = await response.json();
  
        const tripsWithRoutes = await Promise.all(
          jsonData.map(async (offering:any) => {
            const originResponse = await fetch(
              addrPath + `localhost:5001/locations/${offering.origin_location_id}`
            );
            const originLocation = await originResponse.json();
            const originLatLong = [
              originLocation.center_lat,
              originLocation.center_long,
            ];
  
            const destinationResponse = await fetch(
              addrPath + `localhost:5001/locations/${offering.destination_location_id}`
            );
            const destinationLocation = await destinationResponse.json();
            const destinationLatLong = [
              destinationLocation.center_lat,
              destinationLocation.center_long,
            ];
  
            const routeResponse = await fetch(
              addrPath + `cp-routing:5002/ors/v2/directions/driving-car/json`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  coordinates: [
                    originLatLong.reverse(),
                    destinationLatLong.reverse(),
                  ],
                }),
              }
            );
            const routeData = await routeResponse.json();
            const decodedCoordinates = decode(routeData.routes[0].geometry, 5);
            return {
              ...offering,
              originLocation: originLocation,
              destinationLocation: destinationLocation,
              originLatLong: originLatLong.reverse(),
              destinationLatLong: destinationLatLong.reverse(),
              route: decodedCoordinates,
            };
          })
        );
  
        setOfferings(tripsWithRoutes);
      } catch (error) {
        console.log("Error:", error);
      }
    };

  

  useEffect(() => {
    fetchTrips();
    fetchOfferings();
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

        {trips ? (
          <>
            {trips.map((trip) => (
              <React.Fragment key={"trip"+trip.trip_id}>
                <Marker position={trip.originLatLong}>
                  <Popup>
                    <b>Location #{trip.originLocation.location_id}</b>
                    <br />
                    Type: Origin <br />
                    Cluster: Friedrichshafen
                  </Popup>
                </Marker>
                <Marker position={trip.destinationLatLong}>
                  <Popup>
                    <b>Location #{trip.destinationLocation.location_id}</b>
                    <br />
                    Type: Destination <br />
                    Cluster: Stuttgart
                  </Popup>
                </Marker>
                <Polyline positions={trip.route}>
                  <Popup>
                    <b>Recurring Trip #{trip.trip_id}</b>
                    <br />
                    Detected pattern: "thu_aftn" <br />
                    Average load: 0.4t
                  </Popup>
                </Polyline>
              </React.Fragment>
            ))}
          </>
        ) : (
          <p>Loading...</p>
        )}


        {offerings ? (
          <>
            {offerings.map((offering) => (
              <React.Fragment key={"offering"+offering.trip_id}>
                <Marker icon={redIcon}  position={offering.originLatLong}>
                  <Popup>
                    <b>Location #{offering.originLocation.location_id}</b>
                    <br />
                    Type: Origin <br />
                    Cluster: Friedrichshafen
                  </Popup>
                </Marker>
                <Marker icon={redIcon} position={offering.destinationLatLong}>
                  <Popup>
                    <b>Location #{offering.destinationLocation.location_id}</b>
                    <br />
                    Type: Destination <br />
                    Cluster: Stuttgart
                  </Popup>
                </Marker>
                <Polyline color="red" positions={offering.route}>
                  <Popup>
                    <b>Offering #{offering.offering_id}</b>
                    <br />
                    Time: {offering.timestamp} <br />
                    Available load: 1.5t
                  </Popup>
                </Polyline>
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
