"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, FileText, Users, LogOut, Flag, UserCheck,
  Upload, Plus, Menu, X, Shield,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Avatar } from "@/components/ui/Avatar";

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG_SIDEBAR  = "var(--bg-primary)";
const BORDER      = "var(--border)";
const TEXT_PRI    = "var(--text-primary)";
const TEXT_SEC    = "var(--text-primary-dim)";
const ACCENT      = "var(--accent-gold)";

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: "/admin",                   label: "Dashboard",           icon: LayoutDashboard },
  { href: "/admin/annonces",          label: "Annonces",            icon: FileText },
  { href: "/admin/annonces/nouvelle", label: "Ajouter",             icon: Plus },
  { href: "/admin/moderation",        label: "Modération",          icon: Shield,     badgeKey: "moderation" as const },
  { href: "/admin/verifications",     label: "Vérifications",       icon: UserCheck },
  { href: "/admin/demandes-logement",  label: "Demandes logement",   icon: FileText },
  { href: "/admin/utilisateurs",      label: "Utilisateurs",        icon: Users },
  { href: "/admin/signalements",      label: "Signalements",        icon: Flag,       badgeKey: "reports" as const },
  { href: "/admin/agents",            label: "Agents",              icon: UserCheck },
  { href: "/admin/import",            label: "Import CSV",          icon: Upload },
] as const;

// ─── Logo ─────────────────────────────────────────────────────────────────────
function AdminLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, background: ACCENT,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9,22 9,12 15,12 15,22" />
        </svg>
      </div>
      <div>
        <p style={{ color: TEXT_PRI, fontWeight: 700, fontSize: 16, fontFamily: "var(--font-display), sans-serif", lineHeight: 1.2, letterSpacing: "-0.3px" }}>
          LogerBien
        </p>
        <p style={{ color: TEXT_SEC, fontSize: 11, lineHeight: 1 }}>Administration</p>
      </div>
    </div>
  );
}

