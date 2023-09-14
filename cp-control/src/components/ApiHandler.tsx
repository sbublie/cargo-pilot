import { useEffect } from "react";
import { useOfferings } from "../contexts/OfferingsContext";

export function ApiHandler() {
  const { setNewOfferings, setNewStats } = useOfferings();

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

    fetchStats();
    fetchOfferings(); // Trigger the fetching process when the component mounts
  }, []); // Empty dependency array ensures this effect runs only once

  return null;
}
