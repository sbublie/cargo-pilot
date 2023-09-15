import { useEffect } from "react";
import { useOfferings } from "../contexts/OfferingsContext";

export function ApiHandler() {
  const { setNewOfferings, setNewStats, setNewBoundaries } = useOfferings();

  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        const response = await fetch(
          import.meta.env.VITE_BASE_URL + "api/db/offerings"
        );
        const jsonData = await response.json();
        setNewOfferings(jsonData);
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
    }

    fetchStats();
    fetchOfferings();
    fetchBoundaries();
  }, []); // Empty dependency array ensures this effect runs only once

  return null;
}
