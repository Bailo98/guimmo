"use client";

import { useEffect, useState } from "react";
import { Calendar, CheckCircle, Home, MapPin, Phone, Trash2, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import { getNeighborhoodName } from "@/data/neighborhoods";

interface HousingRequest {
  id: string;
  user_id: string;
  commune: string;
  property_type: string | null;
  max_budget: number | null;
  rooms: number | null;
  move_in_date: string | null;
  phone: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  apartment: "Appartement",
  house: "Maison",
  villa: "Villa",
  studio: "Studio",
  room: "Chambre",
  land: "Terrain",
};

export default function AdminHousingRequestsPage() {
  const [requests, setRequests] = useState<HousingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data, error } = await supabase
      .from("housing_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      console.error("[admin] demandes logement:", error.message, error.code);
      setRequests([]);
    } else {
      setRequests((data ?? []) as HousingRequest[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function setStatus(id: string, status: "active" | "matched" | "closed" | "removed") {
    if (!supabase) return;
    const { error } = await supabase.from("housing_requests").update({ status }).eq("id", id);
    if (!error) setRequests((prev) => prev.map((req) => req.id === id ? { ...req, status } : req));
  }

  async function remove(id: string) {
    await setStatus(id, "removed");
  }

  return (
    <div className="admin-page space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black md:text-3xl" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display), sans-serif" }}>
            Demandes de logement
          </h1>
          <p className="mt-2 text-sm font-bold" style={{ color: "var(--text-secondary)" }}>
            Recherches publiées par les locataires. Admin uniquement.
          </p>
        </div>
        <div className="rounded-2xl px-4 py-3 text-sm font-black" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--accent-gold)" }}>
          {requests.length} demandes
        </div>
      </header>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }} />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <section className="rounded-2xl p-10 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <Home className="mx-auto mb-3 h-10 w-10 text-[var(--accent-gold)]" strokeWidth={2.3} />
          <p className="text-xl font-black" style={{ color: "var(--text-primary)" }}>Aucune demande</p>
        </section>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {requests.map((request) => (
            <article key={request.id} className="rounded-[24px] p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-soft)" }}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-black" style={{ background: "rgba(185,138,46,0.14)", color: "var(--accent-gold)" }}>
                    <MapPin className="h-4 w-4" strokeWidth={2.4} />
                    {getNeighborhoodName(request.commune)}
                  </span>
                  <span className="rounded-full px-3 py-1 text-sm font-black" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>
                    {request.property_type ? TYPE_LABELS[request.property_type] ?? request.property_type : "Logement"}
                  </span>
                </div>
                <span className="rounded-full px-3 py-1 text-xs font-black uppercase" style={{
                  background: request.status === "active" ? "rgba(22,163,74,0.12)" : request.status === "removed" ? "rgba(220,38,38,0.12)" : "rgba(185,138,46,0.12)",
                  color: request.status === "active" ? "#16a34a" : request.status === "removed" ? "#dc2626" : "var(--accent-gold)",
                }}>
                  {request.status}
                </span>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-black uppercase tracking-wide text-[11px]" style={{ color: "var(--text-secondary)" }}>Budget</p>
                  <p className="text-lg font-black" style={{ color: "var(--text-primary)" }}>{request.max_budget ? formatPrice(request.max_budget) : "Non précisé"}</p>
                </div>
                <div>
                  <p className="font-black uppercase tracking-wide text-[11px]" style={{ color: "var(--text-secondary)" }}>Chambres</p>
                  <p className="text-lg font-black" style={{ color: "var(--text-primary)" }}>{request.rooms ?? "Flexible"}</p>
                </div>
                <div>
                  <p className="font-black uppercase tracking-wide text-[11px]" style={{ color: "var(--text-secondary)" }}>Date</p>
                  <p className="font-black" style={{ color: "var(--text-primary)" }}>{request.move_in_date ? new Date(request.move_in_date).toLocaleDateString("fr-FR") : "Dès que possible"}</p>
                </div>
                <div>
                  <p className="font-black uppercase tracking-wide text-[11px]" style={{ color: "var(--text-secondary)" }}>Contact</p>
                  <p className="font-black" style={{ color: "var(--text-primary)" }}>{request.phone || "Non fourni"}</p>
                </div>
              </div>

              {request.message && (
                <p className="mb-4 rounded-2xl p-3 text-sm font-bold leading-relaxed" style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
                  {request.message}
                </p>
              )}

              <div className="mb-4 flex flex-wrap gap-2 text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                <span className="inline-flex items-center gap-1"><UserRound className="h-3.5 w-3.5" /> {request.user_id.slice(0, 8)}</span>
                <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(request.created_at).toLocaleDateString("fr-FR")}</span>
                {request.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> WhatsApp</span>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => void setStatus(request.id, "closed")}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-2xl text-sm font-black"
                  style={{ background: "rgba(22,163,74,0.12)", border: "1px solid rgba(22,163,74,0.24)", color: "#16a34a" }}
                >
                  <CheckCircle className="h-4 w-4" />
                  Traitée
                </button>
                <button
                  type="button"
                  onClick={() => void remove(request.id)}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-2xl text-sm font-black"
                  style={{ background: "rgba(220,38,38,0.10)", border: "1px solid rgba(220,38,38,0.22)", color: "#dc2626" }}
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
