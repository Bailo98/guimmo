"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Check, X, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { NEIGHBORHOODS } from "@/data/neighborhoods";

// ─── Tokens ──────────────────────────────────────────────────────────────────
const SURFACE  = "#111a1f";
const BORDER   = "#1e2a30";
const TEXT_PRI = "#ffffff";
const TEXT_SEC = "rgba(255,255,255,0.55)";
const ACCENT   = "#E9E900";

const INPUT_STYLE: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`,
  color: TEXT_PRI, borderRadius: 10, height: 44, padding: "0 14px",
  fontSize: 13, outline: "none", boxSizing: "border-box",
};
const SELECT_STYLE: React.CSSProperties = { ...INPUT_STYLE, appearance: "none" as const };

function focusInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  (e.target as HTMLElement).style.borderColor = ACCENT;
}
function blurInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  (e.target as HTMLElement).style.borderColor = BORDER;
}

interface Agent {
  id: string;
  name: string;
  neighborhood: string;
  whatsapp: string;
  phone: string | null;
  description: string | null;
  is_active: boolean;
  listings_count: number;
  created_at: string;
}

const EMPTY: Omit<Agent, "id" | "created_at"> = {
  name: "", neighborhood: "", whatsapp: "", phone: "", description: "",
  is_active: true, listings_count: 0,
};

const COMMUNES = ["Ratoma", "Dixinn", "Matam", "Kaloum", "Matoto", "Coyah"];

function nbLabel(id: string) {
  return NEIGHBORHOODS.find((n) => n.id === id)?.name ?? id;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, color: TEXT_SEC, fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}

export default function AdminAgentsPage() {
  const [agents, setAgents]     = useState<Agent[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<Agent | null>(null);
  const [form, setForm]         = useState({ ...EMPTY });
  const [saving, setSaving]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Agent | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.from("agents").select("*").order("name");
    if (error) { toast("Erreur de chargement", "error"); }
    else { setAgents(data ?? []); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setEditing(null);
    setForm({ ...EMPTY });
    setShowForm(true);
  }

  function openEdit(a: Agent) {
    setEditing(a);
    setForm({
      name: a.name, neighborhood: a.neighborhood, whatsapp: a.whatsapp,
      phone: a.phone ?? "", description: a.description ?? "",
      is_active: a.is_active, listings_count: a.listings_count,
    });
    setShowForm(true);
  }

  async function saveAgent() {
    if (!supabase || !form.name || !form.neighborhood || !form.whatsapp) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(), neighborhood: form.neighborhood,
      whatsapp: form.whatsapp.trim(), phone: form.phone?.trim() || null,
      description: form.description?.trim() || null,
      is_active: form.is_active, listings_count: Number(form.listings_count) || 0,
    };
    if (editing) {
      const { error } = await supabase.from("agents").update(payload).eq("id", editing.id);
      if (error) { toast("Erreur lors de la mise à jour", "error"); }
      else {
        toast("Agent mis à jour avec succès", "success");
        setShowForm(false);
        await load();
      }
    } else {
      const { error } = await supabase.from("agents").insert(payload);
      if (error) { toast("Erreur lors de l'ajout", "error"); }
      else {
        toast("Agent ajouté avec succès", "success");
        setShowForm(false);
        await load();
      }
    }
    setSaving(false);
  }

  async function toggleActive(a: Agent) {
    if (!supabase) return;
    const { error } = await supabase.from("agents").update({ is_active: !a.is_active }).eq("id", a.id);
    if (!error) setAgents((prev) => prev.map((x) => x.id === a.id ? { ...x, is_active: !a.is_active } : x));
  }

  async function deleteAgent(a: Agent) {
    if (!supabase) return;
    setDeleteTarget(null);
    const { error } = await supabase.from("agents").delete().eq("id", a.id);
    if (error) { toast("Erreur", "error"); }
    else {
      setAgents((prev) => prev.filter((x) => x.id !== a.id));
      toast("Agent supprimé", "success");
    }
  }

  const canSave = !!form.name && !!form.neighborhood && !!form.whatsapp;

  return (
    <div style={{ padding: "28px 24px 40px", maxWidth: 1200 }} className="px-4 md:px-6">

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "nowrap", width: "100%", gap: 16, marginBottom: 16 }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ color: TEXT_PRI, fontWeight: 900, fontSize: "clamp(20px,4vw,26px)", margin: 0 }}>Agents BienLoger</h1>
          <p style={{ color: TEXT_SEC, fontSize: 13, marginTop: 2 }}>
            {loading ? "Chargement…" : `${agents.length} agent(s)`}
          </p>
        </div>
        <div
          onClick={openNew}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && openNew()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: 10,
            background: "#E9E900",
            color: "#0A1216",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            flexShrink: 0,
            whiteSpace: "nowrap",
            userSelect: "none",
            WebkitTextFillColor: "#0A1216",
          }}
        >
          <Plus size={15} color="#0A1216" /> Ajouter un agent
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <h2 style={{ color: TEXT_PRI, fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
            {editing ? "Modifier l'agent" : "Nouvel agent"}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginBottom: 12 }}>
            <Field label="Nom *">
              <input aria-label="Nom de l'agent" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Mamadou Diallo"
                style={INPUT_STYLE} onFocus={focusInput} onBlur={blurInput} />
            </Field>
            <Field label="WhatsApp *">
              <input aria-label="Numéro WhatsApp" value={form.whatsapp}
                onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                placeholder="+224 6XX XXX XXX"
                style={INPUT_STYLE} onFocus={focusInput} onBlur={blurInput} />
            </Field>
            <Field label="Téléphone">
              <input aria-label="Numéro de téléphone" value={form.phone ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+224 6XX XXX XXX"
                style={INPUT_STYLE} onFocus={focusInput} onBlur={blurInput} />
            </Field>
            <Field label="Quartier *">
              <select aria-label="Quartier de l'agent" value={form.neighborhood}
                onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
                style={SELECT_STYLE} onFocus={focusInput} onBlur={blurInput}>
                <option value="">— Choisir —</option>
                {COMMUNES.map((c) => (
                  <optgroup key={c} label={c}>
                    {NEIGHBORHOODS.filter((n) => n.commune === c).map((n) => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
            <Field label="Nb annonces">
              <input aria-label="Nombre d'annonces" type="number" min={0} value={form.listings_count}
                onChange={(e) => setForm((f) => ({ ...f, listings_count: Number(e.target.value) }))}
                style={INPUT_STYLE} onFocus={focusInput} onBlur={blurInput} />
            </Field>
            <Field label="Statut">
              <button type="button" onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                style={{
                  display: "flex", alignItems: "center", gap: 8, height: 44,
                  padding: "0 14px", borderRadius: 10, fontSize: 13, fontWeight: 500,
                  border: `1px solid ${form.is_active ? "#E9E900" : BORDER}`,
                  background: form.is_active ? "rgba(233,233,0,0.10)" : "transparent",
                  color: form.is_active ? "#E9E900" : TEXT_SEC, cursor: "pointer",
                }}>
                {form.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                {form.is_active ? "Actif" : "Inactif"}
              </button>
            </Field>
          </div>
          <Field label="Description">
            <textarea aria-label="Description de l'agent" value={form.description ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2} placeholder="Spécialiste location…"
              style={{ ...INPUT_STYLE, height: "auto", padding: "10px 14px", resize: "none", marginBottom: 16 }}
              onFocus={focusInput} onBlur={blurInput} />
          </Field>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setShowForm(false)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "transparent", color: TEXT_PRI, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <X size={14} /> Annuler
            </button>
            <button onClick={saveAgent} disabled={!canSave || saving}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, border: "none", background: canSave && !saving ? ACCENT : "rgba(249,115,22,0.4)", color: "white", fontSize: 13, fontWeight: 700, cursor: canSave && !saving ? "pointer" : "not-allowed" }}>
              {saving ? <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : <Check size={14} />}
              {editing ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid #E9E900", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        </div>
      )}

      {/* Empty */}
      {!loading && agents.length === 0 && (
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 48, textAlign: "center" }}>
          <p style={{ color: TEXT_SEC, fontSize: 14 }}>Aucun agent. Cliquez sur Ajouter.</p>
        </div>
      )}

      {/* Table */}
      {!loading && agents.length > 0 && (
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 640, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {["Nom", "Quartier", "WhatsApp", "Annonces", "Statut", "Actions"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: TEXT_SEC, textTransform: "uppercase", letterSpacing: "1px", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agents.map((a, i) => (
                  <tr key={a.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${BORDER}` }}>
                    <td style={{ padding: "12px 16px" }}>
                      <p style={{ color: TEXT_PRI, fontWeight: 600, fontSize: 13 }}>{a.name}</p>
                      {a.description && <p style={{ color: TEXT_SEC, fontSize: 11, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{a.description}</p>}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: TEXT_SEC, whiteSpace: "nowrap" }}>{nbLabel(a.neighborhood)}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: TEXT_SEC, whiteSpace: "nowrap" }}>{a.whatsapp}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: TEXT_SEC, textAlign: "center" }}>{a.listings_count}</td>
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <button onClick={() => toggleActive(a)} title={a.is_active ? "Désactiver" : "Activer"}
                        style={{
                          display: "flex", alignItems: "center", gap: 4,
                          padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                          border: "none", cursor: "pointer",
                          background: a.is_active ? "rgba(233,233,0,0.12)" : "rgba(255,255,255,0.06)",
                          color: a.is_active ? "#E9E900" : TEXT_SEC,
                        }}>
                        {a.is_active ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                        {a.is_active ? "Actif" : "Inactif"}
                      </button>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => openEdit(a)} title="Modifier"
                          style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: TEXT_SEC, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setDeleteTarget(a)} title="Supprimer"
                          style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setDeleteTarget(null)}
        >
          <div style={{ background: "#111a1f", border: "1px solid rgba(239,68,68,0.35)", borderRadius: 16, padding: 24, maxWidth: 340, width: "100%" }}
            onClick={(e) => e.stopPropagation()}>
            <p style={{ color: TEXT_PRI, fontWeight: 700, marginBottom: 6 }}>Supprimer {deleteTarget.name} ?</p>
            <p style={{ color: "#ef4444", fontSize: 12, marginBottom: 20 }}>Cette action est irréversible.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteTarget(null)}
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${BORDER}`, background: "transparent", color: TEXT_PRI, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                Annuler
              </button>
              <button onClick={() => deleteAgent(deleteTarget)}
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "#ef4444", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