// ─── NavLink ──────────────────────────────────────────────────────────────────
function NavLink({
  href, label, icon: Icon, badge, isActive, onClick,
}: {
  href: string; label: string; icon: React.ElementType;
  badge?: number; isActive: boolean; onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "11px 14px",
        borderRadius: 14,
        border: `1px solid ${isActive ? "rgba(191,141,38,0.35)" : "transparent"}`,
        background: isActive ? "rgba(191,141,38,0.16)" : "transparent",
        color: isActive ? ACCENT : TEXT_SEC,
        fontSize: 14, fontWeight: isActive ? 850 : 650,
        textDecoration: "none",
        transition: "background 0.15s, color 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLAnchorElement).style.background = "rgba(191,141,38,0.08)";
          (e.currentTarget as HTMLAnchorElement).style.color = TEXT_PRI;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
          (e.currentTarget as HTMLAnchorElement).style.color = TEXT_SEC;
        }
      }}
    >
      <Icon size={18} />
      <span style={{ flex: 1 }}>{label}</span>
      {badge != null && badge > 0 && (
        <span style={{
          background: "#ef4444", color: "white", fontSize: 10, fontWeight: 700,
          borderRadius: 999, minWidth: 18, height: 18,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px",
        }}>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

// ─── SidebarContent ───────────────────────────────────────────────────────────
function SidebarContent({
  pathname, pendingReports, pendingMod, user, profile, onSignOut, onNavClick,
}: {
  pathname: string;
  pendingReports: number;
  pendingMod: number;
  user: { email?: string } | null;
  profile: { full_name?: string | null; role?: string; avatar_url?: string | null } | null;
  onSignOut: () => void;
  onNavClick?: () => void;
}) {
  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo */}
      <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${BORDER}` }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <AdminLogo />
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "14px 10px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 5 }}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            isActive={isActive(item.href)}
            badge={
              "badgeKey" in item
                ? item.badgeKey === "moderation" ? pendingMod
                : item.badgeKey === "reports"    ? pendingReports
                : undefined
              : undefined
            }
            onClick={onNavClick}
          />
        ))}
      </nav>

      {/* Bottom: user + logout */}
      <div style={{ padding: "12px 10px", borderTop: `1px solid ${BORDER}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", marginBottom: 4 }}>
          <Avatar url={profile?.avatar_url} name={profile?.full_name ?? user?.email ?? "Admin"} size="sm" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: TEXT_PRI, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {profile?.full_name ?? "Admin"}
            </p>
            <p style={{ color: TEXT_SEC, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.email ?? ""}
            </p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 12, border: "none", background: "transparent",
            color: TEXT_SEC, fontSize: 13, fontWeight: 750, cursor: "pointer",
            transition: "color 0.15s, background 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.10)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = TEXT_SEC;
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [pendingReports, setPendingReports] = useState(0);
  const [pendingMod, setPendingMod] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const reportsChannelRef = useRef<ReturnType<NonNullable<typeof supabase>["channel"]> | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/connexion?redirect=/admin"); return; }
    if (profile !== null && profile.role !== "admin") { router.replace("/"); }
  }, [loading, user, profile, router]);

  useEffect(() => {
    if (!supabase || !user) return;

    async function loadCount() {
      if (!supabase) return;
      const [{ count: rc }, { count: mc }] = await Promise.all([
        supabase.from("reports").select("*", { count: "exact", head: true }).eq("is_handled", false),
        supabase.from("properties").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      setPendingReports(rc ?? 0);
      setPendingMod(mc ?? 0);
    }

    loadCount();

    if (reportsChannelRef.current) supabase.removeChannel(reportsChannelRef.current);
    reportsChannelRef.current = supabase
      .channel("reports-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, () => loadCount())
      .subscribe();

    return () => {
      if (reportsChannelRef.current && supabase) supabase.removeChannel(reportsChannelRef.current);
    };
  }, [user]);

  // Close drawer on route change
  useEffect(() => {
    const id = window.setTimeout(() => setDrawerOpen(false), 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  async function handleSignOut() {
    await supabase?.auth.signOut();
    document.cookie = "LogerBien-auth=; path=/; max-age=0";
    window.location.href = "/";
  }

  if (loading || !user || (profile !== null && profile.role !== "admin")) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: `2px solid ${ACCENT}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const sidebarProps = { pathname, pendingReports, pendingMod, user, profile, onSignOut: handleSignOut };

  return (
    <div className="admin-shell">
      <style>{`
        :root { --admin-nav-width: 248px; }

        .admin-shell {
          min-height: 100vh;
          display: flex;
          background: var(--bg-primary);
          overflow-x: hidden;
        }

        .admin-sidebar {
          width: var(--admin-nav-width);
          flex-shrink: 0;
          flex-direction: column;
          min-height: 100vh;
          height: 100vh;
          position: sticky;
          top: 0;
          background: var(--bg-primary);
          border-right: 1px solid var(--border);
          z-index: 20;
        }

        .admin-body {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .admin-header {
          height: 56px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 0 clamp(16px, 2vw, 32px);
          background: var(--bg-primary);
          border-bottom: 1px solid var(--border);
          z-index: 10;
        }

        .admin-main {
          flex: 1;
          min-width: 0;
          overflow-x: hidden;
          padding: 32px clamp(16px, 2vw, 32px) 48px;
          box-sizing: border-box;
        }

        .admin-page {
          width: 100%;
          max-width: none;
          box-sizing: border-box;
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          :root { --admin-nav-width: 220px; }
        }

        @media (max-width: 767px) {
          .admin-shell {
            display: block;
          }

          .admin-body {
            min-height: 100vh;
          }

          .admin-header {
            height: calc(60px + env(safe-area-inset-top, 0px));
            padding-top: env(safe-area-inset-top, 0px);
            box-sizing: border-box;
          }

          .admin-main {
            padding: 24px 16px 40px;
          }
        }
      `}</style>

      {/* ── Desktop sidebar ── */}
      <aside
        className="admin-sidebar hidden md:flex"
      >
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* ── Mobile drawer overlay ── */}
      {drawerOpen && (
        <div
          className="md:hidden"
          style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.65)" }}
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile drawer panel ── */}
      <aside
        className="md:hidden"
        style={{
          position: "fixed", top: 0, left: 0, bottom: 0, width: 280,
          paddingTop: "env(safe-area-inset-top, 0px)",
          background: BG_SIDEBAR,
          borderRight: `1px solid ${BORDER}`,
          zIndex: 50,
          transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.22s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div style={{ position: "absolute", top: 12, right: 12 }}>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{ padding: 6, borderRadius: 8, border: "none", background: "var(--border)", color: TEXT_SEC, cursor: "pointer" }}
          >
            <X size={18} />
          </button>
        </div>
        <SidebarContent {...sidebarProps} onNavClick={() => setDrawerOpen(false)} />
      </aside>

      <div className="admin-body">
        <header className="admin-header">
          <button
            className="md:hidden"
            onClick={() => setDrawerOpen(true)}
            style={{ padding: 8, borderRadius: 8, border: "none", background: "transparent", color: TEXT_PRI, cursor: "pointer" }}
          >
            <Menu size={22} />
          </button>
          <Link href="/admin" style={{ textDecoration: "none", minWidth: 0 }}>
            <span style={{ color: TEXT_PRI, fontWeight: 850, fontSize: 16, fontFamily: "var(--font-display), sans-serif", whiteSpace: "nowrap" }}>
              Administration LogerBien
            </span>
          </Link>
          <Link href="/" style={{ color: TEXT_SEC, fontSize: 12, fontWeight: 750, textDecoration: "none", whiteSpace: "nowrap" }}>
            ← Site
          </Link>
        </header>

        <main className="admin-main">
          {children}
        </main>
      </div>

    </div>
  );
}
