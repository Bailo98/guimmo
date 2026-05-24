"use client";
import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export type DashTab = { key: string; label: string; icon: React.ReactNode; badge?: number };

function NavLinks({ tabs, active, onChange, onSelect }: {
  tabs: DashTab[]; active: string;
  onChange: (k: string) => void;
  onSelect?: () => void;
}) {
  return (
    <nav className="flex-1 py-3">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => { onChange(t.key); onSelect?.(); }}
          className={cn("bl-nav-item", active === t.key && "active")}
          style={{ fontSize: 13 }}
        >
          {t.icon}
          {t.label}
          {(t.badge ?? 0) > 0 && (
            <span className="ml-auto text-[10px] font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full"
              style={{ background: "#E9E900", color: "#0A1216" }}>
              {(t.badge ?? 0) > 9 ? "9+" : t.badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}

function SidebarBottom({ signOut }: { signOut: () => Promise<void> }) {
  return (
    <div className="p-3 space-y-1" style={{ borderTop: "1px solid var(--bl-border)" }}>
      <button
        onClick={async () => { await signOut(); window.location.href = "/"; }}
        className="flex items-center gap-2.5 w-full text-sm py-2.5 px-3 rounded-xl transition-colors"
        style={{ color: "#ef4444" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(240,68,68,0.08)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <LogOut className="w-4 h-4 flex-shrink-0" />
        Se déconnecter
      </button>
    </div>
  );
}

function SidebarLogo() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-5" style={{ borderBottom: "1px solid var(--bl-border)" }}>
      <div style={{
        width: 36, height: 36, background: "#E9E900", borderRadius: 8,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>
      <span style={{ fontFamily: "var(--font-display), sans-serif", color: "var(--bl-cream)", fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px" }}>
        LogerBien
      </span>
    </div>
  );
}

function SidebarProfile({ name, initials, badge }: { name: string; initials: string; badge?: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--bl-border)" }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
        style={{ background: "var(--bl-amber)", color: "#fff" }}>
        {initials}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "var(--bl-cream)" }}>{name}</p>
        {badge && (
          <span className="bl-badge-pro" style={{ fontSize: 10, padding: "2px 8px" }}>{badge}</span>
        )}
      </div>
    </div>
  );
}

export function DashboardLayout({ tabs, active, onChange, signOut, userName, userInitials, userBadge, children }: {
  tabs: DashTab[];
  active: string;
  onChange: (k: string) => void;
  signOut: () => Promise<void>;
  userName: string;
  userInitials: string;
  userBadge?: string;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="lg:flex" style={{ minHeight: 560 }}>
      {/* ── Desktop sidebar (sticky) ── */}
      <aside
        className="hidden lg:flex flex-col flex-shrink-0"
        style={{
          width: 240,
          background: "var(--bl-sidebar)",
          borderRight: "1px solid var(--bl-border)",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
          scrollbarWidth: "none",
        }}
      >
        <SidebarLogo />
        <SidebarProfile name={userName} initials={userInitials} badge={userBadge} />
        <NavLinks tabs={tabs} active={active} onChange={onChange} />
        <SidebarBottom signOut={signOut} />
      </aside>

      {/* ── Mobile: fixed header ── */}
      <header
        className="lg:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4"
        style={{ height: 60, background: "var(--bl-sidebar)", borderBottom: "1px solid var(--bl-border)" }}
      >
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Ouvrir le menu de navigation"
          className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors"
          style={{ color: "var(--bl-cream-dim)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <Menu className="w-5 h-5" />
        </button>

        <span style={{ fontFamily: "var(--font-display), sans-serif", color: "var(--bl-amber)", fontSize: 17, fontWeight: 700 }}>
          LogerBien
        </span>

        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
          style={{ background: "rgba(200,144,30,0.20)", color: "var(--bl-amber-light)" }}>
          {userInitials}
        </div>
      </header>

      {/* ── Mobile drawer + overlay ── */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50"
          style={{ background: "rgba(0,0,0,0.65)" }}
          onClick={() => setDrawerOpen(false)}
        >
          <aside
            className="absolute left-0 top-0 bottom-0 flex flex-col overflow-y-auto"
            style={{
              width: 260,
              background: "var(--bl-sidebar)",
              borderRight: "1px solid var(--bl-border)",
              scrollbarWidth: "none",
              animation: "slideInLeft 0.22s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid var(--bl-border)" }}>
              <div className="flex items-center gap-2.5">
                <div style={{
                  width: 32, height: 32, background: "#E9E900", borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <span style={{ fontFamily: "var(--font-display), sans-serif", color: "var(--bl-cream)", fontSize: 17, fontWeight: 700, letterSpacing: "-0.3px" }}>LogerBien</span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Fermer le menu de navigation"
                className="w-8 h-8 flex items-center justify-center rounded-lg"
                style={{ color: "var(--bl-cream-faint)" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <SidebarProfile name={userName} initials={userInitials} badge={userBadge} />
            <NavLinks tabs={tabs} active={active} onChange={onChange} onSelect={() => setDrawerOpen(false)} />
            <SidebarBottom signOut={signOut} />
          </aside>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 pt-[60px] lg:pt-0">
        <div className="p-4 lg:p-7 pb-24">
          {children}
        </div>
      </div>
    </div>
  );
}
