import React, { useEffect } from "react";
import { useOfferings } from "../contexts/OfferingsContext";

export function ApiHandler() {
  const { setNewOfferings } = useOfferings();

  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        const response = await fetch("http://localhost/api/db/offerings");
        const jsonData = await response.json();
        setNewOfferings(jsonData);
      } catch (error) {
        console.log("Error:", error);
      }
    };

    fetchOfferings(); // Trigger the fetching process when the component mounts
  }, []); // Empty dependency array ensures this effect runs only once

  return null; // You can return null or any other appropriate content
}
