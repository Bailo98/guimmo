"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, MessageSquare, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useState, useEffect, useRef } from "react";

const LEFT_NAV = [
  { href: "/", icon: Home, label: "Accueil" },
  { href: "/annonces", icon: Search, label: "Explorer" },
];

const RIGHT_NAV = [
  { href: "/favoris", icon: Heart, label: "Favoris" },
  { href: "/messages", icon: MessageSquare, label: "Messages", showMsgBadge: true },
];

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

    // Realtime: update badge instantly when a new message or read-update arrives
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = supabase
      .channel(`unread_badge_${user.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "messages",
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
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  function NavItem({ href, icon: Icon, label, showMsgBadge }: {
    href: string; icon: React.ElementType; label: string; showMsgBadge?: boolean;
  }) {
    const active = isActive(href);
    const hasBadge = showMsgBadge && unreadCount > 0;
    return (
      <Link href={href} className="flex flex-col items-center justify-center gap-0.5 w-14 h-14">
        <div className="relative">
          <Icon
            className="w-[22px] h-[22px]"
            style={{ color: active ? "#E9E900" : "var(--nav-text)" }}
          />
          {hasBadge && (
            <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 bg-[#E9E900] text-[#0A1216] text-[8px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-semibold" style={{ color: active ? "#E9E900" : "var(--nav-text)" }}>
          {label}
        </span>
      </Link>
    );
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom,0px)]"
      style={{ background: "var(--nav-bg)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderTop: "1px solid var(--nav-border)" }}
    >
      {/* ── Non-connecté : Accueil + Explorer + Connexion ── */}
      {!user && (
        <div className="flex items-center justify-around h-16 px-4">
          <NavItem href="/" icon={Home} label="Accueil" />
          <NavItem href="/annonces" icon={Search} label="Explorer" />
          <Link href="/connexion" className="flex flex-col items-center justify-center gap-0.5 w-14 h-14">
            <User className="w-[22px] h-[22px]" style={{ color: "var(--nav-text)" }} />
            <span className="text-[10px] font-semibold" style={{ color: "var(--nav-text)" }}>Connexion</span>
          </Link>
        </div>
      )}

      {/* ── Connecté : nav complète ── */}
      {user && (
        <div className="flex items-center justify-around h-16 px-2">
          {LEFT_NAV.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}

          {/* FAB — Publication rapide */}
          <Link href="/publier/rapide" className="flex flex-col items-center justify-center -mt-6">
            <span className="w-14 h-14 rounded-full flex items-center justify-center active:scale-95 transition-transform" style={{ background: "#E9E900", border: "1px solid rgba(233,233,0,0.50)", boxShadow: "0 4px 20px rgba(233,233,0,0.40)" }}>
              <Plus className="w-7 h-7" style={{ color: "#0A1216" }} strokeWidth={2.5} />
            </span>
            <span className="text-[9px] font-bold mt-1" style={{ color: "#E9E900" }}>Publier</span>
          </Link>

          {RIGHT_NAV.filter((item) => {
            if (item.href === "/messages") {
              const at = profile?.account_type;
              return at !== "agent" && at !== "agence";
            }
            return true;
          }).map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>
      )}
    </nav>
  );
}
