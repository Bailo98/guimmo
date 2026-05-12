"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Users, FileText, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

const NAV = [
  { href: "/admin",              icon: Home,     label: "Tableau de bord" },
  { href: "/admin/annonces",     icon: FileText, label: "Annonces" },
  { href: "/admin/utilisateurs", icon: Users,    label: "Utilisateurs" },
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router    = useRouter();
  const pathname  = usePathname();

  // Server-side role check: redirect if not admin
  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/connexion?redirect=/admin"); return; }
    if (profile !== null && profile.role !== "admin") { router.replace("/"); }
  }, [loading, user, profile, router]);

  async function handleSignOut() {
    await supabase?.auth.signOut();
    router.push("/");
  }

  // Show spinner while verifying
  if (loading || !user || (profile !== null && profile.role !== "admin")) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0d1014] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0d1014]">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex w-56 flex-col bg-[#111418] border-r border-[#2a3040] fixed inset-y-0 z-30">
        <div className="p-5 border-b border-[#2a3040]">
          <Link href="/" className="flex items-center gap-1">
            <Logo />
          </Link>
          <span className="text-xs text-slate-500 mt-0.5 block">Administration</span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pathname === href
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
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
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
              pathname === href ? "text-[#F97316]" : "text-slate-500 hover:text-white"
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-56 pt-14 md:pt-0 pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
}
