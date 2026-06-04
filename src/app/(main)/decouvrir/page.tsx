import { SwipeFeed } from "./SwipeFeed";
import { MaisonDuJour } from "@/components/MaisonDuJour";
import { createClient } from "@supabase/supabase-js";
import { isPubliclyAvailable } from "@/lib/property-signals";
import type { Property } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Découvrir des biens | LogerBien",
  description:
    "Explorez les biens immobiliers à Conakry en mode swipe. Simple, rapide, addictif.",
};

async function fetchSwipeProperties(): Promise<Property[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const db = createClient(url, key);
    // NOTE: n'utilise pas is_featured/is_diaspora dans l'ORDER BY car
    // la migration 015 peut ne pas encore être appliquée en Supabase.
    // Le tri avancé est fait côté client dans SwipeFeed.
    const { data, error } = await db
      .from("properties")
      .select("*, property_images(*)")
      .eq("status", "active")
      .order("is_boosted", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) {
      // Fallback sans is_boosted si la colonne pose problème
      const { data: fallback } = await db
        .from("properties")
        .select("*, property_images(*)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(60);
      return ((fallback ?? []) as Property[]).filter(isPubliclyAvailable);
    }
    return ((data ?? []) as Property[]).filter(isPubliclyAvailable);
  } catch {
    return [];
  }
}

export default async function DecouvrirPage() {
  const properties = await fetchSwipeProperties();

  return (
    <div className="bg-[var(--bg-primary)] min-h-screen">
      {/* Maison du jour en haut */}
      <div className="pt-20">
        <MaisonDuJour />
      </div>

      {/* Feed swipe */}
      <SwipeFeed properties={properties} />
    </div>
  );
}
