import React, { useContext, useState } from "react";

const OfferingsContext = React.createContext();

export function useOfferings() {
  const context = useContext(OfferingsContext);
  if (!context) {
    throw new Error("useOfferings must be used within an OfferingsProvider");
  }
  return context;
}

export function OfferingsProvider({ children }) {
  const [offerings, setOfferings] = useState([]);
  const [mapState, setMapState] = useState("empty");

  function setNewOfferings(newOfferings) {
    setOfferings(newOfferings);
  }

  function setNewMapState() {
    if (mapState == "empty") {
        setMapState("map");
    } else if (mapState == "map") {
        setMapState("empty")
    }
  }

  const contextValue = {
    offerings,
    setNewOfferings,
    mapState,
    setNewMapState,
  };

  return (
    <OfferingsContext.Provider value={contextValue}>
      {children}
    </OfferingsContext.Provider>
  );
}
