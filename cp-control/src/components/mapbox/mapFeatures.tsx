import mapboxgl, { Map as MapboxMap } from "mapbox-gl";
import { Settings } from "./MapboxMap";

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
    "offering_clusters",
    "offering_cluster_count",
    "unclustered_offering",
    "trip_clusters",
    "trip_cluster_count",
    "unclustered_trip",
  ];

  // Check if all layers exist on the map
  const allLayersSet = allLayers.every((layer) => map.getLayer(layer));
  if (allLayersSet) {
    const layersByMode = {
      offering: [
        "offering_clusters",
        "offering_cluster_count",
        "unclustered_offering",
      ],
      cluster: ["germany_overlay"],
      trip: ["trip_clusters", "trip_cluster_count", "unclustered_trip"],
      match: ["trip_clusters", "trip_cluster_count", "unclustered_trip"],
    };

    const visibleLayers = layersByMode[settings.mapMode] || [];

    if (
      settings.animateRoutes &&
      (settings.mapMode === "offering" || settings.mapMode === "trip")
    ) {
      visibleLayers.push("line-dashed");
    }

    allLayers.forEach((layer) => {
      map.setLayoutProperty(
        layer,
        "visibility",
        visibleLayers.includes(layer) ? "visible" : "none"
      );
    });

    if (visibleLayers.includes("line-dashed")) {
      map.moveLayer("line-dashed", visibleLayers[0]);
    }
    if (visibleLayers.includes(settings.mapMode + "_lines")) {
      map.moveLayer(settings.mapMode + "_lines", visibleLayers[0]);
    }
  } else {
    console.log("Not all layers are created!");
  }
}
