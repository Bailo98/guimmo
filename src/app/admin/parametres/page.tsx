"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";

export default function AdminParametresPage() {
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }
      const { data } = await supabase.from("site_config").select("key, value");
      if (data) {
        const wa = data.find((r) => r.key === "whatsapp_support");
        if (wa) setWhatsapp(wa.value);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function save() {
    if (!supabase) return;
    setSaving(true);
    const { error } = await supabase.from("site_config").upsert({
      key: "whatsapp_support",
      value: whatsapp,
      updated_at: new Date().toISOString(),
    });
    if (error) toast("Erreur lors de la sauvegarde", "error");
    else toast("Configuration sauvegardée", "success");
    setSaving(false);
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Paramètres</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Configuration de la plateforme</p>
      </div>

      <div className="bg-[var(--bg-card-light)] rounded-2xl p-5 border border-[var(--border)] space-y-4">
        <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Contact WhatsApp support</h2>
        {loading ? (
          <div className="h-10 bg-slate-100 dark:bg-[#151922] rounded-xl animate-pulse" />
        ) : (
          <>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">
                Numéro WhatsApp (avec indicatif, ex: 224628222510)
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="224628222510"
                className="w-full bg-[var(--bg-card-light)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
            </div>
            <button
              onClick={save}
              disabled={saving}
              className="w-full bg-[#D4AF37] text-white font-bold py-2.5 rounded-xl hover:bg-[#B8963A] transition-colors text-sm disabled:opacity-60"
            >
              {saving ? "Sauvegarde…" : "Enregistrer"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
