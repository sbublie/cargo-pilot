import React, { useContext, useState, ReactNode } from "react";

interface Stats {
  offerings?: {
    no_of_offerings?: number;
    occurrence_of_origins?: Record<string, { count?: number; zip_code?: string }>;
    occurrence_of_destinations?: Record<string, { count?: number; zip_code?: string }>;
    offering_relation?: Record<string, { origin?: string; destination?: string; count?: number }>;
  };
}

interface OfferingsContextProps {
  offerings: any[]; // Replace any with the correct type if known
  setNewOfferings: (offerings: any[]) => void; // Replace any with the correct type if known
  stats: Stats;
  setNewStats: (stats: Stats) => void;
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
  const [offerings, setOfferings] = useState<any[]>([]); // Replace any with the correct type if known
  const [stats, setStats] = useState<Stats>({});

  function setNewOfferings(newOfferings: any[]) { // Replace any with the correct type if known
    setOfferings(newOfferings);
  }

  function setNewStats(newStats: Stats) {
    setStats(newStats)
  }

  const contextValue: OfferingsContextProps = {
    offerings,
    setNewOfferings,
    stats,
    setNewStats,
  };

  return (
    <OfferingsContext.Provider value={contextValue}>
      {children}
    </OfferingsContext.Provider>
  );
}
