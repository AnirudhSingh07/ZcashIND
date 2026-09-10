import type { StyleSpecification } from "maplibre-gl";

/**
 * Self-contained MapLibre style that renders India from our own official
 * boundary GeoJSON (`/public/india-official.geojson`) instead of a foreign
 * tile provider. This guarantees India's correct, officially-recognised borders
 * — Jammu & Kashmir, Ladakh and Arunachal Pradesh included — with no disputed
 * lines drawn by an external basemap.
 */
export const INDIA_MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    india: {
      type: "geojson",
      data: "/india-official.geojson",
      attribution: "India boundaries (official)",
    },
  },
  layers: [
    // Ocean / outside-India backdrop.
    {
      id: "backdrop",
      type: "background",
      paint: { "background-color": "#e6edf3" },
    },
    // India landmass.
    {
      id: "india-land",
      type: "fill",
      source: "india",
      paint: { "fill-color": "#f5f2ea" },
    },
    // State + national boundaries (the outer edge is the official border).
    {
      id: "india-borders",
      type: "line",
      source: "india",
      paint: {
        "line-color": "rgba(110,96,70,0.28)",
        "line-width": 0.6,
      },
    },
  ],
};
