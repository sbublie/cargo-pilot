import mapboxgl from "mapbox-gl";

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
    admin_location: {
      city: string;
      postal_code: number;
    };
    timestamp: number;
  };
  destination: {
    geo_location: {
      lat: number;
      long: number;
    };
    admin_location: {
      city: string;
      postal_code: number;
    };
    timestamp: number;
  };
  location: {
    geo_location: {
      lat: number;
      long: number;
    };
    admin_location: {
      city: string;
      postal_code: number;
    };
    timestamp: number;
  };
}

interface ProjectedTrip {
  id: number;
  included_orders: number[];
  num_driving_sections: number;
  start_time: number;
  trip_sections: TripSection[];
  total_loading_meter_utilization: number;
  total_weight_utilization: number;
}

export interface ProjectedTripResult {
  result: {
    average_distance: number;
    number_trips: number;
    total_distance: number;
    num_of_dropped_nodes: number;
    trips: ProjectedTrip[];
  };
}

const mainColors = ["blue", "red", "green", "orange", "purple", "brown"]; // List of main colors

export function getProjectedTripsLineGeoJson(
  projected_trips: ProjectedTripResult
) {
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
                trip_id: trip.id,
                distance: section.distance,
                weight_utilization: section.weight_utilization,
                loading_meter_utilization: section.loading_meter_utilization,
                loaded_cargo_weight: section.loaded_cargo.weight,
                loaded_cargo_loading_meter: section.loaded_cargo.loading_meter,
                line_color: lineColor,
                line_weight: 5,
                line_opacity: 0.5,
                timestamp_origin: section.origin.timestamp,
                timestamp_destination: section.destination.timestamp,
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

export function getProjectedTripsPointGeoJson(
  projected_trips: ProjectedTripResult
) {
  const geoJson = {
    type: "FeatureCollection",
    features: projected_trips.result.trips.flatMap((trip, index) => {
      const colorIndex = index % mainColors.length; // Use index to select color from the mainColors array
      const lineColor = mainColors[colorIndex];
      let count = 0;
      return trip.trip_sections
        .map((section) => {
          if (
            section.section_type === "LOADING" ||
            section.section_type === "UNLOADING"
          ) {
            count++;
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
                id: count,
                color: lineColor,
                city: section.location.admin_location.city,
                changed_weight: section.changed_weight,
                changed_loading_meter: section.changed_loading_meter,

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

export function addProjectedTripsToMap(
  map: mapboxgl.Map,
  lineGeoJson: any,
  pointGeoJson: any
) {
  const lines_source = map.getSource(
    "projected_trips_lines"
  ) as mapboxgl.GeoJSONSource;
  const points_source = map.getSource(
    "projected_trips_points"
  ) as mapboxgl.GeoJSONSource;

  if (!lines_source && !points_source) {
    map.addSource("projected_trips_lines", {
      type: "geojson",
      data: lineGeoJson,
    });

    map.addSource("projected_trips_points", {
      type: "geojson",
      data: pointGeoJson,
    });

    map.addLayer({
      id: "projected_trips_lines_layer",
      type: "line",
      source: "projected_trips_lines",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": ["get", "line_color"],
        "line-width": ["get", "line_weight"],
        "line-opacity": ["get", "line_opacity"],
      },
    });

    map.addLayer({
      id: "projected_trips_points_layer",
      type: "circle",
      source: "projected_trips_points",
      paint: {
        "circle-color": ["get", "color"],
        "circle-radius": 8,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#fff",
      },
    });

    map.addLayer({
      id: "projected_trips_points_count",
      type: "symbol",
      source: "projected_trips_points",
      layout: {
        "text-field": ["get", "id"],
        "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
        "text-size": 12,
      },
      paint: {
        "text-color": "white",
      },
    });
  } else {
    lines_source.setData(lineGeoJson);
    points_source.setData(pointGeoJson);
  }

  map.on("click", "projected_trips_points_layer", (e) => {
    const feature = e.features?.[0];
    if (feature) {
      // Assert that geometry is of a type that has coordinates
      const geometry =
        feature.geometry as mapboxgl.MapboxGeoJSONFeature["geometry"];
      const description = `<b>Location ${feature?.properties?.id}</b><br /> City: ${feature?.properties?.city}<br /> Changed weight: ${feature?.properties?.changed_weight} kg<br /> Changed loading meter: ${feature?.properties?.changed_loading_meter} m<br /`;

      if (
        geometry.type !== "GeometryCollection" &&
        geometry.coordinates &&
        description
      ) {
        console.log(geometry.type);
        if (geometry.type === "Point") {
          let coordinates = geometry.coordinates.slice() as [number, number];

          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(description)
            .addTo(map);
          e.stopPropagation();
        } else {
          console.error("Geometry type is not a Point");
        }
      } else {
        console.error("Feature geometry or properties are undefined");
      }
    }
  });

  map.on("click", "projected_trips_lines_layer", (e) => {
    const feature = e.features?.[0];
    if (feature) {
      // Assert that geometry is of a type that has coordinates
      const geometry =
        feature.geometry as mapboxgl.MapboxGeoJSONFeature["geometry"];
      const description = `<b>Sub-Trip ${feature?.properties?.id}</b><br /> Trip ID: ${feature?.properties?.trip_id}<br />  Distance: ${feature?.properties?.distance} km<br /> Weight: ${feature?.properties?.loaded_cargo_weight} kg<br /> Weight utilization: ${feature?.properties?.weight_utilization} %<br /> Loading meter: ${feature?.properties?.loaded_cargo_loading_meter} m<br /> Loading meter utilization: ${feature?.properties?.loading_meter_utilization} %  <br /> Timestamp origin: ${feature?.properties?.timestamp_origin} <br /> Timestamp destination: ${feature?.properties?.timestamp_destination} <br />`;

      if (
        geometry.type !== "GeometryCollection" &&
        geometry.coordinates &&
        description
      ) {
        console.log(geometry.type);
        if (geometry.type === "LineString") {
          let coordinates = e.lngLat;

          new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(description)
            .addTo(map);
          e.stopPropagation();
        } else {
          console.error("Geometry type is not a Point");
        }
      } else {
        console.error("Feature geometry or properties are undefined");
      }
    }
  });

  map.on("mouseenter", "projected_trips_lines_layer", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "projected_trips_lines_layer", () => {
    map.getCanvas().style.cursor = "";
  });
  map.on("mouseenter", "projected_trips_points_layer", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "projected_trips_points_layer", () => {
    map.getCanvas().style.cursor = "";
  });
}
