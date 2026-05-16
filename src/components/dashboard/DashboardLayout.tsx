"use client";
import { useState } from "react";
import { Menu, X, LogOut, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export type DashTab = { key: string; label: string; icon: React.ReactNode };

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
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--bl-amber)" }}>
        <Home className="w-4 h-4 text-white" />
      </div>
      <span style={{ fontFamily: "var(--font-playfair)", color: "var(--bl-cream)", fontSize: 17, fontWeight: 700 }}>
        BienLoger
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
          className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors"
          style={{ color: "var(--bl-cream-dim)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(240,230,204,0.07)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <Menu className="w-5 h-5" />
        </button>

        <span style={{ fontFamily: "var(--font-playfair)", color: "var(--bl-amber)", fontSize: 17, fontWeight: 700 }}>
          BienLoger
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
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "var(--bl-amber)" }}>
                  <Home className="w-3.5 h-3.5 text-white" />
                </div>
                <span style={{ fontFamily: "var(--font-playfair)", color: "var(--bl-cream)", fontSize: 16, fontWeight: 700 }}>BienLoger</span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
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
