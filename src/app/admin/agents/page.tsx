"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Check, X, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { NEIGHBORHOODS } from "@/data/neighborhoods";

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
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .order("name");
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
      name: form.name.trim(),
      neighborhood: form.neighborhood,
      whatsapp: form.whatsapp.trim(),
      phone: form.phone?.trim() || null,
      description: form.description?.trim() || null,
      is_active: form.is_active,
      listings_count: Number(form.listings_count) || 0,
    };
    if (editing) {
      const { error } = await supabase.from("agents").update(payload).eq("id", editing.id);
      if (error) { toast("Erreur", "error"); }
      else {
        setAgents((prev) => prev.map((a) => a.id === editing.id ? { ...a, ...payload } : a));
        toast("✅ Agent mis à jour", "success");
        setShowForm(false);
      }
    } else {
      const { data, error } = await supabase.from("agents").insert(payload).select().single();
      if (error) { toast("Erreur", "error"); }
      else {
        setAgents((prev) => [...prev, data as Agent]);
        toast("✅ Agent ajouté", "success");
        setShowForm(false);
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
      toast("✅ Agent supprimé", "success");
    }
  }

  const canSave = !!form.name && !!form.neighborhood && !!form.whatsapp;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Agents GuImmo</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {loading ? "Chargement…" : `${agents.length} agent(s)`}
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl bg-[#c8901e] hover:bg-[#b87c18] text-white transition-colors"
        >
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-[#1e2430] rounded-2xl border border-slate-200 dark:border-[#2a3040] p-5 space-y-4">
          <h2 className="font-bold text-slate-900 dark:text-white text-base">
            {editing ? "Modifier l'agent" : "Nouvel agent"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="agent-name" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Nom *</label>
              <input id="agent-name" aria-label="Nom de l'agent" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Mamadou Diallo"
                className="w-full bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-3 py-2.5 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F97316]" />
            </div>
            <div className="space-y-1">
              <label htmlFor="agent-whatsapp" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">WhatsApp *</label>
              <input id="agent-whatsapp" aria-label="Numéro WhatsApp" value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                placeholder="+224 6XX XXX XXX"
                className="w-full bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-3 py-2.5 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F97316]" />
            </div>
            <div className="space-y-1">
              <label htmlFor="agent-phone" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Téléphone</label>
              <input id="agent-phone" aria-label="Numéro de téléphone" value={form.phone ?? ""} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+224 6XX XXX XXX"
                className="w-full bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-3 py-2.5 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F97316]" />
            </div>
            <div className="space-y-1">
              <label htmlFor="agent-nb" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Quartier *</label>
              <select id="agent-nb" aria-label="Quartier de l'agent" value={form.neighborhood} onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-3 py-2.5 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F97316] appearance-none">
                <option value="">— Choisir —</option>
                {COMMUNES.map((c) => (
                  <optgroup key={c} label={c}>
                    {NEIGHBORHOODS.filter((n) => n.commune === c).map((n) => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="agent-listings" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Nb annonces</label>
              <input id="agent-listings" aria-label="Nombre d'annonces" type="number" min={0} value={form.listings_count}
                onChange={(e) => setForm((f) => ({ ...f, listings_count: Number(e.target.value) }))}
                className="w-full bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-3 py-2.5 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F97316]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Actif</label>
              <button type="button" onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${form.is_active ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400" : "bg-slate-50 dark:bg-[#151922] border-slate-200 dark:border-[#2a3040] text-slate-500"}`}>
                {form.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                {form.is_active ? "Actif" : "Inactif"}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="agent-desc" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Description</label>
            <textarea id="agent-desc" aria-label="Description de l'agent" value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2} placeholder="Spécialiste location…"
              className="w-full bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-3 py-2.5 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F97316] resize-none" />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2a3040] text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-[#2a3040]">
              <X className="w-4 h-4" /> Annuler
            </button>
            <button onClick={saveAgent} disabled={!canSave || saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#c8901e] hover:bg-[#b87c18] text-white text-sm font-bold disabled:opacity-40 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {editing ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : agents.length === 0 ? (
        <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-12 border border-slate-100 dark:border-[#2a3040] text-center">
          <p className="text-slate-400 text-sm">Aucun agent. Cliquez sur Ajouter.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1e2430] rounded-2xl border border-slate-100 dark:border-[#2a3040] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#2a3040]">
                  {["Nom", "Quartier", "WhatsApp", "Annonces", "Statut", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-[#2a3040]">
                {agents.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-[#151922] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{a.name}</p>
                      {a.description && <p className="text-xs text-slate-400 line-clamp-1">{a.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {nbLabel(a.neighborhood)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {a.whatsapp}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 text-center">
                      {a.listings_count}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => toggleActive(a)}
                        title={a.is_active ? "Désactiver" : "Activer"}
                        className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 transition-colors ${a.is_active ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" : "bg-slate-100 dark:bg-[#2a3040] text-slate-400"}`}
                      >
                        {a.is_active ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                        {a.is_active ? "Actif" : "Inactif"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(a)} title="Modifier"
                          className="w-7 h-7 rounded-lg border border-slate-200 dark:border-[#2a3040] text-slate-400 hover:border-[#F97316] hover:text-[#F97316] flex items-center justify-center transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(a)} title="Supprimer"
                          className="w-7 h-7 rounded-lg border border-slate-200 dark:border-[#2a3040] text-slate-400 hover:border-red-300 hover:text-red-500 flex items-center justify-center transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-6 max-w-sm w-full border border-red-200 dark:border-red-900/40">
            <p className="font-bold text-slate-900 dark:text-white mb-1">Supprimer {deleteTarget.name} ?</p>
            <p className="text-xs text-red-500 mb-5">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-[#2a3040] text-slate-600 dark:text-slate-300 text-sm font-semibold">
                Annuler
              </button>
              <button onClick={() => deleteAgent(deleteTarget)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
