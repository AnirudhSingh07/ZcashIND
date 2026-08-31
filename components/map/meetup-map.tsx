"use client";

import { useEffect, useRef } from "react";
import maplibregl, { Map as MLMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { PublicMeetup } from "@/lib/data";
import { site } from "@/config/site";
import { isPast, padNode } from "@/lib/utils";

export type MapMeetup = Pick<
  PublicMeetup,
  | "id"
  | "slug"
  | "kind"
  | "title"
  | "city"
  | "lat"
  | "lng"
  | "nodeNumber"
  | "attendeesTotal"
  | "attendeesNewToZcash"
  | "hostNamePublic"
  | "newCityActivation"
  | "startsAt"
  | "photos"
  | "isOnline"
>;

function markerEl(m: MapMeetup): HTMLDivElement {
  const el = document.createElement("div");
  const official = m.kind === "official_event";
  const past = isPast(m.startsAt);
  const newCity = m.newCityActivation;

  // Gold = verified IRL upcoming, muted = past, distinct = official, spark = new city
  const color = official
    ? "#CF8A00"
    : past
      ? "#2D2A26"
      : "#F4B728";
  const border = past ? "#D9D8D6" : "#0B0B0C";
  const glyph = official ? "★" : newCity ? "✦" : "";

  el.style.cssText = `
    width: 22px; height: 22px; border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    background: ${color};
    border: 2px solid ${border};
    box-shadow: 0 2px 6px rgba(0,0,0,0.5);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
  `;
  if (glyph) {
    const inner = document.createElement("span");
    inner.textContent = glyph;
    inner.style.cssText =
      "transform: rotate(45deg); font-size: 11px; color:#0B0B0C; font-weight:700; line-height:1;";
    el.appendChild(inner);
  }
  if (newCity) {
    el.style.boxShadow = "0 0 0 4px rgba(61,220,132,0.35), 0 2px 6px rgba(0,0,0,0.5)";
  }
  return el;
}

function popupHtml(m: MapMeetup): string {
  const official = m.kind === "official_event";
  const label = official
    ? m.title
    : `${m.city} — Zcash IRL Node #${padNode(m.nodeNumber)}`;
  const photo = m.photos?.[0];
  const cityHref = `/map/${m.city.toLowerCase().replace(/\s+/g, "-")}`;
  return `
    <div style="width:240px">
      ${
        photo
          ? `<img src="${photo}" alt="" style="width:100%;height:120px;object-fit:cover;border-radius:16px 16px 0 0;display:block" />`
          : ""
      }
      <div style="padding:12px 14px">
        <div style="font-weight:600;font-size:14px;margin-bottom:6px;color:#F5F2EA">${label}</div>
        <div style="font-size:13px;color:#D9D8D6;line-height:1.5">
          👥 ${m.attendeesTotal} attendees<br/>
          🌱 ${m.attendeesNewToZcash} new to Zcash
          ${m.hostNamePublic ? `<br/>🟢 Hosted by ${m.hostNamePublic}` : ""}
        </div>
        <a href="${cityHref}" style="display:inline-block;margin-top:10px;color:#F4B728;font-size:13px;font-weight:600;text-decoration:none">View ${m.city} →</a>
      </div>
    </div>`;
}

export function MeetupMap({
  meetups,
  interactive = true,
  className = "",
}: {
  meetups: MapMeetup[];
  interactive?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: ref.current,
      style: site.map.styleUrl,
      bounds: site.map.bounds,
      fitBoundsOptions: { padding: 40 },
      interactive,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    if (interactive) {
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    }

    const markers: Marker[] = [];
    map.on("load", () => {
      for (const m of meetups) {
        if (m.lat == null || m.lng == null) continue;
        const marker = new maplibregl.Marker({ element: markerEl(m) })
          .setLngLat([m.lng, m.lat])
          .setPopup(
            new maplibregl.Popup({ offset: 18, closeButton: true }).setHTML(
              popupHtml(m),
            ),
          )
          .addTo(map);
        markers.push(marker);
      }
    });

    return () => {
      markers.forEach((mk) => mk.remove());
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{ width: "100%", height: "100%" }}
      role="application"
      aria-label="Map of Zcash India meetups"
    />
  );
}
