"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Phone, Lock, Mail, User, Building, ArrowRight, CheckCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { erreurFrancais } from "@/lib/errors";

const USER_ROLES = [
  { value: "buyer",  label: "Je cherche un logement",    icon: "🔍", desc: "Je cherche à louer ou acheter" },
  { value: "owner",  label: "Je suis propriétaire",      icon: "🏠", desc: "Je loue mon propre logement" },
  { value: "agent",  label: "Je suis agent immobilier",  icon: "👔", desc: "Je suis agent professionnel" },
  { value: "agency", label: "J'ai une agence",           icon: "🏢", desc: "Je représente une agence immobilière" },
];

function roleToAccountType(role: string): string {
  switch (role) {
    case "buyer":  return "chercheur";
    case "owner":  return "proprietaire";
    case "agent":  return "agent";
    case "agency": return "agence";
    default:       return "chercheur";
  }
}

function InscriptionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/compte";
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", password: "",
    bio: "", agencyName: "",
  });

  function switchMode(next: "phone" | "email") {
    setMode(next);
    setError(null);
    setForm((f) => ({ ...f, phone: "", email: "" }));
  }

  const isAgentOrAgency = role === "agent" || role === "agency";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }

    setLoading(true);
    setError(null);

    if (isSupabaseConfigured && supabase) {
      const rawPhone = form.phone.replace(/[\s+\-()]/g, "");
      const normalized = rawPhone.startsWith("224") ? rawPhone : `224${rawPhone}`;
      // ⚠️  DO NOT rename @bienloger.gn → @logerbien.gn without a Supabase SQL migration.
      // This fake domain is stored permanently in auth.users. Changing it without migrating the DB
      // will lock out every existing phone-registered user (their email won't match anymore).
      const email = mode === "phone" ? `${normalized}@bienloger.gn` : form.email;

      // Vérification doublon téléphone
      if (mode === "phone") {
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("phone", form.phone.trim())
          .maybeSingle();
        if (existing) {
          setError("Ce numéro est déjà utilisé. Connectez-vous à la place.");
          setLoading(false);
          return;
        }
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            name: form.name,
            phone: mode === "phone" ? form.phone : "",
            role,
            account_type: roleToAccountType(role),
            bio: form.bio || null,
            agency_name: isAgentOrAgency ? (form.agencyName || null) : null,
          },
        },
      });

      if (signUpError) {
        setError(erreurFrancais(signUpError.message));
        setLoading(false);
        return;
      }

      // Forcer la connexion immédiate (bypass confirmation email)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: form.password,
      });

      if (signInError || !signInData.session) {
        setSuccess("Compte créé ! Connectez-vous maintenant.");
        setLoading(false);
        router.push(`/connexion?redirect=${encodeURIComponent(redirectTo)}`);
        return;
      }

      document.cookie = `LogerBien-auth=supabase-session; path=/; max-age=${60 * 60 * 24 * 30}`;
    } else {
      await new Promise((r) => setTimeout(r, 800));
      document.cookie = `LogerBien-auth=mock-session; path=/; max-age=${60 * 60 * 24 * 30}`;
    }

    setLoading(false);
    // After signup, redirect to onboarding unless a specific redirect was requested
    if (redirectTo === "/compte") {
      router.push("/onboarding");
    } else {
      router.push(redirectTo);
    }
  }

  const selectedRole = USER_ROLES.find((r) => r.value === role);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <div className="p-4 flex items-center justify-between">
        <Logo size="lg" />
        <Link href="/connexion" className="text-sm text-[#666666] hover:text-white transition-colors">
          Déjà un compte ? Se connecter
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8 justify-center">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  s < step  ? "bg-[#D4AF37] w-12"
                  : s === step ? "bg-[#D4AF37] w-16"
                  : "bg-[#2a3040] w-8"
                )}
              />
            ))}
          </div>

          <div className="rounded-3xl p-8" style={{ background: "var(--bl-surface)", border: "1px solid var(--color-border)", borderRadius: 24 }}>

            {/* ── STEP 1 — Profil ── */}
            {step === 1 && (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-black text-white">Créer un compte</h1>
                  <p className="text-[#666666] text-sm mt-1">Quel est votre profil ?</p>
                </div>

                <div className="space-y-3">
                  {USER_ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={cn(
                        "w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left",
                        role === r.value
                          ? "border-[#D4AF37] bg-[rgba(212,175,55,0.10)]"
                          : "hover:border-white/20"
                      )}
                      style={{
                        minHeight: 80,
                        borderColor: role === r.value ? "#D4AF37" : "#1e2a30",
                        background: role === r.value ? "rgba(212,175,55,0.10)" : "var(--bl-surface)",
                      }}
                    >
                      <span style={{ fontSize: 32, lineHeight: 1, flexShrink: 0 }}>{r.icon}</span>
                      <div className="flex-1">
                        <p className={cn("font-semibold text-sm", role === r.value ? "text-[#D4AF37]" : "text-white")}>
                          {r.label}
                        </p>
                        <p className="text-[#666666] text-xs mt-0.5">{r.desc}</p>
                      </div>
                      {role === r.value && <CheckCircle className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />}
                    </button>
                  ))}
                </div>

                <Button
                  onClick={() => role && setStep(2)}
                  disabled={!role}
                  variant="brand"
                  size="lg"
                  className="w-full mt-6"
                >
                  Continuer <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            )}

            {/* ── STEP 2 — Formulaire ── */}
            {step === 2 && (
              <>
                <div className="text-center mb-6">
                  <button
                    onClick={() => { setStep(1); setError(null); }}
                    className="text-[#666666] hover:text-white text-sm mb-2 flex items-center gap-1 mx-auto"
                  >
                    ← Retour
                  </button>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span style={{ fontSize: 20 }}>{selectedRole?.icon}</span>
                    <h1 className="text-xl font-black text-white">{selectedRole?.label}</h1>
                  </div>
                  <p className="text-[#666666] text-sm">Vos informations</p>
                </div>

                {/* Phone / Email toggle */}
                <div className="grid grid-cols-2 p-1 mb-4 rounded-xl" style={{ background: "var(--bg-primary)" }}>
                  {(["phone", "email"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => switchMode(m)}
                      className="py-2.5 text-sm font-bold rounded-lg transition-colors"
                      style={mode === m ? { background: "#D4AF37", color: "var(--bg-primary)" } : { color: "#666666" }}
                    >
                      {m === "phone" ? "📱 Téléphone" : "✉️ Email"}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Nom */}
                  <div>
                    <label className="block text-sm font-semibold text-[rgba(255,255,255,0.75)] mb-2">
                      {role === "agency" ? "Nom de l'agence" : "Votre nom complet"}
                    </label>
                    <div className="relative">
                      {role === "agency"
                        ? <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666] pointer-events-none" />
                        : <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666] pointer-events-none" />}
                      <input
                        type="text"
                        placeholder={role === "agency" ? "Conakry Premium Immo" : "Mamadou Diallo"}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm"
                        style={{ background: "var(--bl-surface-2)", border: "1px solid var(--color-border)" }}
                        required
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  {/* Nom de l'agence si agent */}
                  {isAgentOrAgency && (
                    <div>
                      <label className="block text-sm font-semibold text-[rgba(255,255,255,0.75)] mb-2">
                        {role === "agency" ? "Raison sociale" : "Agence de rattachement"}
                        <span className="text-white/30 font-normal ml-1">(optionnel)</span>
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666] pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Ex: Immo Guinée SARL"
                          value={form.agencyName}
                          onChange={(e) => setForm({ ...form, agencyName: e.target.value })}
                          className="w-full rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm"
                          style={{ background: "var(--bl-surface-2)", border: "1px solid var(--color-border)" }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Bio si agent/agence */}
                  {isAgentOrAgency && (
                    <div>
                      <label className="block text-sm font-semibold text-[rgba(255,255,255,0.75)] mb-2">
                        Bio courte
                        <span className="text-white/30 font-normal ml-1">(optionnel)</span>
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Ex: Spécialiste location Kipé &amp; Ratoma depuis 5 ans."
                        value={form.bio}
                        onChange={(e) => setForm({ ...form, bio: e.target.value })}
                        maxLength={200}
                        className="w-full rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm resize-none"
                        style={{ background: "var(--bl-surface-2)", border: "1px solid var(--color-border)" }}
                      />
                    </div>
                  )}

                  {/* Téléphone ou email */}
                  {mode === "phone" ? (
                    <div>
                      <label className="block text-sm font-semibold text-[rgba(255,255,255,0.75)] mb-2">
                        Numéro de téléphone
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666] pointer-events-none" />
                        <input
                          type="tel"
                          placeholder="Ex : 628 000 000"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="w-full rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm"
                          style={{ background: "var(--bl-surface-2)", border: "1px solid var(--color-border)" }}
                          required
                          autoComplete="tel"
                        />
                      </div>
                      <button type="button" onClick={() => switchMode("email")} className="text-xs text-[#D4AF37] hover:underline mt-1.5 block">
                        Utiliser mon email à la place →
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-semibold text-[rgba(255,255,255,0.75)] mb-2">
                        Adresse email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666] pointer-events-none" />
                        <input
                          type="email"
                          placeholder="vous@email.com"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm"
                          style={{ background: "var(--bl-surface-2)", border: "1px solid var(--color-border)" }}
                          required
                          autoComplete="email"
                        />
                      </div>
                      <button type="button" onClick={() => switchMode("phone")} className="text-xs text-[#D4AF37] hover:underline mt-1.5 block">
                        ← Utiliser mon numéro de téléphone
                      </button>
                    </div>
                  )}

                  {/* Mot de passe */}
                  <div>
                    <label className="block text-sm font-semibold text-[rgba(255,255,255,0.75)] mb-2">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666] pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="•••••••• (min. 8 caractères)"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full rounded-xl pl-10 pr-11 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                        style={{ background: "var(--border-subtle)", border: "1px solid rgba(255,255,255,0.10)", fontSize: 16 }}
                        required
                        minLength={8}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}
                  {success && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
                      <p className="text-[#D4AF37] text-sm">{success}</p>
                    </div>
                  )}

                  <Button type="submit" variant="brand" size="lg" loading={loading} className="w-full">
                    Créer mon compte <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>

                <p className="text-[#666666] text-xs text-center mt-4">
                  En créant un compte, vous acceptez nos{" "}
                  <Link href="/cgv" className="text-[#D4AF37] hover:underline">
                    conditions d&apos;utilisation
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InscriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-primary)]" />}>
      <InscriptionForm />
    </Suspense>
  );
}
