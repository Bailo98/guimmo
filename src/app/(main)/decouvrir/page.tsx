import { SwipeFeed } from "./SwipeFeed";
import { MaisonDuJour } from "@/components/MaisonDuJour";
import { createClient } from "@supabase/supabase-js";
import type { Property } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Découvrir — LogerBien",
  description: "Explorez les annonces immobilières à Conakry en mode swipe.",
};

async function fetchSwipeProperties(): Promise<Property[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const db = createClient(url, key);
    // Sort: featured first, then newest, then rest
    const { data } = await db
      .from("properties")
      .select("*, property_images(*)")
      .eq("status", "active")
      .order("is_featured", { ascending: false })
      .order("is_boosted", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);
    return (data ?? []) as Property[];
  } catch {
    return [];
  }
}

export default async function DecouvrirPage() {
  const properties = await fetchSwipeProperties();

  return (
    <div className="bg-[#0A1216] min-h-screen">
      {/* Maison du jour en haut */}
      <div className="pt-20">
        <MaisonDuJour />
      </div>

      {/* Feed swipe */}
      <SwipeFeed properties={properties} />
    </div>
  );
}
