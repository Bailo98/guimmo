"use client";
import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Phone, Lock, Mail, User, Building, ArrowRight, CheckCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { erreurFrancais } from "@/lib/errors";

const USER_ROLES = [
  { value: "buyer",  label: "Chercher un logement",   icon: "🔍", desc: "Je cherche à louer ou acheter" },
  { value: "owner",  label: "Propriétaire particulier", icon: "🏠", desc: "Je loue mon propre logement" },
  { value: "agent",  label: "Agent immobilier",         icon: "🤝", desc: "Je suis agent professionnel" },
  { value: "agency", label: "Agence immobilière",       icon: "🏢", desc: "Je représente une agence" },
];

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
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });

  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !GOOGLE_CLIENT_ID) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__BienLogerGoogleCallback = async (response: { credential: string }) => {
      const { error: signInError } = await supabase!.auth.signInWithIdToken({
        provider: "google",
        token: response.credential,
      });
      if (!signInError) {
        document.cookie = `BienLoger-auth=supabase-session; path=/; max-age=${60 * 60 * 24 * 30}`;
        router.push("/compte");
      }
    };
    if (!document.getElementById("gsi-script")) {
      const script = document.createElement("script");
      script.id = "gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return () => { delete (window as any).__BienLogerGoogleCallback; };
  }, [GOOGLE_CLIENT_ID, router]);

  function switchMode(next: "phone" | "email") {
    setMode(next);
    setError(null);
    setForm((f) => ({ ...f, phone: "", email: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }

    setLoading(true);
    setError(null);

    if (isSupabaseConfigured && supabase) {
      const rawPhone = form.phone.replace(/[\s+\-()]/g, "");
      const normalized = rawPhone.startsWith("224") ? rawPhone : `224${rawPhone}`;
      const email =
        mode === "phone"
          ? `${normalized}@BienLoger.gn`
          : form.email;

      // Check for duplicate phone before creating account
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
          },
        },
      });

      if (signUpError) {
        setError(erreurFrancais(signUpError.message));
        setLoading(false);
        return;
      }

      // Force immediate sign-in to bypass email confirmation requirement
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

      document.cookie = `BienLoger-auth=supabase-session; path=/; max-age=${60 * 60 * 24 * 30}`;
    } else {
      await new Promise((r) => setTimeout(r, 800));
      document.cookie = `BienLoger-auth=mock-session; path=/; max-age=${60 * 60 * 24 * 30}`;
    }

    setLoading(false);
    router.push(redirectTo);
  }

  return (
    <div className="min-h-screen bg-[#111a14] flex flex-col">
      <div className="p-4 flex items-center justify-between">
        <Logo />
        <Link href="/connexion" className="text-sm text-[rgba(240,230,204,0.50)] hover:text-white transition-colors">
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
                  s < step  ? "bg-[#c8901e] w-12"
                  : s === step ? "bg-[#c8901e] w-16"
                  : "bg-[#2a3040] w-8"
                )}
              />
            ))}
          </div>

          <div className="rounded-3xl p-8" style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", border: "1px solid rgba(255,255,255,0.10)" }}>

            {/* ── STEP 1 — Role ── */}
            {step === 1 && (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-black text-white">Créer un compte</h1>
                  <p className="text-[rgba(240,230,204,0.50)] text-sm mt-1">Quel est votre profil ?</p>
                </div>

                {/* Google signup */}
                {GOOGLE_CLIENT_ID && (
                  <div
                    id="g_id_onload"
                    data-client_id={GOOGLE_CLIENT_ID}
                    data-context="signup"
                    data-callback="__BienLogerGoogleCallback"
                    data-auto_prompt="false"
                  />
                )}
                <div className="flex justify-center mb-4">
                  {GOOGLE_CLIENT_ID && (
                    <div
                      className="g_id_signin"
                      data-type="standard"
                      data-shape="rectangular"
                      data-theme="outline"
                      data-text="signup_with"
                      data-size="large"
                      data-logo_alignment="left"
                      data-locale="fr"
                      data-width="300"
                    />
                  )}
                </div>

                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#2a3040]" />
                  </div>
                  <div className="relative flex justify-center text-xs text-[rgba(240,230,204,0.50)] bg-[#1e2430] px-3">
                    ou avec téléphone / email
                  </div>
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
                          ? "border-[#c8901e] bg-[#c8901e]/10"
                          : "hover:border-white/20"
                      )}
                    >
                      <span className="text-2xl">{r.icon}</span>
                      <div className="flex-1">
                        <p className={cn("font-semibold text-sm", role === r.value ? "text-[#daa84a]" : "text-white")}>
                          {r.label}
                        </p>
                        <p className="text-[rgba(240,230,204,0.50)] text-xs">{r.desc}</p>
                      </div>
                      {role === r.value && <CheckCircle className="w-4 h-4 text-[#daa84a] flex-shrink-0" />}
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

            {/* ── STEP 2 — Form ── */}
            {step === 2 && (
              <>
                <div className="text-center mb-6">
                  <button
                    onClick={() => { setStep(1); setError(null); }}
                    className="text-[rgba(240,230,204,0.50)] hover:text-white text-sm mb-2 flex items-center gap-1 mx-auto"
                  >
                    ← Retour
                  </button>
                  <h1 className="text-2xl font-black text-white">Vos informations</h1>
                  <p className="text-[rgba(240,230,204,0.50)] text-sm mt-1">Presque terminé !</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-[rgba(240,230,204,0.75)] mb-2">
                      {role === "agency" ? "Nom de l'agence" : "Votre nom complet"}
                    </label>
                    <div className="relative">
                      {role === "agency"
                        ? <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(240,230,204,0.50)] pointer-events-none" />
                        : <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(240,230,204,0.50)] pointer-events-none" />}
                      <input
                        id="name"
                        name="name"
                        type="text"
                        placeholder={role === "agency" ? "Conakry Premium Immo" : "Mamadou Diallo"}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#c8901e] text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
                        required
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  {/* Phone or email */}
                  {mode === "phone" ? (
                    <div>
                      <label className="block text-sm font-semibold text-[rgba(240,230,204,0.75)] mb-2">
                        Numéro de téléphone
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(240,230,204,0.50)] pointer-events-none" />
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="+224 628 222 510 ou +1 438 000 0000"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="w-full rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#c8901e] text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
                          required
                          autoComplete="tel"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => switchMode("email")}
                        className="text-xs text-[#daa84a] hover:underline mt-1.5 block"
                      >
                        Utiliser mon email à la place →
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-semibold text-[rgba(240,230,204,0.75)] mb-2">
                        Adresse email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(240,230,204,0.50)] pointer-events-none" />
                        <input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="vous@email.com"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#c8901e] text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
                          required
                          autoComplete="email"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => switchMode("phone")}
                        className="text-xs text-[#daa84a] hover:underline mt-1.5 block"
                      >
                        ← Utiliser mon numéro de téléphone
                      </button>
                    </div>
                  )}

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-semibold text-[rgba(240,230,204,0.75)] mb-2">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(240,230,204,0.50)] pointer-events-none" />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••  (min. 8 caractères)"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full rounded-xl pl-10 pr-11 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#c8901e]" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", fontSize: 16 }}
                        required
                        minLength={8}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(240,230,204,0.50)] hover:text-white"
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
                      <p className="text-green-400 text-sm">{success}</p>
                    </div>
                  )}

                  <Button type="submit" variant="brand" size="lg" loading={loading} className="w-full">
                    Créer mon compte <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>

                <p className="text-[rgba(240,230,204,0.50)] text-xs text-center mt-4">
                  En créant un compte, vous acceptez nos{" "}
                  <Link href="/cgv" className="text-[#daa84a] hover:underline">
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
    <Suspense fallback={<div className="min-h-screen bg-[#111a14]" />}>
      <InscriptionForm />
    </Suspense>
  );
}
