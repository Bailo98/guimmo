"use client";
import { useState, useEffect, useCallback } from "react";
import { Heart } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/lib/toast";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { AuthPromptModal } from "@/components/AuthPromptModal";

interface Props {
  propertyId: string;
  initialIsFav: boolean;
}

/**
 * Favorite button for the property detail page.
 *
 * Unlike PropertyCard (which reads only from the Zustand store), this component
 * re-checks the real Supabase state on mount so it reflects any change made on
 * other pages (/favoris, other devices) since the store was last synced.
 */
export function DetailFavoriteButton({ propertyId, initialIsFav }: Props) {
  const { user }                          = useAuth();
  const { toggleFavorite, isFavorite,
          _hasHydrated }                  = useAppStore();
  const [isFav,         setIsFav]         = useState(initialIsFav);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // ── Re-check Supabase on mount to correct any stale server/store state ────
  useEffect(() => {
    if (!user || !isSupabaseConfigured || !supabase) {
      // Not logged-in: rely on initialIsFav (always false from server for anon)
      setIsFav(false);
      return;
    }
    let cancelled = false;
    supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("property_id", propertyId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const actual = !!data;
        setIsFav(actual);
        // Sync the Zustand store if it disagrees with Supabase truth
        const storeHas = _hasHydrated && isFavorite(propertyId);
        if (actual !== storeHas) {
          toggleFavorite(propertyId); // flip store to match DB
        }
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, propertyId]);

  const handleClick = useCallback(async () => {
    if (!user) { setShowAuthModal(true); return; }
    const next = !isFav;
    setIsFav(next);
    toggleFavorite(propertyId); // optimistic local update
    toast(next ? "❤️ Ajouté aux favoris" : "Retiré des favoris", next ? "success" : "info");

    if (!isSupabaseConfigured || !supabase) return;
    try {
      if (next) {
        await supabase
          .from("favorites")
          .upsert({ user_id: user.id, property_id: propertyId },
                  { onConflict: "user_id,property_id", ignoreDuplicates: true });
      } else {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("property_id", propertyId);
      }
    } catch {
      // Rollback optimistic update on failure
      setIsFav(!next);
      toggleFavorite(propertyId);
    }
  }, [user, isFav, propertyId, toggleFavorite]);

  return (
    <>
      <button
        onClick={handleClick}
        aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
        style={{
          width: 44, height: 44,
          background: isFav ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.08)",
          border: isFav ? "1.5px solid rgba(239,68,68,0.50)" : "1.5px solid rgba(255,255,255,0.15)",
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          color: isFav ? "#ef4444" : "rgba(255,255,255,0.70)",
          backdropFilter: "blur(6px)",
          transition: "background 0.2s, border-color 0.2s, transform 0.15s",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.1)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
      >
        <Heart
          style={{
            width: 20, height: 20,
            fill: isFav ? "#ef4444" : "none",
            stroke: "currentColor",
            strokeWidth: isFav ? 0 : 1.8,
            transition: "fill 0.2s",
          }}
        />
      </button>

      {showAuthModal && (
        <AuthPromptModal
          onClose={() => setShowAuthModal(false)}
          redirectUrl={`/annonces/${propertyId}`}
          action="sauvegarder cette annonce"
        />
      )}
    </>
  );
}
