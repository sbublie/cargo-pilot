import { useEffect } from "react";
import { useOfferings } from "../contexts/OfferingsContext";

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
