export interface Settings {
  mapMode: "items_cluster" | "bar_map";
  dataSource: string[];
  animateRoutes: boolean;
  applyFilter: boolean;
  startTimestamp: number;
  endTimestamp: number;
  showCluster: boolean;
  eps: number;
  minSamples: number;
}

export const defaultSettings:Settings = {
  mapMode: "items_cluster",
  dataSource: [],
  animateRoutes: false,
  applyFilter: false,
  startTimestamp: 1672614000,
  endTimestamp: 1672700399,
  showCluster: false,
  eps: 0.5,
  minSamples: 5,
};
