"use client";
import { useState, useEffect, useCallback } from "react";
import { Heart } from "lucide-react";
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
 * Fully decoupled from Zustand — Supabase is the single source of truth.
 * On mount we re-check the DB so the button reflects reality even if the
 * server-rendered `initialIsFav` was stale (different device / another tab).
 */
export function DetailFavoriteButton({ propertyId, initialIsFav }: Props) {
  const { user } = useAuth();
  const [isFav,         setIsFav]         = useState(initialIsFav);
  const [checked,       setChecked]       = useState(false); // true once Supabase replied
  const [showAuthModal, setShowAuthModal] = useState(false);

  // ── Re-check Supabase on mount (corrects stale server render or cache) ────
  useEffect(() => {
    if (!user) {
      setIsFav(false);
      setChecked(true);
      return;
    }
    if (!isSupabaseConfigured || !supabase) {
      setChecked(true);
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
        setIsFav(!!data);
        setChecked(true);
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, propertyId]);

  const handleClick = useCallback(async () => {
    if (!user) { setShowAuthModal(true); return; }
    if (!checked) return; // wait until we know the real state
    const next = !isFav;
    setIsFav(next); // optimistic
    toast(next ? "❤️ Ajouté aux favoris" : "Retiré des favoris", next ? "success" : "info");

    if (!isSupabaseConfigured || !supabase) return;
    try {
      if (next) {
        const { error } = await supabase
          .from("favorites")
          .upsert(
            { user_id: user.id, property_id: propertyId },
            { onConflict: "user_id,property_id", ignoreDuplicates: true },
          );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("property_id", propertyId);
        if (error) throw error;
      }
    } catch {
      setIsFav(!next); // rollback
    }
  }, [user, isFav, checked, propertyId]);

  return (
    <>
      <button
        onClick={handleClick}
        disabled={!checked}
        aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
        style={{
          width: 44, height: 44,
          background: isFav ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.08)",
          border: isFav ? "1.5px solid rgba(239,68,68,0.50)" : "1.5px solid rgba(255,255,255,0.15)",
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: checked ? "pointer" : "default",
          color: isFav ? "#ef4444" : "rgba(255,255,255,0.70)",
          backdropFilter: "blur(6px)",
          transition: "background 0.2s, border-color 0.2s, transform 0.15s",
          flexShrink: 0,
          opacity: checked ? 1 : 0.5,
        }}
        onMouseEnter={(e) => {
          if (checked) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "";
        }}
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
