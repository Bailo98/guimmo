"use client";
import { useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

interface Props {
  propertyId: string;
}

/** Inserts one row per (property_id, viewer) per 24h. Fully silent — no UI. */
export function PropertyViewTracker({ propertyId }: Props) {
  const { user } = useAuth();

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    // Build a simple dedup key stored in sessionStorage
    const key = `view_${propertyId}`;
    const last = sessionStorage.getItem(key);
    const now = Date.now();
    if (last && now - Number(last) < 24 * 60 * 60 * 1000) return; // already tracked today

    sessionStorage.setItem(key, String(now));

    // Fire-and-forget insert
    const db = supabase;
    db.from("property_views").insert({
      property_id: propertyId,
      viewer_id: user?.id ?? null,
      fingerprint: null,
    }).then(() => {
      // Also increment the denormalized views column on properties (best-effort; RPC may not exist)
      db.rpc("increment_property_views", { pid: propertyId }).then(() => {/* silent */});
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  return null;
}
