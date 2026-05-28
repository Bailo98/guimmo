"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText, Users, Flag, UserCheck, Plus, Upload,
  TrendingUp, AlertTriangle, Clock, CheckCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ─── Tokens ──────────────────────────────────────────────────────────────────
const SURFACE  = "var(--bl-surface)";
const BORDER   = "var(--color-border)";
const TEXT_PRI = "var(--bl-cream)";
const TEXT_SEC = "var(--bl-cream-dim)";
const ACCENT   = "#D4AF37";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Stats {
  total: number; active: number; pending: number;
  users: number; thisWeek: number; pendingVerif: number; reports: number;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, accentColor, icon: Icon,
}: {
  label: string; value: number | null; accentColor: string; icon: React.ElementType;
}) {
  return (
    <div style={{
      background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14,
      padding: "20px 24px", position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 12, right: 12,
        color: accentColor, opacity: 0.12,
      }}>
        <Icon size={40} />
      </div>
      <p style={{
        fontSize: 11, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "1.5px", color: TEXT_SEC, marginBottom: 8,
      }}>
        {label}
      </p>
      {value === null ? (
        <div style={{ height: 36, width: 60, background: "var(--color-border)", borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
      ) : (
        <p style={{
          fontSize: "clamp(22px, 4vw, 32px)",
          fontFamily: "var(--font-display), sans-serif",
          fontWeight: 700, color: accentColor, lineHeight: 1,
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
        display: "flex", alignItems: "center", gap: 16,
        background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14,
        padding: "18px 20px", textDecoration: "none",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(212,175,55,0.35)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = BORDER; }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: `${iconColor}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
      }}>
        <Icon size={22} color={iconColor} />
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
        <p style={{ color: TEXT_PRI, fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{title}</p>
        <p style={{ color: TEXT_SEC, fontSize: 12 }}>{desc}</p>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!supabase) return;
    async function load() {
      const db = supabase!;
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [a, b, c, d, e, f, g] = await Promise.all([
        db.from("properties").select("*", { count: "exact", head: true }),
        db.from("properties").select("*", { count: "exact", head: true }).eq("status", "active"),
        db.from("properties").select("*", { count: "exact", head: true }).eq("status", "pending"),
        db.from("profiles").select("*", { count: "exact", head: true }),
        db.from("properties").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
        db.from("profiles").select("*", { count: "exact", head: true }).eq("is_verified", false),
        db.from("reports").select("*", { count: "exact", head: true }),
      ]);
      setStats({
        total:       a.count ?? 0,
        active:      b.count ?? 0,
        pending:     c.count ?? 0,
        users:       d.count ?? 0,
        thisWeek:    e.count ?? 0,
        pendingVerif: f.count ?? 0,
        reports:     g.count ?? 0,
      });
    }
    load();
  }, []);

  const v = stats;

  return (
    <div style={{ padding: "28px 24px 40px", maxWidth: 1200 }} className="px-4 md:px-6">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          color: TEXT_PRI, fontWeight: 900, fontSize: "clamp(20px,4vw,28px)",
          fontFamily: "var(--font-display), sans-serif",
        }}>
          Tableau de bord
        </h1>
        <p style={{ color: TEXT_SEC, fontSize: 13, marginTop: 4 }}>
          Vue d&apos;ensemble de la plateforme LogerBien
        </p>
      </div>

      {/* Stats grid */}
      <div
        style={{ display: "grid", gap: 12, marginBottom: 28 }}
        className="grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      >
        <StatCard label="Total annonces"    value={v?.total        ?? null} accentColor={TEXT_PRI}   icon={FileText} />
        <StatCard label="Actives"           value={v?.active       ?? null} accentColor="#D4AF37"    icon={CheckCircle} />
        <StatCard label="En attente"        value={v?.pending      ?? null} accentColor={ACCENT}     icon={Clock} />
        <StatCard label="Utilisateurs"      value={v?.users        ?? null} accentColor="#60a5fa"    icon={Users} />
        <StatCard label="Cette semaine"     value={v?.thisWeek     ?? null} accentColor={ACCENT}     icon={TrendingUp} />
        <StatCard label="À vérifier"        value={v?.pendingVerif ?? null} accentColor="#D4AF37"    icon={Users} />
        <StatCard label="Signalements"      value={v?.reports      ?? null} accentColor="#ef4444"    icon={AlertTriangle} />
      </div>

      {/* Section title */}
      <p style={{ color: TEXT_SEC, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 12 }}>
        Actions rapides
      </p>

      {/* Quick actions */}
      <div
        style={{ display: "grid", gap: 10 }}
        className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      >
        <ActionCard
          href="/admin/annonces"
          icon={FileText}
          iconColor={ACCENT}
          title="Modérer les annonces"
          desc="Approuver, suspendre, supprimer"
        />
        <ActionCard
          href="/admin/annonces/nouvelle"
          icon={Plus}
          iconColor="#D4AF37"
          title="Ajouter une annonce"
          desc="Publier manuellement"
        />
        <ActionCard
          href="/admin/utilisateurs"
          icon={Users}
          iconColor="#60a5fa"
          title="Gérer les utilisateurs"
          desc="Rôles, vérification, comptes"
        />
        <ActionCard
          href="/admin/signalements"
          icon={Flag}
          iconColor="#ef4444"
          title="Signalements"
          desc="Annonces signalées par les utilisateurs"
          badge={v?.reports}
        />
        <ActionCard
          href="/admin/agents"
          icon={UserCheck}
          iconColor="#a78bfa"
          title="Gérer les agents"
          desc="Agents certifiés LogerBien"
        />
        <ActionCard
          href="/admin/import"
          icon={Upload}
          iconColor="#38bdf8"
          title="Importer CSV"
          desc="Import en masse d'annonces"
        />
      </div>
    </div>
  );
}
