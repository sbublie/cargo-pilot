interface TripSection {
  id: number;
  section_type: string;
  weight_utilization: number;
  loading_meter_utilization: number;
  changed_loading_meter: number;
  changed_weight: number;
  distance: number;
  loaded_cargo: {
    weight: number;
    loading_meter: number;
  };
  origin: {
    geo_location: {
      lat: number;
      long: number;
    };
  };
  destination: {
    geo_location: {
      lat: number;
      long: number;
    };
  };
  location: {
    geo_location: {
      lat: number;
      long: number;
    };
  };
}

interface ProjectedTrip {
  id: number;
  included_orders: number[];
  num_driving_sections: number;
  start_time: number;
  trip_sections: TripSection[];
}

interface ProjectedTripResult {
  result: {
    average_distance: number;
    number_trips: number;
    total_distance: number;
    trips: ProjectedTrip[];
  };
}

const mainColors = ["blue", "red", "yellow", "green", "orange", "purple"]; // List of main colors

export function getProjectedTripsGeoJson(projected_trips: ProjectedTripResult) {
  const geoJson = {
    type: "FeatureCollection",
    features: projected_trips.result.trips.flatMap((trip, index) => {
    const colorIndex = index % mainColors.length; // Use index to select color from the mainColors array
    const lineColor = mainColors[colorIndex];
      return trip.trip_sections
        .map((section) => {
          if (section.section_type === "DRIVING") {
            return {
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: [
                  [
                    section.origin.geo_location.long,
                    section.origin.geo_location.lat,
                  ],
                  [
                    section.destination.geo_location.long,
                    section.destination.geo_location.lat,
                  ],
                ],
              },
              properties: {
                id: section.id,
                color: lineColor,
                weight: 5,
                opacity: 0.5,
              },
            };
          } else if (section.section_type === "LOADING") {
            return {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [
                  section.location.geo_location.long,
                  section.location.geo_location.lat,
                ],
              },
              properties: {
                id: section.id,
                color: "blue", // Change color or other properties as needed
              },
            };
          }
          return null; // Handle other section types if necessary
        })
        .filter((feature) => feature !== null); // Remove null values from the array
    }),
  };

  return geoJson;
}

export function addProjectedTripsToMap(map: mapboxgl.Map, geoJson: any) {
  const source = map.getSource("projected_trips") as mapboxgl.GeoJSONSource;

  if (!source) {
    map.addSource("projected_trips", {
      type: "geojson",
      data: geoJson,
    });

    map.addLayer({
      id: "projected_trips_layer",
      type: "line",
      source: "projected_trips",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": ["get", "color"],
        "line-width": ["get", "weight"],
        "line-opacity": ["get", "opacity"],
      },
    });
  } else {
    source.setData(geoJson);
  }
}
