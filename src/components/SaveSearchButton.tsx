"use client";
import { useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/lib/toast";
import { AuthPromptModal } from "@/components/AuthPromptModal";

interface Props {
  neighborhood?: string;
  type?: string;
  transactionType?: string;
  priceMin?: number;
  priceMax?: number;
}

function buildLabel(p: Props): string {
  const parts: string[] = [];
  if (p.transactionType === "rent") parts.push("Location");
  else if (p.transactionType === "sale") parts.push("Vente");
  if (p.neighborhood) parts.push(p.neighborhood);
  if (p.type) parts.push(p.type);
  if (p.priceMin) parts.push(`≥${p.priceMin / 1_000_000}M`);
  if (p.priceMax && p.priceMax < Infinity) parts.push(`≤${p.priceMax / 1_000_000}M`);
  return parts.length > 0 ? parts.join(" · ") : "Toutes annonces";
}

export function SaveSearchButton(props: Props) {
  const { user } = useAuth();
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  async function handleSave() {
    if (!user) { setShowAuth(true); return; }
    if (!supabase) return;
    setSaving(true);
    const label = buildLabel(props);
    const { error } = await supabase.from("saved_searches").insert({
      user_id:          user.id,
      label,
      neighborhood:     props.neighborhood || null,
      type:             props.type || null,
      transaction_type: props.transactionType || null,
      price_min:        props.priceMin && props.priceMin > 0 ? props.priceMin : null,
      price_max:        props.priceMax && props.priceMax < Infinity ? props.priceMax : null,
    });
    if (error) { toast(`Erreur : ${error.message}`, "error"); }
    else { setSaved(true); toast("✅ Recherche sauvegardée — alerte activée", "success"); }
    setSaving(false);
  }

  return (
    <>
      <button
        onClick={saved ? undefined : handleSave}
        disabled={saving || saved}
        style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "9px 16px", borderRadius: 10,
          border: saved ? "1px solid rgba(110,201,122,0.30)" : "1px solid rgba(200,144,30,0.30)",
          background: saved ? "rgba(110,201,122,0.08)" : "rgba(200,144,30,0.08)",
          color: saved ? "#6ec97a" : "#daa84a",
          fontWeight: 700, fontSize: 13, cursor: saved ? "default" : "pointer",
          opacity: saving ? 0.7 : 1, transition: "opacity 0.15s",
          whiteSpace: "nowrap",
        }}
      >
        {saving ? (
          <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} />
        ) : saved ? (
          <Bell size={15} />
        ) : (
          <BellOff size={15} />
        )}
        {saved ? "Alerte activée" : "Sauvegarder la recherche"}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </button>
      {showAuth && (
        <AuthPromptModal
          onClose={() => setShowAuth(false)}
          redirectUrl="/compte"
          action="sauvegarder cette recherche"
        />
      )}
    </>
  );
}
