"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, X, MapPin, Home, DollarSign } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { formatPrice } from "@/lib/utils";
import { NEIGHBORHOODS } from "@/data/neighborhoods";

const TYPES = [
  { id: "apartment", label: "Appartement", emoji: "🏢" },
  { id: "house",     label: "Maison",      emoji: "🏠" },
  { id: "villa",     label: "Villa",       emoji: "🏡" },
  { id: "studio",    label: "Studio",      emoji: "🛏️" },
  { id: "room",      label: "Chambre",     emoji: "🚪" },
  { id: "land",      label: "Terrain",     emoji: "🌿" },
];

interface PropertyRequest {
  id: string;
  user_id: string | null;
  budget_min: number | null;
  budget_max: number | null;
  neighborhood: string | null;
  property_type: string | null;
  rooms: number | null;
  description: string | null;
  contact_phone: string | null;
  is_active: boolean;
  created_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
}

const NL: Record<string, string> = {
  kipe: "Kipé", lambanyi: "Lambanyi", ratoma: "Ratoma", sonfonia: "Sonfonia",
  cosa: "Cosa", hamdallaye: "Hamdallaye", nongo: "Nongo", taouyah: "Taouyah",
  dixinn: "Dixinn", matam: "Matam", madina: "Madina", kaloum: "Kaloum",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "à l'instant";
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(diff / 86_400_000);
  return `il y a ${d}j`;
}

