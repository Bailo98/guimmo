"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Phone, Lock, Mail, User, Building, ArrowRight, CheckCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const USER_ROLES = [
  { value: "buyer",  label: "Chercher un logement",   icon: "🔍", desc: "Je cherche à louer ou acheter" },
  { value: "owner",  label: "Propriétaire particulier", icon: "🏠", desc: "Je loue mon propre logement" },
  { value: "agent",  label: "Agent immobilier",         icon: "🤝", desc: "Je suis agent professionnel" },
  { value: "agency", label: "Agence immobilière",       icon: "🏢", desc: "Je représente une agence" },
];

export default function InscriptionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });

  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !GOOGLE_CLIENT_ID) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__guimmoGoogleCallback = async (response: { credential: string }) => {
      const { error: signInError } = await supabase!.auth.signInWithIdToken({
        provider: "google",
        token: response.credential,
      });
      if (!signInError) {
        document.cookie = `guimmo-auth=supabase-session; path=/; max-age=${60 * 60 * 24 * 30}`;
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
    return () => { delete (window as any).__guimmoGoogleCallback; };
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
      const email =
        mode === "phone"
          ? `${form.phone.replace(/[\s+]/g, "")}@gmail.com`
          : form.email;

      const { error: authError } = await supabase.auth.signUp({
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

      if (authError) {
        setError(
          authError.message.includes("already registered")
            ? "Ce numéro est déjà utilisé. Connectez-vous."
            : authError.message
        );
        setLoading(false);
        return;
      }

      document.cookie = `guimmo-auth=supabase-session; path=/; max-age=${60 * 60 * 24 * 30}`;
    } else {
      await new Promise((r) => setTimeout(r, 800));
      document.cookie = `guimmo-auth=mock-session; path=/; max-age=${60 * 60 * 24 * 30}`;
    }

    setLoading(false);
    router.push("/compte");
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col">
      <div className="p-4 flex items-center justify-between">
        <Logo />
        <Link href="/connexion" className="text-sm text-slate-400 hover:text-white transition-colors">
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
                  s < step  ? "bg-[#F97316] w-12"
                  : s === step ? "bg-[#F97316] w-16"
                  : "bg-[#2a3040] w-8"
                )}
              />
            ))}
          </div>

          <div className="rounded-3xl p-8" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)" }}>

            {/* ── STEP 1 — Role ── */}
            {step === 1 && (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-black text-white">Créer un compte</h1>
                  <p className="text-slate-400 text-sm mt-1">Quel est votre profil ?</p>
                </div>

                {/* Google signup */}
                {GOOGLE_CLIENT_ID && (
                  <div
                    id="g_id_onload"
                    data-client_id={GOOGLE_CLIENT_ID}
                    data-context="signup"
                    data-callback="__guimmoGoogleCallback"
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
                  <div className="relative flex justify-center text-xs text-slate-500 bg-[#1e2430] px-3">
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
                          ? "border-[#F97316] bg-[#F97316]/10"
                          : "hover:border-white/20"
                      )}
                    >
                      <span className="text-2xl">{r.icon}</span>
                      <div className="flex-1">
                        <p className={cn("font-semibold text-sm", role === r.value ? "text-[#F97316]" : "text-white")}>
                          {r.label}
                        </p>
                        <p className="text-slate-400 text-xs">{r.desc}</p>
                      </div>
                      {role === r.value && <CheckCircle className="w-4 h-4 text-[#F97316] flex-shrink-0" />}
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
                    className="text-slate-400 hover:text-white text-sm mb-2 flex items-center gap-1 mx-auto"
                  >
                    ← Retour
                  </button>
                  <h1 className="text-2xl font-black text-white">Vos informations</h1>
                  <p className="text-slate-400 text-sm mt-1">Presque terminé !</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      {role === "agency" ? "Nom de l'agence" : "Votre nom complet"}
                    </label>
                    <div className="relative">
                      {role === "agency"
                        ? <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        : <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />}
                      <input
                        id="name"
                        name="name"
                        type="text"
                        placeholder={role === "agency" ? "Conakry Premium Immo" : "Mamadou Diallo"}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#F97316] text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
                        required
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  {/* Phone or email */}
                  {mode === "phone" ? (
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Numéro de téléphone
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="+224 628 222 510 ou +1 438 000 0000"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="w-full rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#F97316] text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
                          required
                          autoComplete="tel"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => switchMode("email")}
                        className="text-xs text-[#F97316] hover:underline mt-1.5 block"
                      >
                        Utiliser mon email à la place →
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Adresse email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="vous@email.com"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#F97316] text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
                          required
                          autoComplete="email"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => switchMode("phone")}
                        className="text-xs text-[#F97316] hover:underline mt-1.5 block"
                      >
                        ← Utiliser mon numéro de téléphone
                      </button>
                    </div>
                  )}

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••  (min. 6 caractères)"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full rounded-xl pl-10 pr-11 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#F97316] text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
                        required
                        minLength={6}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
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

                  <Button type="submit" variant="brand" size="lg" loading={loading} className="w-full">
                    Créer mon compte <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>

                <p className="text-slate-500 text-xs text-center mt-4">
                  En créant un compte, vous acceptez nos{" "}
                  <Link href="/cgv" className="text-[#F97316] hover:underline">
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
