import mapboxgl, { Map as MapboxMap } from "mapbox-gl";
import { Settings } from "./models/Settings";

export function addCustomImageToMap(map: MapboxMap) {
  map.loadImage(
    "https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png",
    (error?: Error, image?: HTMLImageElement | ImageBitmap) => {
      if (error) throw error;
      if (image) {
        map.addImage("custom-marker", image);
      }
    }
  );
}

export function addControlsToMap(map: MapboxMap) {
  map.addControl(new mapboxgl.NavigationControl(), "top-left");
}

export function setVisibleMapLayers(map: MapboxMap, settings: Settings) {
  const allLayers = [
    "germany_overlay",
    "transport_items_markers",
    "cluster",
    "cluster_count"
  ];

  // Check if all layers exist on the map
  const allLayersSet = allLayers.every((layer) => map.getLayer(layer));
  
  if (allLayersSet) {
    const layersByMode = {
      items_cluster: [
        "transport_items_markers", "cluster", "cluster_count",
      ],
      bar_map: ["germany_overlay"],
    };

    const visibleLayers = layersByMode[settings.mapMode] || [];

    allLayers.forEach((layer) => {
      map.setLayoutProperty(
        layer,
        "visibility",
        visibleLayers.includes(layer) ? "visible" : "none"
      );
    });

  } else {
    console.log("Not all layers are created!");
  }
}
