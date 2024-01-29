import { useEffect } from "react";
import { useOfferings } from "../contexts/OfferingsContext";
import { Settings } from "./mapbox/MapboxMap";
import { Cluster } from "./mapbox/Cluster";

export function getCalcRoutes(settings: any): Promise<any[]> {
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  };

  // Return a Promise for the fetch operation
  return fetch(
    import.meta.env.VITE_BASE_URL + "api/analyzer/calc-routes",
    requestOptions
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .catch((error) => {
      // Handle the error here or rethrow it to be caught later
      console.error("Error fetching data: ", error);
      throw error;
    });
}

export async function getClusters(settings: Settings): Promise<Cluster[]> {
  var minTimestamp = 1;
  var maxTimestamp = 2000000000;
                     
  if (settings.applyFilter) {
    minTimestamp = settings.startTimestamp;
    maxTimestamp = settings.endTimestamp;
  }

  const requestSettings = {
    start_timestamp: minTimestamp,
    end_timestamp: maxTimestamp,
    eps: settings.eps,
    min_samples: settings.minSamples,
  };

  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestSettings),
  };

  try {
    const response = await fetch(
      import.meta.env.VITE_BASE_URL + "api/analyzer/cluster-orders",
      requestOptions
    );

    if (!response.ok) {
      throw new Error(
        "Network response was not ok: " +
          response.status +
          " " +
          response.statusText
      );
    }

    const responseJson = await response.json();

    const clusters = responseJson.result.map((clusterJson: any) =>
      Cluster.fromJson(clusterJson)
    );
    return clusters;
  } catch (error) {
    // Handle the error here or rethrow it to be caught later
    console.error("Error fetching data: ", error);
    throw error;
  }
}

export function ApiHandler() {
  const {
    setNewTrips,
    setNewCargoOrders,
    setNewClusters,
    setNewStats,
    setNewBoundaries,
  } = useOfferings();

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await fetch(
          import.meta.env.VITE_BASE_URL + "api/db/trips"
        );
        const jsonData = await response.json();
        setNewTrips(jsonData);
      } catch (error) {
        console.log("Error:", error);
      }
    };

    const fetchCargoOrders = async () => {
      try {
        const response = await fetch(
          import.meta.env.VITE_BASE_URL + "api/db/cargo-orders"
        );
        const jsonData = await response.json();
        setNewCargoOrders(jsonData);
      } catch (error) {
        console.log("Error:", error);
      }
    };

    const fetchClusters = async () => {
      try {
        const response = await fetch(
          import.meta.env.VITE_BASE_URL + "api/db/clusters"
        );
        const jsonData = await response.json();
        setNewClusters(jsonData);
      } catch (error) {
        console.log("Error:", error);
      }
    };

    const fetchStats = async () => {
      try {
        const response = await fetch(
          import.meta.env.VITE_BASE_URL + "api/analyzer/statistics"
        );
        const jsonData = await response.json();

        setNewStats(jsonData);
      } catch (error) {
        console.log("Error:", error);
      }
    };

    const fetchBoundaries = async () => {
      try {
        const response = await fetch(
          import.meta.env.VITE_BASE_URL + "api/db/geo/germany"
        );
        const jsonData = await response.json();

        setNewBoundaries(jsonData.geoJSONData);
      } catch (error) {
        console.log("Error:", error);
      }
    };

    fetchTrips();
    fetchStats();
    fetchClusters();
    fetchCargoOrders();
    fetchBoundaries();
  }, []); // Empty dependency array ensures this effect runs only once

  return null;
}
