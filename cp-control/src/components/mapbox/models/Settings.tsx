export interface Settings {
    mapMode: "items_cluster" | "bar_map" ;
    dataSource: string[];
    animateRoutes: boolean;
    applyFilter: boolean;
    startTimestamp: number
    endTimestamp: number
    showCluster: boolean
    eps: number
    minSamples: number
  }