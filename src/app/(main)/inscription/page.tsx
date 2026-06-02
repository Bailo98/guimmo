"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Phone, Lock, Mail, User, Building, ArrowRight, CheckCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
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

/* ─────────────────────────────────────────────
   Shared input style — rgba-based so it stays
   white-on-dark in both themes.
───────────────────────────────────────────── */
const INPUT: React.CSSProperties = {
  width: "100%",
  paddingLeft: 40,
  paddingRight: 16,
  paddingTop: 12,
  paddingBottom: 12,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 12,
  color: "rgba(255,255,255,1)",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const LABEL: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "rgba(255,255,255,0.70)",
  marginBottom: 8,
};

/* Left-column stats */
const STATS = [
  { val: "500+",  label: "Annonces actives"  },
  { val: "10",    label: "Quartiers couverts" },
  { val: "100%",  label: "Direct proprio"    },
];

function InscriptionForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirectTo   = searchParams.get("redirect") ?? "/compte";

  const [step, setStep]               = useState(1);
  const [mode, setMode]               = useState<"phone" | "email">("phone");
  const [role, setRole]               = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [success, setSuccess]         = useState<string | null>(null);
  const [form, setForm]               = useState({
    name: "", phone: "", email: "", password: "",
    bio: "", agencyName: "",
  });

  function switchMode(next: "phone" | "email") {
    setMode(next);
    setError(null);
    setForm((f) => ({ ...f, phone: "", email: "" }));
  }

  const isAgentOrAgency = role === "agent" || role === "agency";
  const selectedRole    = USER_ROLES.find((r) => r.value === role);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }

    setLoading(true);
    setError(null);

    if (isSupabaseConfigured && supabase) {
      const rawPhone   = form.phone.replace(/[\s+\-()]/g, "");
      const normalized = rawPhone.startsWith("224") ? rawPhone : `224${rawPhone}`;
      // ⚠️  DO NOT rename @bienloger.gn → @logerbien.gn without a Supabase SQL migration.
      // This fake domain is stored permanently in auth.users. Changing it without migrating the DB
      // will lock out every existing phone-registered user (their email won't match anymore).
      const email = mode === "phone" ? `${normalized}@bienloger.gn` : form.email;

      /* Vérification doublon téléphone */
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
            name:         form.name,
            phone:        mode === "phone" ? form.phone : "",
            role,
            account_type: roleToAccountType(role),
            bio:          form.bio || null,
            agency_name:  isAgentOrAgency ? (form.agencyName || null) : null,
          },
        },
      });

      if (signUpError) {
        setError(erreurFrancais(signUpError.message));
        setLoading(false);
        return;
      }

      /* Forcer la connexion immédiate (bypass confirmation email) */
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
    /* After signup, redirect to onboarding unless a specific redirect was requested */
    if (redirectTo === "/compte") {
      router.push("/onboarding");
    } else {
      router.push(redirectTo);
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "calc(100svh - 72px)" }}>

      {/* ══════════════════════════════════════════════
          LEFT COLUMN — photo + branding (desktop only)
      ══════════════════════════════════════════════ */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-end"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        {/* Dark gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(10,18,22,0.25) 0%, rgba(10,18,22,0.92) 100%)",
        }} />
        {/* Branding */}
        <div style={{ position: "relative", zIndex: 1, padding: 48 }}>
          <Logo size="lg" />
          <h2 style={{
            fontSize: 30, fontWeight: 900, lineHeight: 1.25, marginTop: 28, marginBottom: 10,
            color: "rgba(255,255,255,1)",
          }}>
            Rejoignez des milliers<br />de Guinéens qui louent<br />sans intermédiaire
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.58)", marginBottom: 32 }}>
            Créez votre compte gratuitement en 2 minutes.
          </p>
          <div style={{ display: "flex", gap: 32 }}>
            {STATS.map((s) => (
              <div key={s.val}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "var(--accent-gold)" }}>{s.val}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.52)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          RIGHT COLUMN — form (full width on mobile)
      ══════════════════════════════════════════════ */}
      <div
        className="flex-1 lg:w-1/2 flex flex-col items-center justify-center px-4 py-10"
        style={{ background: "linear-gradient(160deg, #11100d 0%, #1a2535 100%)" }}
      >
        {/* Mobile: logo */}
        <div className="lg:hidden mb-6 text-center">
          <Logo size="lg" />
          <p style={{ color: "rgba(255,255,255,0.42)", fontSize: 13, marginTop: 8 }}>
            Créez votre compte gratuit
          </p>
        </div>

        {/* Step progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, justifyContent: "center" }}>
          {[1, 2].map((s) => (
            <div
              key={s}
              style={{
                height: 6,
                borderRadius: 99,
                transition: "all 0.3s",
                background: s <= step ? "var(--accent-gold)" : "rgba(255,255,255,0.18)",
                width: s === step ? 40 : s < step ? 32 : 24,
              }}
            />
          ))}
        </div>

        <div className="w-full max-w-[440px]">

          {/* ─── Form card ─── */}
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 24,
            padding: 32,
          }}>

            {/* ══ STEP 1 — Choisir le profil ══ */}
            {step === 1 && (
              <>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 900, color: "rgba(255,255,255,1)" }}>
                    Créer un compte
                  </h1>
                  <p style={{ color: "rgba(255,255,255,0.48)", fontSize: 14, marginTop: 4 }}>
                    Quel est votre profil ?
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {USER_ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "14px 16px",
                        borderRadius: 16,
                        border: `1px solid ${role === r.value ? "var(--accent-gold)" : "rgba(255,255,255,0.10)"}`,
                        background: role === r.value ? "rgba(212,175,55,0.10)" : "rgba(255,255,255,0.03)",
                        cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                        minHeight: 72,
                      }}
                    >
                      <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{r.icon}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{
                          fontWeight: 700, fontSize: 14, margin: 0,
                          color: role === r.value ? "var(--accent-gold)" : "rgba(255,255,255,1)",
                        }}>
                          {r.label}
                        </p>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "2px 0 0" }}>
                          {r.desc}
                        </p>
                      </div>
                      {role === r.value && (
                        <CheckCircle style={{ width: 18, height: 18, color: "var(--accent-gold)", flexShrink: 0 }} />
                      )}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={!role}
                  onClick={() => role && setStep(2)}
                  style={{
                    marginTop: 20, width: "100%", padding: "14px 0",
                    background: "var(--accent-gold)", color: "var(--bg-primary)",
                    fontWeight: 800, fontSize: 15, borderRadius: 14, border: "none",
                    cursor: role ? "pointer" : "not-allowed",
                    opacity: role ? 1 : 0.45,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    transition: "opacity 0.2s", minHeight: 48,
                  }}
                >
                  Continuer <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
              </>
            )}

            {/* ══ STEP 2 — Formulaire ══ */}
            {step === 2 && (
              <>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(null); }}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      fontSize: 13, color: "rgba(255,255,255,0.45)",
                      background: "none", border: "none", cursor: "pointer", marginBottom: 8,
                    }}
                  >
                    ← Retour
                  </button>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 20 }}>{selectedRole?.icon}</span>
                    <h1 style={{ fontSize: 20, fontWeight: 900, color: "rgba(255,255,255,1)", margin: 0 }}>
                      {selectedRole?.label}
                    </h1>
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>Vos informations</p>
                </div>

                {/* Phone / Email mode toggle */}
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4,
                  padding: 4, background: "rgba(0,0,0,0.30)", borderRadius: 12, marginBottom: 16,
                }}>
                  {(["phone", "email"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => switchMode(m)}
                      style={{
                        padding: "10px 0", borderRadius: 10, fontSize: 14, fontWeight: 700,
                        border: "none", cursor: "pointer", transition: "all 0.2s",
                        ...(mode === m
                          ? { background: "var(--accent-gold)", color: "var(--bg-primary)" }
                          : { background: "transparent", color: "rgba(255,255,255,0.48)" }),
                      }}
                    >
                      {m === "phone" ? "📱 Téléphone" : "✉️ Email"}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                  {/* Nom */}
                  <div>
                    <label style={LABEL}>
                      {role === "agency" ? "Nom de l'agence" : "Votre nom complet"}
                    </label>
                    <div style={{ position: "relative" }}>
                      {role === "agency"
                        ? <Building style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "rgba(255,255,255,0.32)", pointerEvents: "none" }} />
                        : <User    style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "rgba(255,255,255,0.32)", pointerEvents: "none" }} />}
                      <input
                        type="text"
                        placeholder={role === "agency" ? "Conakry Premium Immo" : "Mamadou Diallo"}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required autoComplete="name"
                        style={INPUT}
                      />
                    </div>
                  </div>

                  {/* Nom agence si agent/agence */}
                  {isAgentOrAgency && (
                    <div>
                      <label style={LABEL}>
                        {role === "agency" ? "Raison sociale" : "Agence de rattachement"}
                        <span style={{ color: "rgba(255,255,255,0.28)", fontWeight: 400, marginLeft: 4 }}>(optionnel)</span>
                      </label>
                      <div style={{ position: "relative" }}>
                        <Building style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "rgba(255,255,255,0.32)", pointerEvents: "none" }} />
                        <input
                          type="text"
                          placeholder="Ex: Immo Guinée SARL"
                          value={form.agencyName}
                          onChange={(e) => setForm({ ...form, agencyName: e.target.value })}
                          style={INPUT}
                        />
                      </div>
                    </div>
                  )}

                  {/* Bio si agent/agence */}
                  {isAgentOrAgency && (
                    <div>
                      <label style={LABEL}>
                        Bio courte
                        <span style={{ color: "rgba(255,255,255,0.28)", fontWeight: 400, marginLeft: 4 }}>(optionnel)</span>
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Ex: Spécialiste location Kipé &amp; Ratoma depuis 5 ans."
                        value={form.bio}
                        onChange={(e) => setForm({ ...form, bio: e.target.value })}
                        maxLength={200}
                        style={{
                          ...INPUT,
                          paddingLeft: 16,
                          resize: "none",
                          height: "auto",
                        }}
                      />
                    </div>
                  )}

                  {/* Téléphone ou Email */}
                  {mode === "phone" ? (
                    <div>
                      <label style={LABEL}>Numéro de téléphone</label>
                      <div style={{ position: "relative" }}>
                        <Phone style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "rgba(255,255,255,0.32)", pointerEvents: "none" }} />
                        <input
                          type="tel"
                          placeholder="Ex : 628 000 000"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          required autoComplete="tel"
                          style={INPUT}
                        />
                      </div>
                      <button type="button" onClick={() => switchMode("email")}
                        style={{ fontSize: 12, color: "var(--accent-gold)", background: "none", border: "none", cursor: "pointer", marginTop: 6, padding: 0 }}>
                        Utiliser mon email à la place →
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label style={LABEL}>Adresse email</label>
                      <div style={{ position: "relative" }}>
                        <Mail style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "rgba(255,255,255,0.32)", pointerEvents: "none" }} />
                        <input
                          type="email"
                          placeholder="vous@email.com"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          required autoComplete="email"
                          style={INPUT}
                        />
                      </div>
                      <button type="button" onClick={() => switchMode("phone")}
                        style={{ fontSize: 12, color: "var(--accent-gold)", background: "none", border: "none", cursor: "pointer", marginTop: 6, padding: 0 }}>
                        ← Utiliser mon numéro de téléphone
                      </button>
                    </div>
                  )}

                  {/* Mot de passe */}
                  <div>
                    <label style={LABEL}>Mot de passe</label>
                    <div style={{ position: "relative" }}>
                      <Lock style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "rgba(255,255,255,0.32)", pointerEvents: "none" }} />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="•••••••• (min. 8 caractères)"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required minLength={8} autoComplete="new-password"
                        style={{ ...INPUT, paddingRight: 44 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.38)", padding: 0, display: "flex" }}
                      >
                        {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                      </button>
                    </div>
                  </div>

                  {/* Error / success */}
                  {error && (
                    <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.28)", borderRadius: 12, padding: "12px 16px" }}>
                      <p style={{ color: "#f87171", fontSize: 13, margin: 0 }}>{error}</p>
                    </div>
                  )}
                  {success && (
                    <div style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.28)", borderRadius: 12, padding: "12px 16px" }}>
                      <p style={{ color: "#4ade80", fontSize: 13, margin: 0 }}>{success}</p>
                    </div>
                  )}

                  {/* CTA */}
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: "100%", padding: "14px 0",
                      background: "var(--accent-gold)", color: "var(--bg-primary)",
                      fontWeight: 800, fontSize: 15, borderRadius: 14, border: "none",
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.75 : 1,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      transition: "opacity 0.2s", minHeight: 48,
                    }}
                  >
                    {loading
                      ? "Création du compte…"
                      : <><span>Créer mon compte</span><ArrowRight style={{ width: 16, height: 16 }} /></>}
                  </button>
                </form>

                <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 14 }}>
                  En créant un compte, vous acceptez nos{" "}
                  <Link href="/cgv" style={{ color: "var(--accent-gold)", textDecoration: "none" }}>
                    conditions d&apos;utilisation
                  </Link>
                </p>
              </>
            )}
          </div>

          {/* Sign-in link */}
          <p style={{ textAlign: "center", fontSize: 14, color: "rgba(255,255,255,0.42)", marginTop: 20 }}>
            Déjà un compte ?{" "}
            <Link href="/connexion" style={{ color: "var(--accent-gold)", fontWeight: 700, textDecoration: "none" }}>
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function InscriptionPage() {
  return (
    <Suspense
      fallback={
        <div style={{
          minHeight: "calc(100svh - 72px)",
          background: "linear-gradient(160deg, #11100d 0%, #1a2535 100%)",
        }} />
      }
    >
      <InscriptionForm />
    </Suspense>
  );
}
