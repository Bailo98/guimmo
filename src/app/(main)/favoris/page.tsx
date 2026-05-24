"use client";
import { useState, useEffect, useCallback } from "react";
import { Heart, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { PropertyCard } from "@/components/ui/PropertyCard";
import type { Property } from "@/types";


export default function FavorisPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect non-logged users
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/connexion?redirect=/favoris");
    }
  }, [authLoading, user, router]);

  const fetchFavorites = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data } = await supabase
      .from("favorites")
      .select("property_id, properties(*, property_images(*))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const props = data.map((row: any) => row.properties as Property).filter(Boolean);
      setProperties(props);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) fetchFavorites();
  }, [authLoading, fetchFavorites]);

  async function removeFavorite(propertyId: string) {
    if (isSupabaseConfigured && supabase && user) {
      await supabase.from("favorites").delete()
        .eq("user_id", user.id)
        .eq("property_id", propertyId);
    }
    setProperties((p) => p.filter((x) => x.id !== propertyId));
  }

  if (authLoading || loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-black" style={{ color: "var(--LogerBien-cream)" }}>Mes favoris</h1>
        <p className="text-sm mt-1" style={{ color: "var(--LogerBien-cream-dim)" }}>
          {properties.length} annonce{properties.length !== 1 ? "s" : ""} sauvegardée{properties.length !== 1 ? "s" : ""}
        </p>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-24">
          <Heart className="w-16 h-16 mx-auto mb-4" style={{ color: "rgba(255,255,255,0.08)" }} />
          <h3 className="text-xl font-bold mb-2" style={{ color: "var(--LogerBien-cream)" }}>Aucun favori</h3>
          <p className="text-sm mb-6" style={{ color: "var(--LogerBien-cream-dim)" }}>
            Appuyez sur le cœur d&apos;une annonce pour la sauvegarder ici
          </p>
          <Link
            href="/annonces"
            className="inline-block font-semibold px-6 py-3 rounded-xl transition-colors hover:opacity-90"
            style={{ background: "var(--LogerBien-amber)", color: "#fff" }}
          >
            Parcourir les annonces
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p, i) => (
            <div key={p.id} className="relative group">
              <PropertyCard property={p} index={i} />
              <button
                onClick={() => removeFavorite(p.id)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "rgba(239,68,68,0.85)" }}
                aria-label="Retirer des favoris"
              >
                <Heart className="w-4 h-4 text-white fill-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
