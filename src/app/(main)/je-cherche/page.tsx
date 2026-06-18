"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bed, Bell, Building2, DoorOpen, FileText, Leaf, Phone, Search, Plus, X, MapPin, Home, DollarSign } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { formatPrice } from "@/lib/utils";
import { NEIGHBORHOODS } from "@/data/neighborhoods";

const TYPES = [
  { id: "apartment", label: "Appartement", Icon: Building2 },
  { id: "house",     label: "Maison",      Icon: Home },
  { id: "villa",     label: "Villa",       Icon: Home },
  { id: "studio",    label: "Studio",      Icon: Bed },
  { id: "room",      label: "Chambre",     Icon: DoorOpen },
  { id: "land",      label: "Terrain",     Icon: Leaf },
];

interface PropertyRequest {
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
    max_budget: "",
    commune: "",
    property_type: "",
    rooms: "",
    move_in_date: "",
    phone: "",
    message: "",
  });

  // Pre-fill phone
  useEffect(() => {
    if (profile?.phone) setForm((f) => ({ ...f, phone: profile.phone! }));
  }, [profile]);

  const loadRequests = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) { setLoading(false); return; }
    if (!user) { setRequests([]); setLoading(false); return; }
    const { data } = await supabase
      .from("housing_requests")
      .select("*")
      .eq("user_id", user.id)
      .neq("status", "removed")
      .order("created_at", { ascending: false })
      .limit(50);
    setRequests((data ?? []) as unknown as PropertyRequest[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { void loadRequests(); }, [loadRequests]);

  async function notifyMatchingOwners(requestId: string, commune: string, type: string | null, budget: number | null) {
    if (!supabase) return;
    const { data: owners } = await supabase
      .from("properties")
      .select("owner_id, neighborhood, city")
      .or(`neighborhood.eq.${commune},city.eq.${commune}`)
      .in("status", ["active", "pending"])
      .limit(40);

    const ownerIds = Array.from(new Set((owners ?? []).map((row) => row.owner_id).filter(Boolean)));
    if (ownerIds.length === 0) return;

    await supabase.from("housing_request_notifications").upsert(
      ownerIds.map((ownerId) => ({ request_id: requestId, owner_id: ownerId })),
      { onConflict: "request_id,owner_id", ignoreDuplicates: true },
    );

    await supabase.from("notifications").insert(
      ownerIds.map((ownerId) => ({
        user_id: ownerId,
        type: "housing_request",
        title: "Nouvelle demande de logement",
        body: `${NL[commune] ?? commune}${type ? ` · ${TYPES.find((t) => t.id === type)?.label ?? type}` : ""}${budget ? ` · max ${formatPrice(budget)}` : ""}`,
        data: { request_id: requestId, commune },
      })),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { router.push("/connexion?redirect=/je-cherche"); return; }
    if (!form.commune || !form.property_type || !form.max_budget || !form.phone) {
      toast("Commune, type, budget et téléphone sont obligatoires", "error");
      return;
    }
    if (!isSupabaseConfigured || !supabase) return;
    setSubmitting(true);
    const maxBudget = Number(form.max_budget.replace(/\D/g, ""));
    const { data, error } = await supabase.from("housing_requests").insert({
      user_id:      user.id,
      commune:      form.commune,
      property_type: form.property_type || null,
      rooms:        form.rooms ? Number(form.rooms) : null,
      max_budget:   Number.isFinite(maxBudget) ? maxBudget : null,
      move_in_date: form.move_in_date || null,
      phone:        form.phone || null,
      message:      form.message || null,
      status:       "active",
    }).select("id").single();
    setSubmitting(false);
    if (error) { toast("Erreur lors de la publication", "error"); return; }
    if (data?.id) void notifyMatchingOwners(data.id, form.commune, form.property_type || null, maxBudget || null);
    toast("Recherche publiée !", "success");
    setShowForm(false);
    setForm({ max_budget: "", commune: "", property_type: "", rooms: "", move_in_date: "", phone: profile?.phone ?? "", message: "" });
    void loadRequests();
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
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", paddingTop: 84, paddingBottom: 28 }}>
      <div style={{ width: "95%", maxWidth: 1600, margin: "0 auto", padding: "0 12px" }}>

        {/* Header */}
        <div style={{ marginBottom: 18 }}>
          <h1 style={{
            fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, color: "var(--text-primary)",
            fontFamily: "var(--font-display), sans-serif", marginBottom: 8,
          }}>
            <span className="inline-flex items-center gap-2">
              Je cherche
              <Search className="h-6 w-6" strokeWidth={2.4} />
            </span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 18, fontWeight: 800, maxWidth: 620 }}>
            Commune, type, budget. Les propriétaires peuvent vous contacter.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" style={{ marginBottom: 18 }}>
          {[
            { label: "Commune", value: form.commune ? (NL[form.commune] ?? form.commune) : "Choisir", Icon: MapPin },
            { label: "Type", value: form.property_type ? (TYPES.find((t) => t.id === form.property_type)?.label ?? "Choisi") : "Maison", Icon: Home },
            { label: "Budget", value: form.max_budget ? formatPrice(Number(form.max_budget.replace(/\D/g, ""))) : "Prix max", Icon: DollarSign },
            { label: "Alerte", value: "Créer", Icon: Bell },
          ].map(({ label, value, Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                if (!user) { router.push("/connexion?redirect=/je-cherche"); return; }
                setShowForm(true);
              }}
              className="text-left"
              style={{
                minHeight: 112,
                borderRadius: 22,
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                boxShadow: "var(--shadow-soft)",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Icon className="h-7 w-7 text-[var(--accent-gold)]" strokeWidth={2.4} />
              <span>
                <span className="block text-sm font-black" style={{ color: "var(--text-secondary)" }}>{label}</span>
                <span className="block text-lg font-black leading-tight">{value}</span>
              </span>
            </button>
          ))}
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
              background: "var(--accent-gold)", color: "var(--text-primary)",
              fontWeight: 700, fontSize: 15, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              marginBottom: 18,
            }}
          >
            <Plus style={{ width: 18, height: 18 }} />
            Créer une alerte
          </button>
        )}

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit}
            style={{
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: 24, padding: 20, marginBottom: 20,
              boxShadow: "var(--shadow-soft)",
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
                <label style={labelStyle}><DollarSign className="mr-1 inline h-3.5 w-3.5" />Budget maximum (GNF)</label>
                <input
                  type="text" inputMode="numeric"
                  placeholder="Ex: 2 000 000"
                  value={form.max_budget}
                  onChange={(e) => setForm((f) => ({ ...f, max_budget: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              {/* Type */}
              <div>
                <label style={labelStyle}><Home className="mr-1 inline h-3.5 w-3.5" />Type de bien</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {TYPES.map((t) => {
                    const Icon = t.Icon;
                    return (
                    <button key={t.id} type="button"
                      onClick={() => setForm((f) => ({ ...f, property_type: f.property_type === t.id ? "" : t.id }))}
                      style={{
                        padding: "7px 14px", borderRadius: 20, border: "1px solid",
                        fontSize: 13, fontWeight: 600, cursor: "pointer",
                        ...(form.property_type === t.id
                          ? { background: "rgba(212,175,55,0.15)", borderColor: "rgba(212,175,55,0.50)", color: "var(--accent-gold)" }
                          : { background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary-faint)" }),
                      }}>
                      <Icon className="mr-1 inline h-3.5 w-3.5" strokeWidth={2.4} />
                      {t.label}
                    </button>
                  )})}
                </div>
              </div>

              {/* Quartier */}
              <div>
                <label style={labelStyle}><MapPin className="mr-1 inline h-3.5 w-3.5" />Commune souhaitée</label>
                <select
                  value={form.commune}
                  onChange={(e) => setForm((f) => ({ ...f, commune: e.target.value }))}
                  style={{ ...inputStyle, appearance: "none" }}
                >
                  <option value="">Toutes les communes</option>
                  {NEIGHBORHOODS.map((n) => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
              </div>

              {/* Rooms */}
              <div>
                <label style={labelStyle}><Bed className="mr-1 inline h-3.5 w-3.5" />Nombre de chambres</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["", "1", "2", "3", "4", "5+"].map((r) => (
                    <button key={r} type="button"
                      onClick={() => setForm((f) => ({ ...f, rooms: r }))}
                      style={{
                        flex: 1, padding: "8px 0", borderRadius: 10, border: "1px solid",
                        fontSize: 13, fontWeight: 600, cursor: "pointer",
                        ...(form.rooms === r
                          ? { background: "rgba(212,175,55,0.15)", borderColor: "rgba(212,175,55,0.50)", color: "var(--accent-gold)" }
                          : { background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary-faint)" }),
                      }}>
                      {r === "" ? "Peu importe" : r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Move-in date */}
              <div>
                <label style={labelStyle}>Date souhaitée</label>
                <input
                  type="date"
                  value={form.move_in_date}
                  onChange={(e) => setForm((f) => ({ ...f, move_in_date: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              {/* Message */}
              <div>
                <label style={labelStyle}><FileText className="mr-1 inline h-3.5 w-3.5" />Message court (optionnel)</label>
                <textarea
                  placeholder="Ex : Je cherche une maison à Ratoma, budget 2M, 3 chambres."
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              {/* Phone */}
              <div>
                <label style={labelStyle}><Phone className="mr-1 inline h-3.5 w-3.5" />Téléphone de contact</label>
                <input
                  type="tel"
                  placeholder="+224 6XX XXX XXX"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>

            <button
              type="submit" disabled={submitting}
              style={{
                marginTop: 16, width: "100%", padding: "13px 0",
                borderRadius: 12, border: "none",
                background: submitting ? "rgba(212,175,55,0.50)" : "var(--accent-gold)",
                color: "var(--text-primary)", fontWeight: 700, fontSize: 15, cursor: "pointer",
              }}
            >
              {submitting ? "Publication…" : "Publier ma recherche"}
            </button>
          </form>
        )}

        {/* Requests list */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid var(--accent-gold)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : requests.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "36px 18px",
            borderRadius: 28,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-soft)",
          }}>
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[28px]" style={{ background: "rgba(185,138,46,0.14)" }}>
              <Search className="h-10 w-10 text-[var(--accent-gold)]" strokeWidth={2.2} />
            </div>
            <p style={{ color: "var(--text-primary)", fontWeight: 900, fontSize: 22, marginBottom: 8 }}>
              Aucune recherche active
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: 16, fontWeight: 700 }}>
              Choisissez une commune, un type et un budget.
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
                Mes recherches actives
              </h2>
              <p className="rounded-full px-3 py-1 text-sm font-black" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                {requests.length}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {requests.map((req) => (
              <div key={req.id} style={{
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: 22, padding: "18px", boxShadow: "var(--shadow-soft)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Type + quartier */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                      {req.property_type && (
                        (() => {
                          const type = TYPES.find((t) => t.id === req.property_type);
                          const Icon = type?.Icon ?? Home;
                          return (
                        <span style={{
                          background: "rgba(212,175,55,0.12)", color: "var(--accent-gold)",
                          fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                          border: "1px solid rgba(212,175,55,0.30)",
                          display: "inline-flex", alignItems: "center", gap: 4,
                        }}>
                          <Icon style={{ width: 12, height: 12 }} strokeWidth={2.4} />
                          {type?.label ?? req.property_type}
                        </span>
                          );
                        })()
                      )}
                      {req.commune && (
                        <span style={{
                          background: "rgba(96,165,250,0.12)", color: "#60a5fa",
                          fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                          border: "1px solid rgba(96,165,250,0.25)",
                          display: "flex", alignItems: "center", gap: 4,
                        }}>
                          <MapPin style={{ width: 10, height: 10 }} />
                          {NL[req.commune] ?? req.commune}
                        </span>
                      )}
                      {req.rooms && (
                        <span style={{
                          background: "var(--bg-secondary)", color: "var(--text-primary-dim)",
                          fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                          border: "1px solid var(--border)",
                          display: "inline-flex", alignItems: "center", gap: 4,
                        }}>
                          <Bed style={{ width: 12, height: 12 }} strokeWidth={2.4} />
                          {req.rooms} ch.
                        </span>
                      )}
                    </div>

                    {/* Budget */}
                    {req.max_budget && (
                      <p style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
                        Max {formatPrice(req.max_budget)}
                        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary-faint)", marginLeft: 4 }}>/mois</span>
                      </p>
                    )}

                    {/* Message */}
                    {req.message && (
                      <p style={{ fontSize: 13, color: "var(--text-primary-dim)", lineHeight: 1.5, marginBottom: 6 }}>
                        {req.message}
                      </p>
                    )}

                    <p style={{ fontSize: 11, color: "var(--text-primary-faint)" }}>
                      {req.move_in_date ? `Date souhaitée : ${new Date(req.move_in_date).toLocaleDateString("fr-FR")} · ` : ""}{timeAgo(req.created_at)}
                    </p>
                  </div>

                  {/* Contact button */}
                  {req.phone && (
                    <a
                      href={`https://wa.me/${req.phone.replace(/\D/g, "")}?text=${encodeURIComponent("Bonjour, j'ai vu votre recherche sur LogerBien et j'ai un bien qui correspond.")}`}
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
          </div>
        )}
      </div>
    </div>
  );
}
