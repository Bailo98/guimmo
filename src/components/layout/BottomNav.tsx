"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, Plus, MessageSquare, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const GOLD    = "var(--accent-gold)";
const MUTED   = "var(--text-tertiary)";
const GOLD_BG = "rgba(200,151,58,0.15)";

const NAV_PILL_STYLE: React.CSSProperties = {
  position: "fixed",
  bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 50,
  height: 64,
  borderRadius: 35,
  background: "var(--bg-card)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid var(--border-subtle)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
  padding: "8px 20px",
  display: "flex",
  alignItems: "center",
  gap: 4,
};

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}

function NavItem({ href, icon: Icon, label, active }: NavItemProps) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        padding: "6px 16px",
        borderRadius: 24,
        textDecoration: "none",
        background: active ? GOLD_BG : "transparent",
        transition: "all 0.2s ease",
        minHeight: "auto",
        flexShrink: 0,
      }}
    >
      <Icon
        style={{
          width: 22,
          height: 22,
          color: active ? GOLD : MUTED,
          strokeWidth: active ? 2.2 : 1.8,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: active ? GOLD : MUTED,
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Hidden on /decouvrir, /admin and /auth routes
  if (pathname === "/decouvrir") return null;
  if (pathname.startsWith("/admin") || pathname.startsWith("/auth")) return null;

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  // ── Non connecté : 2 items ─────────────────────────────────────────────────
  if (!user) {
    return (
      <nav className="md:hidden" style={NAV_PILL_STYLE}>
        <NavItem href="/"          icon={Home} label="Accueil" active={isActive("/")} />
        <NavItem href="/connexion" icon={User} label="Profil"  active={false}         />
      </nav>
    );
  }

  // ── Connecté : 5 items avec bouton central surélevé ───────────────────────
  return (
    <nav className="md:hidden" style={NAV_PILL_STYLE}>
      <NavItem href="/"        icon={Home}         label="Accueil"  active={isActive("/")}         />
      <NavItem href="/favoris" icon={Heart}         label="Favoris"  active={isActive("/favoris")}  />

      {/* Bouton central ➕ surélevé */}
      <Link
        href="/publier"
        aria-label="Publier une annonce"
        style={{
          width: 54,
          height: 54,
          borderRadius: "50%",
          background: "var(--accent-gold)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: -20,
          boxShadow: "0 4px 16px rgba(200,151,58,0.5)",
          flexShrink: 0,
          textDecoration: "none",
          transition: "transform 0.2s, opacity 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.08)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.transform = "";
        }}
      >
        <Plus style={{ width: 24, height: 24, color: "#fff", strokeWidth: 2.5 }} />
      </Link>

      <NavItem href="/messages" icon={MessageSquare} label="Messages" active={isActive("/messages")} />
      <NavItem href="/compte"   icon={User}           label="Profil"   active={isActive("/compte")}   />
    </nav>
  );
}