export default function JeCharchePage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<PropertyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    budget_max: "",
    neighborhood: "",
    property_type: "",
    rooms: "",
    description: "",
    contact_phone: "",
  });

  // Pre-fill phone
  useEffect(() => {
    if (profile?.phone) setForm((f) => ({ ...f, contact_phone: profile.phone! }));
  }, [profile]);

  async function loadRequests() {
    if (!isSupabaseConfigured || !supabase) { setLoading(false); return; }
    const { data } = await supabase
      .from("property_requests")
      .select("*, profiles(full_name, avatar_url)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(50);
    setRequests((data ?? []) as unknown as PropertyRequest[]);
    setLoading(false);
  }

  useEffect(() => { loadRequests(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { router.push("/connexion?redirect=/je-cherche"); return; }
    if (!form.budget_max && !form.neighborhood && !form.property_type) {
      toast("Remplissez au moins un champ (budget, quartier ou type)", "error");
      return;
    }
    if (!isSupabaseConfigured || !supabase) return;
    setSubmitting(true);
    const { error } = await supabase.from("property_requests").insert({
      user_id:      user.id,
      budget_max:   form.budget_max ? Number(form.budget_max.replace(/\D/g, "")) : null,
      neighborhood: form.neighborhood || null,
      property_type: form.property_type || null,
      rooms:        form.rooms ? Number(form.rooms) : null,
      description:  form.description || null,
      contact_phone: form.contact_phone || null,
      is_active:    true,
    });
    setSubmitting(false);
    if (error) { toast("Erreur lors de la publication", "error"); return; }
    toast("✅ Recherche publiée !", "success");
    setShowForm(false);
    setForm({ budget_max: "", neighborhood: "", property_type: "", rooms: "", description: "", contact_phone: "" });
    loadRequests();
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "var(--bg-secondary)",
    border: "1px solid var(--border)",
    borderRadius: 12, padding: "12px 14px",
    color: "var(--text-primary)", fontSize: 14,
    outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 600,
    color: "var(--text-primary-dim)", marginBottom: 6,
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", paddingTop: 88, paddingBottom: 40 }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 16px" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontSize: 28, fontWeight: 800, color: "var(--text-primary)",
            fontFamily: "var(--font-display), sans-serif", marginBottom: 8,
          }}>
            Je cherche 🔍
          </h1>
          <p style={{ color: "var(--text-primary-faint)", fontSize: 15 }}>
            Décrivez ce que vous cherchez. Les propriétaires qui ont le bien vous contacteront directement.
          </p>
        </div>

        {/* Publish button */}
        {!showForm && (
          <button
            onClick={() => {
              if (!user) { router.push("/connexion?redirect=/je-cherche"); return; }
              setShowForm(true);
            }}
            style={{
              width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
              background: "#D4AF37", color: "#0B0F19",
              fontWeight: 700, fontSize: 15, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              marginBottom: 28,
            }}
          >
            <Plus style={{ width: 18, height: 18 }} />
            Publier ma recherche
          </button>
        )}

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit}
            style={{
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: 20, padding: 20, marginBottom: 28,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Nouvelle recherche</h2>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-primary-faint)" }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              {/* Budget max */}
              <div>
                <label style={labelStyle}>💰 Budget maximum (GNF)</label>
                <input
                  type="text" inputMode="numeric"
                  placeholder="Ex: 2 000 000"
                  value={form.budget_max}
                  onChange={(e) => setForm((f) => ({ ...f, budget_max: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              {/* Type */}
              <div>
                <label style={labelStyle}>🏠 Type de bien</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {TYPES.map((t) => (
                    <button key={t.id} type="button"
                      onClick={() => setForm((f) => ({ ...f, property_type: f.property_type === t.id ? "" : t.id }))}
                      style={{
                        padding: "7px 14px", borderRadius: 20, border: "1px solid",
                        fontSize: 13, fontWeight: 600, cursor: "pointer",
                        ...(form.property_type === t.id
                          ? { background: "rgba(212,175,55,0.15)", borderColor: "rgba(212,175,55,0.50)", color: "#D4AF37" }
                          : { background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary-faint)" }),
                      }}>
                      {t.emoji} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quartier */}
              <div>
                <label style={labelStyle}>📍 Quartier souhaité</label>
                <select
                  value={form.neighborhood}
                  onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
                  style={{ ...inputStyle, appearance: "none" }}
                >
                  <option value="">Tous les quartiers</option>
                  {NEIGHBORHOODS.map((n) => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
              </div>

              {/* Rooms */}
              <div>
                <label style={labelStyle}>🛏️ Nombre de chambres</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["", "1", "2", "3", "4", "5+"].map((r) => (
                    <button key={r} type="button"
                      onClick={() => setForm((f) => ({ ...f, rooms: r }))}
                      style={{
                        flex: 1, padding: "8px 0", borderRadius: 10, border: "1px solid",
                        fontSize: 13, fontWeight: 600, cursor: "pointer",
                        ...(form.rooms === r
                          ? { background: "rgba(212,175,55,0.15)", borderColor: "rgba(212,175,55,0.50)", color: "#D4AF37" }
                          : { background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary-faint)" }),
                      }}>
                      {r === "" ? "Peu importe" : r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>📝 Description (optionnel)</label>
                <textarea
                  placeholder="Décrivez votre besoin : étage, meublé, proche école…"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              {/* Phone */}
              <div>
                <label style={labelStyle}>📞 Téléphone de contact</label>
                <input
                  type="tel"
                  placeholder="+224 6XX XXX XXX"
                  value={form.contact_phone}
                  onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>

            <button
              type="submit" disabled={submitting}
              style={{
                marginTop: 16, width: "100%", padding: "13px 0",
                borderRadius: 12, border: "none",
                background: submitting ? "rgba(212,175,55,0.50)" : "#D4AF37",
                color: "#0B0F19", fontWeight: 700, fontSize: 15, cursor: "pointer",
              }}
            >
              {submitting ? "Publication…" : "Publier ma recherche"}
            </button>
          </form>
        )}

        {/* Requests list */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #D4AF37", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
            <p style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
              Aucune demande active
            </p>
            <p style={{ color: "var(--text-primary-faint)", fontSize: 14 }}>
              Soyez le premier à publier votre recherche !
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ color: "var(--text-primary-faint)", fontSize: 13, marginBottom: 4 }}>
              {requests.length} demande{requests.length > 1 ? "s" : ""} active{requests.length > 1 ? "s" : ""}
            </p>
            {requests.map((req) => (
              <div key={req.id} style={{
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: 16, padding: "16px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Type + quartier */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                      {req.property_type && (
                        <span style={{
                          background: "rgba(212,175,55,0.12)", color: "#D4AF37",
                          fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                          border: "1px solid rgba(212,175,55,0.30)",
                        }}>
                          {TYPES.find((t) => t.id === req.property_type)?.emoji}{" "}
                          {TYPES.find((t) => t.id === req.property_type)?.label ?? req.property_type}
                        </span>
                      )}
                      {req.neighborhood && (
                        <span style={{
                          background: "rgba(96,165,250,0.12)", color: "#60a5fa",
                          fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                          border: "1px solid rgba(96,165,250,0.25)",
                          display: "flex", alignItems: "center", gap: 4,
                        }}>
                          <MapPin style={{ width: 10, height: 10 }} />
                          {NL[req.neighborhood] ?? req.neighborhood}
                        </span>
                      )}
                      {req.rooms && (
                        <span style={{
                          background: "var(--bg-secondary)", color: "var(--text-primary-dim)",
                          fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                          border: "1px solid var(--border)",
                        }}>
                          🛏 {req.rooms} ch.
                        </span>
                      )}
                    </div>

                    {/* Budget */}
                    {req.budget_max && (
                      <p style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
                        Max {formatPrice(req.budget_max)}
                        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary-faint)", marginLeft: 4 }}>/mois</span>
                      </p>
                    )}

                    {/* Description */}
                    {req.description && (
                      <p style={{ fontSize: 13, color: "var(--text-primary-dim)", lineHeight: 1.5, marginBottom: 6 }}>
                        {req.description}
                      </p>
                    )}

                    <p style={{ fontSize: 11, color: "var(--text-primary-faint)" }}>
                      {req.profiles?.full_name ?? "Anonyme"} · {timeAgo(req.created_at)}
                    </p>
                  </div>

                  {/* Contact button */}
                  {req.contact_phone && (
                    <a
                      href={`https://wa.me/${req.contact_phone.replace(/\D/g, "")}?text=${encodeURIComponent("Bonjour, j'ai vu votre recherche sur LogerBien et j'ai un bien qui correspond.")}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "10px 14px", borderRadius: 12,
                        background: "rgba(37,211,102,0.12)", color: "#25D366",
                        border: "1px solid rgba(37,211,102,0.30)",
                        fontSize: 13, fontWeight: 700, textDecoration: "none",
                        flexShrink: 0,
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.555 4.118 1.528 5.845L0 24l6.338-1.505A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.892 0-3.667-.5-5.2-1.373l-.373-.22-3.863.917.976-3.77-.243-.387A9.938 9.938 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                      </svg>
                      Contacter
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
