"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, FileText, Users, LogOut, Flag, UserCheck,
  Upload, Plus, Menu, X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG_SIDEBAR  = "#0a1209";
const BORDER      = "rgba(240,230,204,0.08)";
const TEXT_PRI    = "#f7f2e6";
const TEXT_SEC    = "rgba(240,230,204,0.55)";
const ACCENT      = "#c8901e";
const SEPARATOR   = "rgba(240,230,204,0.06)";

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: "/admin",                   label: "Tableau de bord",     icon: LayoutDashboard },
  { href: "/admin/annonces",          label: "Annonces",            icon: FileText },
  { href: "/admin/annonces/nouvelle", label: "Ajouter une annonce", icon: Plus },
  { href: "/admin/utilisateurs",      label: "Utilisateurs",        icon: Users },
  { href: "/admin/signalements",      label: "Signalements",        icon: Flag, hasBadge: true },
  { href: "/admin/agents",            label: "Agents",              icon: UserCheck },
  { href: "/admin/import",            label: "Importer CSV",        icon: Upload },
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
        <p style={{ color: TEXT_PRI, fontWeight: 800, fontSize: 16, fontFamily: "'Nunito', sans-serif", lineHeight: 1.2 }}>
          BienLoger
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
        padding: "10px 16px",
        borderRadius: 10,
        borderLeft: `3px solid ${isActive ? ACCENT : "transparent"}`,
        background: isActive ? "rgba(200,144,30,0.15)" : "transparent",
        color: isActive ? ACCENT : TEXT_SEC,
        fontSize: 14, fontWeight: 500,
        textDecoration: "none",
        transition: "background 0.15s, color 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLAnchorElement).style.background = "rgba(240,230,204,0.05)";
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
  pathname, pendingReports, user, profile, onSignOut, onNavClick,
}: {
  pathname: string;
  pendingReports: number;
  user: { email?: string } | null;
  profile: { full_name?: string | null; role?: string } | null;
  onSignOut: () => void;
  onNavClick?: () => void;
}) {
  const initials = (profile?.full_name ?? user?.email ?? "A")
    .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

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
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            isActive={isActive(item.href)}
            badge={"hasBadge" in item && item.hasBadge ? pendingReports : undefined}
            onClick={onNavClick}
          />
        ))}
      </nav>

      {/* Bottom: user + logout */}
      <div style={{ padding: "12px 10px", borderTop: `1px solid ${BORDER}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", marginBottom: 4 }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%", background: ACCENT, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: 13, fontWeight: 700,
          }}>
            {initials}
          </div>
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
            padding: "8px 10px", borderRadius: 10, border: "none", background: "transparent",
            color: TEXT_SEC, fontSize: 13, fontWeight: 500, cursor: "pointer",
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/connexion?redirect=/admin"); return; }
    if (profile !== null && profile.role !== "admin") { router.replace("/"); }
  }, [loading, user, profile, router]);

  useEffect(() => {
    if (!supabase || !user) return;
    supabase.from("reports").select("*", { count: "exact", head: true })
      .then(({ count }) => setPendingReports(count ?? 0));
  }, [user]);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  async function handleSignOut() {
    await supabase?.auth.signOut();
    router.push("/");
  }

  if (loading || !user || (profile !== null && profile.role !== "admin")) {
    return (
      <div style={{ minHeight: "100vh", background: "#111a14", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: `2px solid ${ACCENT}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const sidebarProps = { pathname, pendingReports, user, profile, onSignOut: handleSignOut };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#111a14" }}>

      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden md:flex"
        style={{
          flexDirection: "column",
          position: "fixed", top: 0, left: 0, bottom: 0,
          width: "var(--sidebar-w, 260px)",
          background: BG_SIDEBAR,
          borderRight: `1px solid ${BORDER}`,
          zIndex: 30,
        }}
      >
        <style>{`
          @media (min-width: 768px) and (max-width: 1023px) { :root { --sidebar-w: 220px; } }
          @media (min-width: 1024px) { :root { --sidebar-w: 260px; } }
        `}</style>
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
            style={{ padding: 6, borderRadius: 8, border: "none", background: "rgba(240,230,204,0.08)", color: TEXT_SEC, cursor: "pointer" }}
          >
            <X size={18} />
          </button>
        </div>
        <SidebarContent {...sidebarProps} onNavClick={() => setDrawerOpen(false)} />
      </aside>

      {/* ── Mobile header ── */}
      <div
        className="md:hidden"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, height: 60,
          background: BG_SIDEBAR, borderBottom: `1px solid ${BORDER}`,
          display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "0 16px", zIndex: 30,
        }}
      >
        <button
          onClick={() => setDrawerOpen(true)}
          style={{ padding: 8, borderRadius: 8, border: "none", background: "transparent", color: TEXT_PRI, cursor: "pointer" }}
        >
          <Menu size={22} />
        </button>
        <Link href="/admin" style={{ textDecoration: "none" }}>
          <span style={{ color: TEXT_PRI, fontWeight: 800, fontSize: 16, fontFamily: "'Nunito', sans-serif" }}>
            BienLoger
          </span>
        </Link>
        <Link href="/" style={{ color: TEXT_SEC, fontSize: 12, textDecoration: "none" }}>
          ← Site
        </Link>
      </div>

      {/* ── Main content ── */}
      <main
        className="flex-1 md:ml-[var(--sidebar-w,260px)]"
        style={{ paddingTop: 0 }}
      >
        {/* Spacer for mobile fixed header */}
        <div className="md:hidden" style={{ height: 60 }} />
        <div style={{ borderLeft: `1px solid ${SEPARATOR}` }} className="md:hidden" />
        {children}
      </main>

    </div>
  );
}
