"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, ExternalLink, FileText, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";

type VerificationRow = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  document_type: string;
  document_number: string;
  document_path: string;
  selfie_path: string | null;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  created_at: string;
};

export default function AdminVerificationsPage() {
  const [rows, setRows] = useState<VerificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function load() {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("owner_verification_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("admin verifications load:", error);
      toast("Impossible de charger les demandes", "error");
    } else {
      setRows((data ?? []) as VerificationRow[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  async function openDocument(path: string) {
    if (!supabase) return;
    const { data, error } = await supabase.storage
      .from("owner-verification-documents")
      .createSignedUrl(path, 60);
    if (error || !data?.signedUrl) {
      toast("Document inaccessible", "error");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  async function review(row: VerificationRow, status: "approved" | "rejected") {
    if (!supabase) return;
    setBusyId(row.id);
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("owner_verification_requests")
      .update({
        status,
        admin_note: notes[row.id] || null,
        reviewed_by: auth.user?.id ?? null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (!error && status === "approved") {
      await supabase
        .from("profiles")
        .update({ is_verified: true, is_verified_pro: true })
        .eq("id", row.user_id);
    }

    setBusyId(null);
    if (error) {
      console.error("admin verification review:", error);
      toast("Action impossible", "error");
      return;
    }
    toast(status === "approved" ? "Compte approuvé" : "Demande refusée", "success");
    await load();
  }

  return (
    <main className="admin-page">
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)] md:text-3xl">Vérifications propriétaire</h1>
          <p className="text-sm font-semibold text-[var(--text-secondary)]">Documents privés, accès admin uniquement.</p>
        </div>
        <button onClick={load} className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-black text-[var(--text-primary)]">
          Actualiser
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-gold)]" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border)] p-12 text-center">
          <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-[var(--accent-gold)]" />
          <p className="font-black text-[var(--text-primary)]">Aucune demande</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {rows.map((row) => (
            <article key={row.id} className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
              <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black text-[var(--text-primary)]">{row.full_name}</h2>
                    <span className="rounded-full px-3 py-1 text-xs font-black" style={{
                      background: row.status === "approved" ? "rgba(34,197,94,0.12)" : row.status === "rejected" ? "rgba(239,68,68,0.12)" : "rgba(185,138,46,0.14)",
                      color: row.status === "approved" ? "#15803d" : row.status === "rejected" ? "#dc2626" : "var(--accent-gold)",
                    }}>
                      {row.status === "approved" ? "Approuvé" : row.status === "rejected" ? "Refusé" : "En attente"}
                    </span>
                  </div>
                  <div className="grid gap-2 text-sm font-semibold text-[var(--text-secondary)] md:grid-cols-2">
                    <p>Téléphone : <span className="text-[var(--text-primary)]">{row.phone}</span></p>
                    <p>Pièce : <span className="text-[var(--text-primary)]">{row.document_type}</span></p>
                    <p>Numéro : <span className="text-[var(--text-primary)]">{row.document_number}</span></p>
                    <p>Créée : <span className="text-[var(--text-primary)]">{new Date(row.created_at).toLocaleDateString("fr-FR")}</span></p>
                  </div>
                  {row.admin_note && <p className="mt-3 rounded-xl bg-[var(--bg-secondary)] px-3 py-2 text-sm font-semibold text-[var(--text-secondary)]">{row.admin_note}</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => openDocument(row.document_path)} className="inline-flex items-center gap-2 rounded-xl bg-[var(--bg-secondary)] px-4 py-2 text-sm font-black text-[var(--text-primary)]">
                      <FileText className="h-4 w-4" /> Voir pièce <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                    {row.selfie_path && (
                      <button onClick={() => openDocument(row.selfie_path!)} className="inline-flex items-center gap-2 rounded-xl bg-[var(--bg-secondary)] px-4 py-2 text-sm font-black text-[var(--text-primary)]">
                        <FileText className="h-4 w-4" /> Voir selfie <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <textarea
                    value={notes[row.id] ?? row.admin_note ?? ""}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [row.id]: e.target.value }))}
                    placeholder="Note admin"
                    className="min-h-24 w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-gold)]/40"
                  />
                  <button
                    onClick={() => review(row, "approved")}
                    disabled={busyId === row.id}
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent-gold)] text-sm font-black text-[var(--bg-primary)] disabled:opacity-60"
                  >
                    <BadgeCheck className="h-4 w-4" /> Approuver
                  </button>
                  <button
                    onClick={() => review(row, "rejected")}
                    disabled={busyId === row.id}
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 text-sm font-black text-red-600 disabled:opacity-60"
                  >
                    <XCircle className="h-4 w-4" /> Refuser
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
