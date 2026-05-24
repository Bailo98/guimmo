"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, Heart, User, Compass, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useState, useEffect, useRef } from "react";

export function BottomNav() {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>["channel"]> | null>(null);

  useEffect(() => {
    if (!user || !isSupabaseConfigured || !supabase) return;

    async function fetchUnread() {
      if (!user || !supabase) return;
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);
      setUnreadCount(count ?? 0);
    }

    fetchUnread();

    if (channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = supabase
      .channel(`unread_badge_${user.id}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "messages",
        filter: `receiver_id=eq.${user.id}`,
      }, () => fetchUnread())
      .subscribe();

    const interval = setInterval(fetchUnread, 30_000);
    return () => {
      clearInterval(interval);
      if (channelRef.current && supabase) supabase.removeChannel(channelRef.current);
    };
  }, [user]);

  if (pathname.startsWith("/admin") || pathname.startsWith("/auth")) return null;

  function isActive(href: string) {
    if (href === "/decouvrir") return pathname === "/decouvrir";
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const at = profile?.account_type ?? null;
  const canPublish = user && at && at !== "chercheur";

  // ── NavItem: shows label only when active ─────────────────────────────────
  function NavItem({
    href,
    icon: Icon,
    label,
    badge,
  }: {
    href: string;
    icon: React.ElementType;
    label: string;
    badge?: number;
  }) {
    const active = isActive(href);
    const GOLD = "var(--accent-gold, #C8A97E)";
    const MUTED = "var(--nav-text, rgba(255,255,255,0.50))";
    return (
      <Link
        href={href}
        className="flex flex-col items-center justify-center"
        style={{ gap: 2, minWidth: 44, height: 56, textDecoration: "none" }}
      >
        <div className="relative">
          <Icon
            style={{
              width: 22, height: 22,
              color: active ? GOLD : MUTED,
              transition: "color 0.2s ease",
            }}
          />
          {(badge ?? 0) > 0 && (
            <span
              className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 text-[8px] font-black rounded-full flex items-center justify-center"
              style={{ background: GOLD, color: "#0A1216" }}
            >
              {(badge ?? 0) > 9 ? "9+" : badge}
            </span>
          )}
        </div>
        {active && (
          <span style={{ fontSize: 10, fontWeight: 700, color: GOLD, lineHeight: 1 }}>
            {label}
          </span>
        )}
      </Link>
    );
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom,0px)]"
      style={{
        background: "var(--bg-card, rgba(22,27,38,0.97))",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderTop: "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
      }}
    >
      {/* ── Non-connecté : Découvrir | Annonces | Connexion ── */}
      {!user && (
        <div className="flex items-center justify-around h-16 px-4">
          <NavItem href="/decouvrir" icon={Compass} label="Découvrir" />
          <NavItem href="/annonces" icon={Home} label="Annonces" />
          <NavItem href="/connexion" icon={User} label="Connexion" />
        </div>
      )}

      {/* ── Connecté ── */}
      {user && (
        <div className="flex items-center justify-around h-16 px-2">
          {/* Découvrir */}
          <NavItem href="/decouvrir" icon={Compass} label="Découvrir" />

          {/* Favoris */}
          <NavItem href="/favoris" icon={Heart} label="Favoris" />

          {/* FAB Publier pour propriétaires/agents/agences/admins */}
          {canPublish ? (
            <Link href="/publier/rapide" className="flex flex-col items-center justify-center -mt-5">
              <span
                className="w-14 h-14 rounded-full flex items-center justify-center active:scale-95"
                style={{
                  background: "var(--accent-gold, #C8A97E)",
                  boxShadow: "0 4px 24px rgba(200,169,126,0.50)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                <Plus className="w-7 h-7" style={{ color: "#0A1216" }} strokeWidth={2.5} />
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, marginTop: 3, color: "var(--accent-gold, #C8A97E)" }}>
                Publier
              </span>
            </Link>
          ) : (
            /* Chercheur : Annonces à la place */
            <NavItem href="/annonces" icon={Home} label="Annonces" />
          )}

          {/* Messages (chercheurs seulement — badge non-lus) */}
          {at !== "agent" && at !== "agence" && (
            <NavItem href="/messages" icon={MessageSquare} label="Messages" badge={unreadCount} />
          )}

          {/* Profil */}
          <NavItem href="/compte" icon={User} label="Profil" />
        </div>
      )}
    </nav>
  );
}
