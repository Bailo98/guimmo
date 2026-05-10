"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { BarChart3, Home, Users, FileText, CreditCard, AlertTriangle, Settings, LogOut } from "lucide-react";

const NAV = [
  { href: "/admin", icon: Home, label: "Tableau de bord" },
  { href: "/admin/annonces", icon: FileText, label: "Annonces" },
  { href: "/admin/utilisateurs", icon: Users, label: "Utilisateurs" },
  { href: "/admin/paiements", icon: CreditCard, label: "Paiements" },
  { href: "/admin/signalements", icon: AlertTriangle, label: "Signalements" },
  { href: "/admin/moderation", icon: BarChart3, label: "Modération" },
  { href: "/admin/parametres", icon: Settings, label: "Paramètres" },
];

function GuImmoLogo() {
  return (
    <>
      <span style={{ color: "#CE1126" }}>Gu</span>
      <span style={{ color: "#FCD116" }}>Im</span>
      <span style={{ color: "#009460" }}>mo</span>
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;
    if (typeof window !== "undefined") {
      if (localStorage.getItem("guimmo-admin-session") !== "authenticated") {
        window.location.href = "/admin/login";
      }
    }
  }, [isLoginPage]);

  function handleLogout() {
    localStorage.removeItem("guimmo-admin-session");
    window.location.href = "/admin/login";
  }

  if (isLoginPage) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0d1014]">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 flex-col bg-[#111418] border-r border-[#2a3040] fixed inset-y-0">
        <div className="p-5 border-b border-[#2a3040]">
          <Link href="/" className="flex items-center gap-1 font-black text-xl">
            <GuImmoLogo />
          </Link>
          <span className="text-xs text-slate-500 mt-0.5 block">Administration</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-[#2a3040]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" /> Déconnexion admin
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#111418] border-b border-[#2a3040] px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1 font-black">
          <GuImmoLogo />
          <span className="text-xs text-slate-500 ml-1">Admin</span>
        </Link>
        <Link href="/" className="text-slate-400 text-xs">← Site</Link>
      </div>

      {/* Main */}
      <main className="flex-1 md:ml-56 pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
