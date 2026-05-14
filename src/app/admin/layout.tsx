"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Users, FileText, LogOut, Flag, UserCheck, Upload } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

const MAIN_NAV = [
  { href: "/admin",              icon: Home,       label: "Tableau de bord" },
  { href: "/admin/annonces",     icon: FileText,   label: "Annonces" },
  { href: "/admin/utilisateurs", icon: Users,      label: "Utilisateurs" },
];

const EXTRA_NAV = [
  { href: "/admin/signalements", icon: Flag,       label: "Signalements" },
  { href: "/admin/agents",       icon: UserCheck,  label: "Agents" },
  { href: "/admin/import",       icon: Upload,     label: "Importer CSV" },
];

function Logo() {
  return (
    <span className="font-black text-xl">
      <span style={{ color: "#CE1126" }}>Gu</span>
      <span style={{ color: "#FCD116" }}>Im</span>
      <span style={{ color: "#009460" }}>mo</span>
    </span>
  );
}

function NavLink({ href, icon: Icon, label, badge, pathname }: {
  href: string; icon: React.ElementType; label: string; badge?: number; pathname: string;
}) {
  const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        active ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span className="min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [pendingReports, setPendingReports] = useState(0);

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

  async function handleSignOut() {
    await supabase?.auth.signOut();
    router.push("/");
  }

  if (loading || !user || (profile !== null && profile.role !== "admin")) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const MOBILE_NAV = [...MAIN_NAV, { href: "/admin/signalements", icon: Flag, label: "Signalements" }];

  return (
    <div className="flex min-h-screen bg-[#0A0A0F]">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex w-56 flex-col bg-[#111418] border-r border-[#2a3040] fixed inset-y-0 z-30">
        <div className="p-5 border-b border-[#2a3040]">
          <Link href="/" className="flex items-center gap-1">
            <Logo />
          </Link>
          <span className="text-xs text-slate-500 mt-0.5 block">Administration</span>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {MAIN_NAV.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} />
          ))}
          <div className="my-2 border-t border-[#2a3040]" />
          {EXTRA_NAV.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              pathname={pathname}
              badge={item.href === "/admin/signalements" ? pendingReports : undefined}
            />
          ))}
        </nav>

        <div className="p-3 border-t border-[#2a3040]">
          <div className="px-3 py-2 mb-1">
            <p className="text-white text-xs font-semibold truncate">{profile?.full_name ?? user.email}</p>
            <p className="text-slate-500 text-[11px] truncate">{user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#111418] border-b border-[#2a3040] px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-slate-500 text-xs">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-slate-400 text-xs hover:text-white">← Site</Link>
          <button onClick={handleSignOut} className="text-red-400">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile bottom tabs */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111418] border-t border-[#2a3040] flex">
        {MOBILE_NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors relative ${
                active ? "text-[#F97316]" : "text-slate-500 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
              {href === "/admin/signalements" && pendingReports > 0 && (
                <span className="absolute top-1.5 right-1/4 w-2 h-2 rounded-full bg-red-500" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-56 pt-14 md:pt-0 pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
}
