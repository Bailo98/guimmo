"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, Menu, X, Plus, LogOut, User, ChevronDown, Shield, Bell } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { markAllRead, type Notification } from "@/lib/notifications";

export function Header() {
  const { resolvedTheme, setTheme } = useTheme();
  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();

  useEffect(() => { setMounted(true); }, []);

  // Fetch notifications
  const loadNotifications = useCallback(async () => {
    if (!user || !isSupabaseConfigured || !supabase) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) {
      setNotifications(data as Notification[]);
      setUnreadCount(data.filter((n: Notification) => !n.read).length);
    }
  }, [user]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  // Close bell dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleBellOpen() {
    setBellOpen((v) => !v);
    if (!bellOpen && user && unreadCount > 0) {
      await markAllRead(user.id);
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSignOut() {
    await signOut();
    setUserMenuOpen(false);
    // Hard reload ensures all React state + RSC cache is cleared after Supabase signOut.
    // router.push("/") leaves stale client cache → blank/broken page (same bug fixed in DashboardLayout).
    window.location.href = "/";
  }

  const displayName = profile?.full_name ?? user?.email?.split("@")[0] ?? "Mon compte";
  const role = profile?.role ?? "buyer";
  const accountType = profile?.account_type ?? null;
  const isAdmin = role === "admin";
  // Chercheur accounts never see Publier, even if role is misconfigured
  const isChercheur = accountType === "chercheur" || role === "chercheur";
  const isProprietaire = !isChercheur && (
    ["proprietaire", "owner", "agent", "agence", "admin"].includes(role)
    || ["proprietaire", "agent", "agence"].includes(accountType ?? "")
  );

  const NO_HEADER = ["/inscription", "/connexion", "/mot-de-passe-oublie"];
  if (NO_HEADER.includes(pathname)) return null;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300"
      style={{ background: "var(--nav-bg)", backdropFilter: "blur(18px) saturate(1.3)", WebkitBackdropFilter: "blur(18px) saturate(1.3)", borderBottom: "1px solid var(--border)" }}
    >
      <div className="max-w-7xl mx-auto px-4 h-[72px] flex items-center justify-between gap-4">
        <Logo />

        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/annonces"
            className="px-3 py-2 rounded-xl transition-colors hover:bg-black/5"
            style={{ fontSize: 13, fontWeight: 300, letterSpacing: "0.12em", textTransform: "uppercase", color: pathname.startsWith("/annonces") ? "var(--nav-text-active)" : "var(--nav-text)" }}
          >
            Annonces
          </Link>
          <Link
            href="/je-cherche"
            className="px-3 py-2 rounded-xl transition-colors hover:bg-black/5"
            style={{ fontSize: 13, fontWeight: 300, letterSpacing: "0.12em", textTransform: "uppercase", color: pathname === "/je-cherche" ? "var(--nav-text-active)" : "var(--nav-text)" }}
          >
            Je cherche 🔍
          </Link>
          <Link
            href="/agents"
            className="px-3 py-2 rounded-xl transition-colors hover:bg-black/5"
            style={{ fontSize: 13, fontWeight: 300, letterSpacing: "0.12em", textTransform: "uppercase", color: pathname === "/agents" ? "var(--nav-text-active)" : "var(--nav-text)" }}
          >
            Agents
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-black/5"
            style={{ color: "var(--nav-text)" }}
            aria-label="Changer le thème"
          >
            {(!mounted || resolvedTheme === "dark") ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* ── Notification bell ── */}
          {user && (
            <div ref={bellRef} className="relative hidden md:block">
              <button
                onClick={handleBellOpen}
                className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-black/5"
                style={{ color: "var(--nav-text)" }}
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-black text-white"
                    style={{ background: "#ef4444" }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-80 rounded-2xl overflow-hidden z-50 border"
                  style={{ background: "var(--nav-dropdown-bg)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderColor: "var(--nav-border)" }}
                >
                  <div className="px-4 py-3 border-b" style={{ borderColor: "var(--nav-border)" }}>
                    <p className="text-sm font-bold" style={{ color: "var(--nav-text-active)" }}>Notifications</p>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm" style={{ color: "var(--nav-text)" }}>Aucune notification</p>
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className="px-4 py-3 border-b last:border-b-0"
                          style={{
                            borderColor: "var(--nav-border)",
                            background: n.read ? "transparent" : "rgba(212,175,55,0.05)",
                          }}
                        >
                          <p className="text-sm font-semibold" style={{ color: "var(--nav-text-active)" }}>{n.title}</p>
                          {n.body && <p className="text-xs mt-0.5" style={{ color: "var(--nav-text)" }}>{n.body}</p>}
                          <p className="text-[10px] mt-1" style={{ color: "var(--nav-text)" }}>
                            {new Date(n.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {isProprietaire && (
            <Link
              href="/publier"
              className="hidden md:flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl"
              style={{ background: "var(--accent-gold)", color: "#0B0F19", transition: "opacity 0.2s ease" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.85"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
            >
              <Plus className="w-4 h-4" />
              Publier
            </Link>
          )}

          {/* ── Boutons Auth desktop ── */}
          {user ? (
            <div ref={userMenuRef} className="relative hidden md:block">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors hover:bg-black/5"
                style={{ color: "var(--nav-text)" }}
              >
                <Avatar url={profile?.avatar_url} name={displayName} size="sm" />
                <span className="text-sm font-medium max-w-[100px] truncate" style={{ color: "var(--nav-text-active)" }}>
                  {displayName.split(" ")[0]}
                </span>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", userMenuOpen && "rotate-180")} style={{ color: "var(--nav-text)" }} />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden z-50 border"
                  style={{ background: "var(--nav-dropdown-bg)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderColor: "var(--nav-border)" }}
                  onClick={() => setUserMenuOpen(false)}
                >
                  <div className="px-4 py-4">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--nav-text-active)" }}>{displayName}</p>
                    <p className="text-xs truncate mt-0.5" style={{ color: "var(--nav-text)" }}>{user.email}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/connexion"
                className="text-sm font-medium px-4 py-2 rounded-xl"
                style={{
                  color: "var(--accent-gold)",
                  border: "1px solid var(--accent-gold)",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(212,175,55,0.10)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                }}
              >
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="text-sm font-bold px-4 py-2 rounded-xl"
                style={{
                  background: "var(--accent-gold)",
                  color: "#0B0F19",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.opacity = "0.88";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
                }}
              >
                S&apos;inscrire
              </Link>
            </div>
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-black/5"
            style={{ color: "var(--nav-text)" }}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          className="md:hidden border-t px-4 pb-4 space-y-1 animate-[slideDown_0.2s_ease-out]"
          style={{ background: "var(--nav-dropdown-bg)", borderColor: "var(--nav-border)" }}
        >
          <Link href="/annonces" onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-3 rounded-xl hover:bg-black/5"
            style={{ color: "var(--nav-text)" }}>
            Annonces
          </Link>
          <Link href="/je-cherche" onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-3 rounded-xl hover:bg-black/5"
            style={{ color: "var(--nav-text)" }}>
            Je cherche 🔍
          </Link>
          <Link href="/agents" onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-3 rounded-xl hover:bg-black/5"
            style={{ color: "var(--nav-text)" }}>
            Agents
          </Link>
          {user ? (
            <>
              {isAdmin ? (
                <Link href="/admin" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-3 rounded-xl font-semibold hover:bg-black/5"
                  style={{ color: "var(--nav-text)" }}>
                  <Shield className="w-4 h-4" /> Administration
                </Link>
              ) : (
                <Link href="/compte" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-3 rounded-xl hover:bg-black/5"
                  style={{ color: "var(--nav-text)" }}>
                  <User className="w-4 h-4" /> Mon compte
                </Link>
              )}
              <button onClick={() => { handleSignOut(); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-3 rounded-xl text-red-500 hover:bg-red-500/10">
                <LogOut className="w-4 h-4" /> Se déconnecter
              </button>
            </>
          ) : (
            <>
              <Link href="/connexion" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-3 rounded-xl hover:bg-black/5"
                style={{ color: "var(--nav-text)" }}>
                Connexion
              </Link>
              <Link href="/inscription" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-3 rounded-xl hover:bg-black/5"
                style={{ color: "var(--nav-text)" }}>
                S&apos;inscrire
              </Link>
            </>
          )}
          {isProprietaire && (
            <Link href="/publier" onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-2 font-bold py-3 rounded-xl mt-2"
              style={{ background: "#D4AF37", color: "#0B0F19" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#B8963A"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#D4AF37"; }}>
              <Plus className="w-4 h-4" /> Publier une annonce
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
