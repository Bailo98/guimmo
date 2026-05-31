"use client";
import { useState, useEffect } from "react";

export interface UserLocation {
  lat: number;
  lng: number;
}

const SESSION_KEY = "lb_user_location";

/** Requests geolocation once and caches it in sessionStorage for the session. */
export function useUserLocation(): UserLocation | null {
  const [location, setLocation] = useState<UserLocation | null>(null);

  useEffect(() => {
    // Try sessionStorage first (avoids repeated permission prompts)
    try {
      const cached = sessionStorage.getItem(SESSION_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as UserLocation;
        setLocation(parsed);
        return;
      }
    } catch { /* silent */ }

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: UserLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setLocation(loc);
        try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(loc)); } catch { /* silent */ }
      },
      () => { /* denied or unavailable — stay null */ },
      { timeout: 6000, maximumAge: 300_000 }
    );
  }, []);

  return location;
}

/**
 * Calculates approximate travel time from user to a point.
 * Uses haversine distance and 30 km/h average speed (Conakry traffic).
 * Returns "X min" string or null if no data.
 */
export function travelTimeStr(
  userLoc: UserLocation | null,
  targetLat: number | null | undefined,
  targetLng: number | null | undefined
): string | null {
  if (!userLoc || !targetLat || !targetLng) return null;
  const R = 6371;
  const dLat = ((targetLat - userLoc.lat) * Math.PI) / 180;
  const dLng = ((targetLng - userLoc.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((userLoc.lat * Math.PI) / 180) *
      Math.cos((targetLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const minutes = Math.round((km / 30) * 60);
  if (minutes < 1) return "< 1 min";
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }
  return `${minutes} min`;
}
