import React, { useContext, useState, ReactNode } from "react";
import { FeatureCollection, Polygon } from "geojson";

interface Stats {
  offerings?: {
    no_of_offerings?: number;
    occurrence_of_origins?: Record<string, { count?: number; zip_code?: string }>;
    occurrence_of_destinations?: Record<string, { count?: number; zip_code?: string }>;
    offering_relation?: Record<string, { origin?: string; destination?: string; count?: number }>;
  };
}

interface OfferingsContextProps {
  trips: any[]
  setNewTrips: (trips: any[]) => void;
  offerings: any[]; 
  setNewOfferings: (offerings: any[]) => void;
  clusters: any[];
  setNewClusters:(clusters: any[]) => void;
  stats: Stats;
  setNewStats: (stats: Stats) => void;
  boundaries: FeatureCollection<Polygon>;
  setNewBoundaries: (boundaries: FeatureCollection<Polygon>) => void;
}

const OfferingsContext = React.createContext<OfferingsContextProps | undefined>(undefined);

export function useOfferings(): OfferingsContextProps {
  const context = useContext(OfferingsContext);
  if (!context) {
    throw new Error("useOfferings must be used within an OfferingsProvider");
  }
  return context;
}

interface OfferingsProviderProps {
  children: ReactNode;
}

export function OfferingsProvider({ children }: OfferingsProviderProps) {
  const [trips, setTrips] = useState<any[]>([]);
  const [offerings, setOfferings] = useState<any[]>([]); 
  const [clusters, setClusters] = useState<any[]>([]); 
  const [stats, setStats] = useState<Stats>({});
  const [boundaries, setBoundaries] = useState<FeatureCollection<Polygon>>({
    type: "FeatureCollection",
    features: [],
  });

  function setNewTrips(newTrips: any[]) { 
    setTrips(newTrips);
  }

  function setNewOfferings(newOfferings: any[]) { 
    setOfferings(newOfferings);
  }

  function setNewClusters(newClusters: any[]) { 
    setClusters(newClusters);
  }

  function setNewStats(newStats: Stats) {
    setStats(newStats)
  }

  function setNewBoundaries(newBoundaries: FeatureCollection<Polygon>) {
    setBoundaries(newBoundaries)
  }

  const contextValue: OfferingsContextProps = {
    trips,
    setNewTrips,
    offerings,
    setNewOfferings,
    clusters,
    setNewClusters,
    stats,
    setNewStats,
    boundaries,
    setNewBoundaries
  };

  return (
    <OfferingsContext.Provider value={contextValue}>
      {children}
    </OfferingsContext.Provider>
  );
}
