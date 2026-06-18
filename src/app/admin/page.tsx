"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users, Flag, UserCheck, Plus,
  AlertTriangle, CheckCircle, ShieldCheck, Database, Clock, Activity, FileText,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ─── Tokens ──────────────────────────────────────────────────────────────────
const SURFACE  = "var(--bg-card)";
const BORDER   = "var(--border)";
const TEXT_PRI = "var(--text-primary)";
const TEXT_SEC = "var(--text-primary-dim)";
const ACCENT   = "var(--accent-gold)";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Stats {
  total: number; active: number; pending: number;
  users: number; thisWeek: number; pendingVerif: number; reports: number; verifiedOwners: number;
}

interface ActivityItem {
  label: string;
  detail: string;
  time: string;
  href: string;
  Icon: React.ElementType;
  color: string;
}

function relativeTime(value?: string | null) {
  if (!value) return "";
  const diff = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diff) || diff < 0) return "";
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "hier";
  return `il y a ${days} j`;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, accentColor, icon: Icon,
}: {
  label: string; value: number | null; accentColor: string; icon: React.ElementType;
}) {
  return (
    <div style={{
      background: SURFACE,
      border: `1px solid ${BORDER}`,
      borderRadius: 18,
      padding: "22px 24px",
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 16px 38px rgba(15, 23, 42, 0.08)",
    }}>
      <div style={{
        position: "absolute", top: 14, right: 14,
        width: 44, height: 44, borderRadius: 14,
        background: `${accentColor}16`,
        color: accentColor,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={24} />
      </div>
      <p style={{
        fontSize: 13, fontWeight: 800,
        color: TEXT_SEC, marginBottom: 12,
      }}>
        {label}
      </p>
      {value === null ? (
        <div style={{ height: 36, width: 60, background: "var(--border)", borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
      ) : (
        <p style={{
          fontSize: "clamp(30px, 4vw, 46px)",
          fontFamily: "var(--font-display), sans-serif",
          fontWeight: 900, color: accentColor, lineHeight: 0.95,
        }}>
          {value.toLocaleString("fr-FR")}
        </p>
      )}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  );
}

// ─── Quick action card ────────────────────────────────────────────────────────
function ActionCard({
  href, icon: Icon, iconColor, title, desc, badge,
}: {
  href: string; icon: React.ElementType; iconColor: string;
  title: string; desc: string; badge?: number;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex", alignItems: "center", gap: 18,
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 18,
        padding: "22px",
        textDecoration: "none",
        minHeight: 122,
        boxShadow: "0 14px 36px rgba(15, 23, 42, 0.07)",
        transition: "transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(191,141,38,0.45)";
        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 18px 44px rgba(15, 23, 42, 0.10)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = BORDER;
        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 14px 36px rgba(15, 23, 42, 0.07)";
      }}
    >
      <div style={{
        width: 58, height: 58, borderRadius: 18, flexShrink: 0,
        background: `${iconColor}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
      }}>
        <Icon size={28} color={iconColor} />
        {badge != null && badge > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            background: "#ef4444", color: "white",
            fontSize: 9, fontWeight: 700, borderRadius: 999,
            minWidth: 16, height: 16,
            display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px",
          }}>
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ color: TEXT_PRI, fontWeight: 850, fontSize: 17, marginBottom: 6 }}>{title}</p>
        <p style={{ color: TEXT_SEC, fontSize: 14, lineHeight: 1.45 }}>{desc}</p>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (!supabase) return;
    async function load() {
      const db = supabase!;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const [a, b, c, d, e, f, g, h] = await Promise.all([
        db.from("properties").select("*", { count: "exact", head: true }),
        db.from("properties").select("*", { count: "exact", head: true }).eq("status", "active"),
        db.from("properties").select("*", { count: "exact", head: true }).eq("status", "pending"),
        db.from("profiles").select("*", { count: "exact", head: true }),
        db.from("properties").select("*", { count: "exact", head: true }).gte("created_at", weekAgo.toISOString()),
        db.from("owner_verification_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
        db.from("reports").select("*", { count: "exact", head: true }).eq("is_handled", false),
        db.from("profiles").select("*", { count: "exact", head: true }).eq("is_verified_pro", true),
      ]);
      const [lastProperty, lastReport, lastVerification, lastUser] = await Promise.all([
        db.from("properties").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
        db.from("reports").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
        db.from("owner_verification_requests").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
        db.from("profiles").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      setStats({
        total:       a.count ?? 0,
        active:      b.count ?? 0,
        pending:     c.count ?? 0,
        users:       d.count ?? 0,
        thisWeek:    e.count ?? 0,
        pendingVerif: f.count ?? 0,
        reports:     g.count ?? 0,
        verifiedOwners: h.count ?? 0,
      });
      const nextActivities: ActivityItem[] = [];
      if (!lastProperty.error && lastProperty.data) {
        const item = lastProperty.data as { title?: string | null; created_at?: string | null };
        nextActivities.push({
          label: "Nouvelle annonce",
          detail: String(item.title ?? "Annonce récente"),
          time: relativeTime(item.created_at),
          href: "/admin/annonces",
          Icon: FileText,
          color: ACCENT,
        });
      }
      if (!lastReport.error && lastReport.data) {
        const item = lastReport.data as { reason?: string | null; created_at?: string | null };
        nextActivities.push({
          label: "Nouveau signalement",
          detail: String(item.reason ?? "Signalement"),
          time: relativeTime(item.created_at),
          href: "/admin/signalements",
          Icon: Flag,
          color: "#dc2626",
        });
      }
      if (!lastVerification.error && lastVerification.data) {
        const item = lastVerification.data as { full_name?: string | null; created_at?: string | null };
        nextActivities.push({
          label: "Demande de vérification",
          detail: String(item.full_name ?? "Propriétaire"),
          time: relativeTime(item.created_at),
          href: "/admin/verifications",
          Icon: UserCheck,
          color: "#16a34a",
        });
      }
      if (!lastUser.error && lastUser.data) {
        const userRow = lastUser.data as { full_name?: string | null; id?: string | null; created_at?: string | null };
        nextActivities.push({
          label: "Nouvel utilisateur",
          detail: String(userRow.full_name ?? userRow.id ?? "Utilisateur"),
          time: relativeTime(userRow.created_at),
          href: "/admin/utilisateurs",
          Icon: Users,
          color: "#2563eb",
        });
      }
      setActivities(nextActivities);
    }
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const v = stats;
  const todoItems = [
    { label: "Signalements", value: v?.reports ?? null, href: "/admin/signalements", Icon: Flag, color: "#dc2626" },
    { label: "Vérifications", value: v?.pendingVerif ?? null, href: "/admin/verifications", Icon: UserCheck, color: "#16a34a" },
    { label: "À modérer", value: v?.pending ?? null, href: "/admin/moderation", Icon: ShieldCheck, color: ACCENT },
  ];
  const allClear = !!v && todoItems.every((item) => (item.value ?? 0) === 0);

  return (
    <div
      className="admin-page"
      style={{ width: "100%", maxWidth: "none", margin: 0, padding: 0, boxSizing: "border-box" }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 18,
          flexWrap: "wrap",
        }}
      >
        <div>
        <h1 style={{
          color: TEXT_PRI, fontWeight: 950, fontSize: "clamp(26px,4vw,42px)",
          fontFamily: "var(--font-display), sans-serif",
        }}>
          Dashboard
        </h1>
        <p style={{ color: TEXT_SEC, fontSize: 16, marginTop: 6 }}>
          Les priorités admin de LogerBien, sans bruit inutile.
        </p>
        </div>
        <Link
          href="/admin/annonces/nouvelle"
          style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            minHeight: 46, padding: "0 18px",
            borderRadius: 14, background: ACCENT,
            color: "var(--bg-primary)", fontWeight: 850,
            textDecoration: "none", boxShadow: "0 12px 28px rgba(191,141,38,0.24)",
          }}
        >
          <Plus size={19} /> Ajouter une annonce
        </Link>
      </div>

      {/* Stats grid */}
      <div
        style={{ display: "grid", gap: 16, marginBottom: 28 }}
        className="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard label="Annonces actives" value={v?.active ?? null} accentColor="var(--accent-gold)" icon={CheckCircle} />
        <StatCard label="Utilisateurs" value={v?.users ?? null} accentColor="#2563eb" icon={Users} />
        <StatCard label="Signalements" value={v?.reports ?? null} accentColor="#dc2626" icon={AlertTriangle} />
        <StatCard label="Vérifications" value={v?.pendingVerif ?? null} accentColor="#16a34a" icon={ShieldCheck} />
      </div>

      {/* Section title */}
      <div style={{ marginBottom: 14 }}>
        <p style={{ color: TEXT_PRI, fontSize: 22, fontWeight: 900, marginBottom: 4 }}>Actions rapides</p>
        <p style={{ color: TEXT_SEC, fontSize: 14 }}>Les tâches importantes restent visibles dès l’arrivée sur l’admin.</p>
      </div>

      {/* Quick actions */}
      <div
        style={{ display: "grid", gap: 16 }}
        className="grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
      >
        <ActionCard
          href="/admin/moderation"
          icon={ShieldCheck}
          iconColor={ACCENT}
          title="Modérer les annonces"
          desc="Approuver ou refuser les annonces en attente."
          badge={v?.pending}
        />
        <ActionCard
          href="/admin/verifications"
          icon={UserCheck}
          iconColor="#16a34a"
          title="Vérifier propriétaires"
          desc="Contrôler les demandes de vérification de compte."
          badge={v?.pendingVerif}
        />
        <ActionCard
          href="/admin/signalements"
          icon={Flag}
          iconColor="#dc2626"
          title="Gérer signalements"
          desc="Traiter les annonces signalées par les utilisateurs."
          badge={v?.reports}
        />
        <ActionCard
          href="/admin/demandes-logement"
          icon={FileText}
          iconColor="#7c3aed"
          title="Demandes de logement"
          desc="Voir les recherches publiées par les locataires."
        />
        <ActionCard
          href="/admin/annonces/nouvelle"
          icon={Plus}
          iconColor="var(--accent-gold)"
          title="Ajouter une annonce"
          desc="Publier manuellement"
        />
        <ActionCard
          href="/admin/utilisateurs"
          icon={Users}
          iconColor="#2563eb"
          title="Gérer les utilisateurs"
          desc="Consulter les comptes, rôles et profils."
        />
        <ActionCard
          href="/admin/import"
          icon={Database}
          iconColor="#38bdf8"
          title="Importer CSV"
          desc="Ajouter des annonces en masse depuis un fichier."
        />
      </div>

      <div className="mt-7 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 22, boxShadow: "0 14px 36px rgba(15, 23, 42, 0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Clock size={21} color={ACCENT} />
            <h2 style={{ color: TEXT_PRI, fontSize: 20, fontWeight: 900 }}>À traiter aujourd&apos;hui</h2>
          </div>
          {allClear ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 78, color: "#16a34a", fontWeight: 850 }}>
              <CheckCircle size={24} />
              Tout est à jour
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }} className="grid-cols-1 sm:grid-cols-3">
              {todoItems.map(({ label, value, href, Icon, color }) => (
                <Link key={label} href={href} style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 74, padding: "12px", borderRadius: 14, border: `1px solid ${BORDER}`, background: "var(--bg-primary)", textDecoration: "none" }}>
                  <Icon size={20} color={color} />
                  <span style={{ minWidth: 0 }}>
                    <strong style={{ display: "block", color, fontSize: 24, lineHeight: 1 }}>{value ?? "…"}</strong>
                    <span style={{ color: TEXT_SEC, fontSize: 12, fontWeight: 750 }}>{label}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 22, boxShadow: "0 14px 36px rgba(15, 23, 42, 0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Activity size={21} color={ACCENT} />
            <h2 style={{ color: TEXT_PRI, fontSize: 20, fontWeight: 900 }}>Dernière activité</h2>
          </div>
          {activities.length === 0 ? (
            <p style={{ color: TEXT_SEC, fontSize: 14, minHeight: 78, display: "flex", alignItems: "center" }}>Aucune activité récente disponible.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {activities.slice(0, 4).map(({ label, detail, time, href, Icon, color }) => (
                <Link key={label} href={href} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", textDecoration: "none", borderBottom: `1px solid ${BORDER}` }}>
                  <span style={{ width: 38, height: 38, borderRadius: 12, background: `${color}16`, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={18} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <strong style={{ display: "block", color: TEXT_PRI, fontSize: 14 }}>{label}</strong>
                    <span style={{ display: "block", color: TEXT_SEC, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{detail}</span>
                    {time && <span style={{ display: "block", color: TEXT_SEC, fontSize: 11, fontWeight: 750, marginTop: 2 }}>{time}</span>}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-4" style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 22 }}>
        <h2 style={{ color: TEXT_PRI, fontSize: 20, fontWeight: 900, marginBottom: 12 }}>Santé plateforme</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {[
            { href: "/admin/verifications", label: "Propriétaires vérifiés", value: v?.verifiedOwners ?? 0, Icon: UserCheck, color: "#16a34a" },
            { href: "/admin/signalements", label: "Signalements actifs", value: v?.reports ?? 0, Icon: Flag, color: "#dc2626" },
            { href: "/admin/annonces", label: "Annonces actives", value: v?.active ?? 0, Icon: CheckCircle, color: ACCENT },
            { href: "/admin/utilisateurs", label: "Utilisateurs inscrits", value: v?.users ?? 0, Icon: Users, color: "#2563eb" },
          ].map(({ href, label, value, Icon, color }) => (
            <Link key={href} href={href} style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 72, padding: "0 14px", borderRadius: 14, border: `1px solid ${BORDER}`, color: TEXT_PRI, background: "var(--bg-primary)", textDecoration: "none", fontWeight: 850 }}>
              <Icon size={19} color={color} />
              <span>
                <strong style={{ display: "block", color, fontSize: 22, lineHeight: 1 }}>{value.toLocaleString("fr-FR")}</strong>
                <span style={{ display: "block", color: TEXT_SEC, fontSize: 12, marginTop: 4 }}>{label}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
