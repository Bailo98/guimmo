"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus, BarChart3, Eye, MessageCircle, Star, Settings,
  TrendingUp, Bell, LogOut, ChevronRight, Zap, CreditCard,
  Home, CheckCircle, Clock, XCircle
} from "lucide-react";
import { formatPrice, timeAgo } from "@/lib/utils";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const STATUS_CONFIG = {
  active: { label: "Active", color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20", icon: CheckCircle },
  pending: { label: "En attente", color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20", icon: Clock },
  rented: { label: "Louée", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20", icon: CheckCircle },
  suspended: { label: "Suspendue", color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20", icon: XCircle },
  sold: { label: "Vendue", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20", icon: CheckCircle },
};

export default function ComptePage() {
  const [user, setUser] = useState({ name: "Mon compte", role: "user", phone: "", trustScore: 50, verified: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [myProperties, setMyProperties] = useState<any[]>([]);
  const freeLeft = Math.max(0, 3 - myProperties.length);
  const freePercent = Math.min(100, (myProperties.length / 3) * 100);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.auth.getUser().then(({ data }: any) => { const authUser = data?.user;
      if (!authUser) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase!.from("profiles").select("*").eq("id", authUser.id).single()
        .then(({ data: profile }: any) => {
          if (profile) setUser({ name: profile.name, role: profile.role, phone: profile.phone ?? "", trustScore: profile.trust_score ?? 50, verified: profile.verified ?? false });
        });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase!.from("properties").select("*, property_images(url, is_primary)").eq("owner_id", authUser.id).order("created_at", { ascending: false })
        .then(({ data: props }: any) => { if (props) setMyProperties(props); });
    });
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Mon espace</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Gérez vos annonces et votre compte</p>
        </div>
        <button className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#1e2430] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-[#F97316] border border-slate-200 dark:border-[#2a3040] transition-colors">
          <Bell className="w-4 h-4" />
        </button>
      </div>

      {/* Profile card */}
      <div className="bg-gradient-to-br from-[#F97316] to-[#EA6C0A] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-2xl font-black">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-bold text-lg">{user.name}</p>
              {user.verified && <CheckCircle className="w-4 h-4 text-white/80" />}
            </div>
            <p className="text-white/80 text-sm capitalize">
              {user.role === "agent" ? "Agent immobilier" : user.role}
            </p>
            <p className="text-white/60 text-xs">{user.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black">{user.trustScore}</p>
            <p className="text-white/70 text-xs">Score confiance</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-4 border border-slate-100 dark:border-[#2a3040]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              <Eye className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Vues totales</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{(0).toLocaleString()}</p>
          <p className="text-green-500 text-xs mt-0.5 flex items-center gap-1"><TrendingUp className="w-3 h-3" />+12% ce mois</p>
        </div>
        <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-4 border border-slate-100 dark:border-[#2a3040]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-green-500" />
            </div>
            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Contacts WhatsApp</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{0}</p>
          <p className="text-green-500 text-xs mt-0.5 flex items-center gap-1"><TrendingUp className="w-3 h-3" />+8 cette semaine</p>
        </div>
      </div>

      {/* Free listings counter */}
      <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-5 border border-slate-100 dark:border-[#2a3040]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">Annonces gratuites</p>
            <p className={`text-xs mt-0.5 font-medium ${freeLeft > 0 ? "text-green-500" : "text-red-500"}`}>
              {freeLeft > 0 ? `Il vous reste ${freeLeft} annonce${freeLeft > 1 ? "s" : ""} gratuite${freeLeft > 1 ? "s" : ""}` : "Limite atteinte — passez à un plan payant"}
            </p>
          </div>
          <span className="text-2xl font-black text-[#F97316]">{freeLeft}/{3}</span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-[#151922] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${freePercent >= 100 ? "bg-red-500" : freePercent >= 66 ? "bg-yellow-500" : "bg-[#F97316]"}`}
            style={{ width: `${Math.min(freePercent, 100)}%` }}
          />
        </div>
        {freeLeft === 0 && (
          <Link href="/tarifs" className="mt-3 flex items-center justify-center gap-2 bg-[#F97316] text-white text-sm font-bold py-2.5 rounded-xl hover:bg-[#EA6C0A] transition-colors">
            <Zap className="w-4 h-4" />
            Voir les offres payantes
          </Link>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/publier" className="flex flex-col items-center gap-2 bg-[#F97316] text-white rounded-2xl p-4 hover:bg-[#EA6C0A] transition-colors">
          <Plus className="w-6 h-6" />
          <span className="text-sm font-bold">Publier une annonce</span>
        </Link>
        <Link href="/tarifs" className="flex flex-col items-center gap-2 bg-white dark:bg-[#1e2430] text-slate-700 dark:text-slate-200 rounded-2xl p-4 border border-slate-100 dark:border-[#2a3040] hover:border-[#F97316] transition-colors">
          <Zap className="w-6 h-6 text-[#F97316]" />
          <span className="text-sm font-semibold">Booster mes annonces</span>
        </Link>
      </div>

      {/* My properties */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900 dark:text-white">Mes annonces</h2>
          <Link href="/compte/annonces" className="text-[#F97316] text-sm font-semibold flex items-center gap-1">
            Voir tout <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {myProperties.map((p) => {
            const cfg = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.active;
            const Icon = cfg.icon;
            return (
              <div key={p.id} className="bg-white dark:bg-[#1e2430] rounded-2xl p-4 border border-slate-100 dark:border-[#2a3040] flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-[#151922]">
                  {p.images[0] && (
                    <img src={p.images[0].url} alt={p.images[0].alt} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-1">{p.title}</p>
                  <p className="text-[#F97316] font-bold text-sm">{formatPrice(p.price)}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{p.views}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{p.whatsappClicks}</span>
                    <span className={`flex items-center gap-1 font-medium ${cfg.color}`}>
                      <Icon className="w-3 h-3" />{cfg.label}
                    </span>
                  </div>
                </div>
                <Link href={`/annonces/${p.id}`} className="text-slate-400 hover:text-[#F97316] transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Menu items */}
      <div className="bg-white dark:bg-[#1e2430] rounded-2xl border border-slate-100 dark:border-[#2a3040] overflow-hidden">
        {[
          { icon: BarChart3, label: "Statistiques détaillées", href: "/compte/stats", color: "text-blue-500" },
          { icon: CreditCard, label: "Paiements & Abonnements", href: "/compte/paiements", color: "text-green-500" },
          { icon: Star, label: "Mon abonnement", href: "/tarifs", color: "text-yellow-500" },
          { icon: Settings, label: "Paramètres du compte", href: "/compte/parametres", color: "text-slate-500" },
        ].map((item, i, arr) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-[#151922] transition-colors ${i < arr.length - 1 ? "border-b border-slate-100 dark:border-[#2a3040]" : ""}`}>
              <Icon className={`w-5 h-5 ${item.color}`} />
              <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            </Link>
          );
        })}
      </div>

      {/* Logout */}
      <button className="w-full flex items-center justify-center gap-2 text-red-500 text-sm font-semibold py-3 rounded-xl border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
        <LogOut className="w-4 h-4" />
        Se déconnecter
      </button>
    </div>
  );
}
