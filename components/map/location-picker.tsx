"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MLMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { site } from "@/config/site";
import { INDIA_MAP_STYLE } from "@/lib/map-style";

/**
 * Click-the-map location picker. Sets hidden lat/lng inputs.
 * Degrades gracefully — if the basemap fails to load the user can still
 * type a city (handled by the parent form). "Use my location" uses the
 * browser geolocation API; no geocoding key required.
 */
export function LocationPicker({
  name = "coords",
}: {
  name?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [status, setStatus] = useState<string>("");

  function place(lng: number, lat: number, fly = false) {
    const map = mapRef.current;
    if (!map) return;
    if (!markerRef.current) {
      const el = document.createElement("div");
      el.style.cssText =
        "width:20px;height:20px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#F4B728;border:2px solid #ffffff;box-shadow:0 2px 6px rgba(25,21,16,0.25)";
      markerRef.current = new maplibregl.Marker({
        element: el,
        draggable: true,
      })
        .setLngLat([lng, lat])
        .addTo(map);
      markerRef.current.on("dragend", () => {
        const p = markerRef.current!.getLngLat();
        setCoords({ lat: +p.lat.toFixed(6), lng: +p.lng.toFixed(6) });
      });
    } else {
      markerRef.current.setLngLat([lng, lat]);
    }
    if (fly) map.flyTo({ center: [lng, lat], zoom: 11 });
    setCoords({ lat: +lat.toFixed(6), lng: +lng.toFixed(6) });
  }

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: ref.current,
      style: INDIA_MAP_STYLE,
      bounds: site.map.bounds,
      fitBoundsOptions: { padding: 30 },
    });
    mapRef.current = map;
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );
    map.on("click", (e) => place(e.lngLat.lng, e.lngLat.lat));
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setStatus("Geolocation not available — tap the map instead.");
      return;
    }
    setStatus("Locating…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        place(pos.coords.longitude, pos.coords.latitude, true);
        setStatus("");
      },
      () => setStatus("Couldn't get location — tap the map instead."),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={useMyLocation}
          className="btn-ghost px-4 py-1.5 text-sm"
        >
          📍 Use my location
        </button>
        <span className="text-sm text-muted">
          {coords
            ? `Pin set: ${coords.lat}, ${coords.lng}`
            : "Tap the map to drop a pin"}
        </span>
      </div>
      {status && <p className="mb-2 text-sm text-danger">{status}</p>}
      <div
        ref={ref}
        className="h-72 w-full overflow-hidden rounded-2xl border border-line"
      />
      <input type="hidden" name="lat" value={coords?.lat ?? ""} readOnly />
      <input type="hidden" name="lng" value={coords?.lng ?? ""} readOnly />
      <p className="mt-2 text-xs text-muted/60">
        No exact address needed. A rough pin on your neighbourhood is fine.
      </p>
    </div>
  );
}
