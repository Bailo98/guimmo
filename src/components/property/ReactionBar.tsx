"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

const REACTIONS = [
  { key: "love",      emoji: "❤️",  label: "J'adore"     },
  { key: "fire",      emoji: "🔥",  label: "Intéressant" },
  { key: "eyes",      emoji: "👀",  label: "À voir"      },
  { key: "expensive", emoji: "💰",  label: "Trop cher"   },
] as const;

type ReactionKey = (typeof REACTIONS)[number]["key"];

interface ReactionBarProps {
  propertyId: string;
  /** compact=true → smaller buttons, no labels (for use on PropertyCards) */
  compact?: boolean;
}

export function ReactionBar({ propertyId, compact = false }: ReactionBarProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [counts, setCounts] = useState<Record<ReactionKey, number>>({
    love: 0, fire: 0, eyes: 0, expensive: 0,
  });
  const [userReaction, setUserReaction] = useState<ReactionKey | null>(null);
  const [animating, setAnimating] = useState<ReactionKey | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Fetch reaction counts + user's own reaction
  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    const { data } = await supabase
      .from("reactions")
      .select("reaction, user_id")
      .eq("property_id", propertyId);

    if (!data) return;

    const newCounts: Record<ReactionKey, number> = { love: 0, fire: 0, eyes: 0, expensive: 0 };
    let mine: ReactionKey | null = null;
    for (const row of data) {
      newCounts[row.reaction as ReactionKey] = (newCounts[row.reaction as ReactionKey] ?? 0) + 1;
      if (user && row.user_id === user.id) mine = row.reaction as ReactionKey;
    }
    setCounts(newCounts);
    setUserReaction(mine);
    setLoaded(true);
  }, [propertyId, user]);

  useEffect(() => { load(); }, [load]);

  async function handleReaction(key: ReactionKey) {
    if (!user) {
      router.push(`/connexion?redirect=/annonces/${propertyId}`);
      return;
    }
    if (!isSupabaseConfigured || !supabase) return;

    // Animate
    setAnimating(key);
    setTimeout(() => setAnimating(null), 400);

    if (userReaction === key) {
      // Toggle OFF — delete
      setUserReaction(null);
      setCounts((prev) => ({ ...prev, [key]: Math.max(0, prev[key] - 1) }));
      await supabase
        .from("reactions")
        .delete()
        .eq("property_id", propertyId)
        .eq("user_id", user.id)
        .eq("reaction", key);
    } else {
      // Toggle ON (and remove old if any)
      const prev = userReaction;
      setUserReaction(key);
      setCounts((c) => ({
        ...c,
        ...(prev ? { [prev]: Math.max(0, c[prev] - 1) } : {}),
        [key]: c[key] + 1,
      }));
      if (prev) {
        await supabase
          .from("reactions")
          .delete()
          .eq("property_id", propertyId)
          .eq("user_id", user.id)
          .eq("reaction", prev);
      }
      await supabase.from("reactions").insert({
        property_id: propertyId,
        user_id: user.id,
        reaction: key,
      });
    }
  }

  if (!loaded && !isSupabaseConfigured) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: compact ? 6 : 10,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      {REACTIONS.map(({ key, emoji, label }) => {
        const isActive = userReaction === key;
        const count = counts[key] ?? 0;
        const isAnim = animating === key;
        return (
          <button
            key={key}
            onClick={() => handleReaction(key)}
            title={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: compact ? 4 : 6,
              padding: compact ? "4px 10px" : "7px 14px",
              borderRadius: 999,
              border: isActive
                ? "1.5px solid rgba(200,169,126,0.70)"
                : "1.5px solid rgba(255,255,255,0.10)",
              background: isActive
                ? "rgba(212,175,55,0.15)"
                : "rgba(255,255,255,0.05)",
              cursor: "pointer",
              fontSize: compact ? 14 : 16,
              fontWeight: 600,
              color: isActive ? "var(--accent-gold)" : "rgba(255,255,255,0.65)",
              transform: isAnim ? "scale(1.4)" : "scale(1)",
              transition: "transform 0.15s ease, background 0.2s ease, border-color 0.2s ease",
              minHeight: "auto",
              letterSpacing: 0,
              textTransform: "none",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ lineHeight: 1 }}>{emoji}</span>
            {count > 0 && (
              <span style={{ fontSize: compact ? 11 : 13, lineHeight: 1 }}>
                {count}
              </span>
            )}
            {!compact && (
              <span style={{ fontSize: 12, opacity: 0.7, fontWeight: 500 }}>
                {label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
