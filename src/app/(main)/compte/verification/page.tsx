"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Camera, CheckCircle2, FileText, Loader2, Phone, ShieldCheck, Upload, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";

type VerificationRequest = {
  id: string;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  created_at: string;
};

const FIELD =
  "w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-base font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-gold)]/45";

export default function OwnerVerificationPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [current, setCurrent] = useState<VerificationRequest | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [documentType, setDocumentType] = useState("id_card");
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/connexion?redirect=/compte/verification");
  }, [loading, router, user]);

  useEffect(() => {
    if (!user || !supabase) return;
    const client = supabase;
    const id = window.setTimeout(() => {
      setFullName(profile?.full_name ?? "");
      setPhone(profile?.phone ?? "");
      client
        .from("owner_verification_requests")
        .select("id,status,admin_note,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => setCurrent(data as VerificationRequest | null));
    }, 0);
    return () => window.clearTimeout(id);
  }, [profile?.full_name, profile?.phone, user]);

  async function uploadFile(file: File, kind: "document" | "selfie") {
    if (!supabase || !user) throw new Error("Non connecté");
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("owner-verification-documents")
      .upload(path, file, { upsert: false });
    if (error) throw error;
    return path;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !user || !documentFile) return;
    setSubmitting(true);
    try {
      const documentPath = await uploadFile(documentFile, "document");
      const selfiePath = selfieFile ? await uploadFile(selfieFile, "selfie") : null;
      const { error } = await supabase.from("owner_verification_requests").insert({
        user_id: user.id,
        full_name: fullName.trim(),
        phone: phone.trim(),
        document_type: documentType,
        document_number: documentNumber.trim(),
        document_path: documentPath,
        selfie_path: selfiePath,
      });
      if (error) throw error;
      toast("Demande envoyée", "success");
      setCurrent({ id: "local", status: "pending", admin_note: null, created_at: new Date().toISOString() });
    } catch (error) {
      console.error("owner verification submit:", error);
      toast("Impossible d'envoyer la demande", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-gold)]" />
      </div>
    );
  }

  const status = current?.status;

  return (
    <main className="mx-auto w-[95vw] max-w-3xl py-5 md:py-8">
      <Link href="/compte" className="mb-4 inline-flex items-center gap-2 text-sm font-black text-[var(--text-secondary)]">
        <ArrowLeft className="h-4 w-4" />
        Retour au compte
      </Link>

      <section className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm md:p-7">
        <div className="mb-5 flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-gold)] text-[var(--bg-primary)]">
            <ShieldCheck className="h-7 w-7" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[var(--text-primary)] md:text-3xl">Vérifier mon compte</h1>
            <p className="mt-1 text-base font-semibold text-[var(--text-secondary)]">
              Envoyez une pièce d’identité. Les documents restent privés.
            </p>
          </div>
        </div>

        {status && (
          <div
            className="mb-5 rounded-2xl border px-4 py-3 text-sm font-black"
            style={{
              background: status === "approved" ? "rgba(34,197,94,0.10)" : status === "rejected" ? "rgba(239,68,68,0.10)" : "rgba(185,138,46,0.12)",
              borderColor: status === "approved" ? "rgba(34,197,94,0.28)" : status === "rejected" ? "rgba(239,68,68,0.28)" : "rgba(185,138,46,0.28)",
              color: status === "approved" ? "#15803d" : status === "rejected" ? "#dc2626" : "var(--accent-gold)",
            }}
          >
            {status === "approved" && <span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4" /> Compte vérifié</span>}
            {status === "pending" && <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Demande en attente</span>}
            {status === "rejected" && <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4" /> Demande refusée</span>}
            {current?.admin_note && <p className="mt-2 font-semibold text-[var(--text-secondary)]">{current.admin_note}</p>}
          </div>
        )}

        {status !== "approved" && status !== "pending" && (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="flex items-center gap-2 text-sm font-black text-[var(--text-primary)]"><User className="h-4 w-4" /> Nom complet</span>
                <input className={FIELD} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </label>
              <label className="space-y-2">
                <span className="flex items-center gap-2 text-sm font-black text-[var(--text-primary)]"><Phone className="h-4 w-4" /> Téléphone</span>
                <input className={FIELD} value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="flex items-center gap-2 text-sm font-black text-[var(--text-primary)]"><FileText className="h-4 w-4" /> Type de pièce</span>
                <select className={FIELD} value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
                  <option value="id_card">Carte d’identité</option>
                  <option value="passport">Passeport</option>
                  <option value="driver_license">Permis</option>
                  <option value="other">Autre</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="flex items-center gap-2 text-sm font-black text-[var(--text-primary)]"><FileText className="h-4 w-4" /> Numéro de pièce</span>
                <input className={FIELD} value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} required />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-secondary)] p-4">
                <span className="mb-3 flex items-center gap-2 text-sm font-black text-[var(--text-primary)]"><Upload className="h-4 w-4" /> Photo pièce ID</span>
                <input type="file" accept="image/*,.pdf" onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)} required className="text-sm text-[var(--text-secondary)]" />
              </label>
              <label className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-secondary)] p-4">
                <span className="mb-3 flex items-center gap-2 text-sm font-black text-[var(--text-primary)]"><Camera className="h-4 w-4" /> Selfie optionnel</span>
                <input type="file" accept="image/*" onChange={(e) => setSelfieFile(e.target.files?.[0] ?? null)} className="text-sm text-[var(--text-secondary)]" />
              </label>
            </div>
            <button
              type="submit"
              disabled={submitting || !documentFile}
              className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent-gold)] text-base font-black text-[var(--bg-primary)] disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
              Envoyer la demande
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
