"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Phone, Lock, User, Building, ArrowRight, CheckCircle, RefreshCw } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const USER_ROLES = [
  { value: "user", label: "Chercher un logement", icon: "🔍", desc: "Je cherche à louer ou acheter" },
  { value: "owner", label: "Propriétaire particulier", icon: "🏠", desc: "Je loue mon propre logement" },
  { value: "agent", label: "Agent immobilier", icon: "🤝", desc: "Je suis agent professionnel" },
  { value: "agency", label: "Agence immobilière", icon: "🏢", desc: "Je représente une agence" },
];

const OTP_LENGTH = 6;

export default function InscriptionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", phone: "", whatsapp: "", password: "",
  });

  // OTP state
  const [otpCode] = useState(() =>
    Math.floor(100000 + Math.random() * 900000).toString()
  );
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [otpError, setOtpError] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [resendEnabled, setResendEnabled] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (step !== 3) return;
    setResendTimer(30);
    setResendEnabled(false);
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setResendEnabled(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }
    if (step === 2) {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 1500));
      setLoading(false);
      setStep(3);
      return;
    }
  }

  async function completeSignup() {
    setLoading(true);
    setSignupError(null);

    if (isSupabaseConfigured && supabase) {
      // Real Supabase signup
      // NOTE: Phone OTP auth requires Twilio configured in Supabase.
      // As a workaround, we use the phone number formatted as an email address.
      const email = `${form.phone.replace(/\s/g, "")}@guimmo.gn`;
      const { error: authError } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            name: form.name,
            phone: form.phone,
            role,
          },
        },
      });

      if (authError) {
        setSignupError(authError.message);
        setLoading(false);
        return;
      }

      // Set auth cookie so middleware can detect session on SSR
      document.cookie = `guimmo-auth=supabase-session; path=/; max-age=${60 * 60 * 24 * 30}`;
    } else {
      // Mock auth fallback — used when Supabase is not configured
      document.cookie = `guimmo-auth=mock-session; path=/; max-age=${60 * 60 * 24 * 30}`;
    }

    setLoading(false);
    setOtpSuccess(true);
    setTimeout(() => {
      router.push("/compte");
    }, 2000);
  }

  function handleOtpChange(index: number, value: string) {
    // Accept only digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    setOtpError(false);

    // Move focus forward
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }

    // Check completion
    const filled = next.join("");
    if (filled.length === OTP_LENGTH) {
      setTimeout(() => {
        if (filled === otpCode) {
          // OTP verified — complete signup
          completeSignup();
        } else {
          setOtpError(true);
          setOtpDigits(Array(OTP_LENGTH).fill(""));
          otpRefs.current[0]?.focus();
        }
      }, 500);
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleResend() {
    if (!resendEnabled) return;
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    setOtpError(false);
    setResendTimer(30);
    setResendEnabled(false);
    otpRefs.current[0]?.focus();
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setResendEnabled(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  return (
    <div className="min-h-screen bg-[#111418] flex flex-col">
      <div className="p-4 flex items-center justify-between">
        <Logo />
        <Link href="/connexion" className="text-sm text-slate-400 hover:text-white transition-colors">
          Déjà un compte ? Se connecter
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* Progress — 3 steps */}
          <div className="flex items-center gap-2 mb-8 justify-center">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  s < step
                    ? "bg-[#F97316] w-12"
                    : s === step
                    ? "bg-[#F97316] w-16"
                    : "bg-[#2a3040] w-8"
                )}
              />
            ))}
          </div>

          <div className="bg-[#1e2430] rounded-3xl p-8 border border-[#2a3040]">
            {/* STEP 1 — Role selection */}
            {step === 1 && (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-black text-white">Créer un compte</h1>
                  <p className="text-slate-400 text-sm mt-1">Quel est votre profil ?</p>
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
                          : "border-[#2a3040] hover:border-[#334155]"
                      )}
                    >
                      <span className="text-2xl">{r.icon}</span>
                      <div className="flex-1">
                        <p className={cn("font-semibold text-sm", role === r.value ? "text-[#F97316]" : "text-white")}>{r.label}</p>
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

            {/* STEP 2 — Form */}
            {step === 2 && (
              <>
                <div className="text-center mb-6">
                  <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white text-sm mb-2 flex items-center gap-1 mx-auto">
                    ← Retour
                  </button>
                  <h1 className="text-2xl font-black text-white">Vos informations</h1>
                  <p className="text-slate-400 text-sm mt-1">Presque terminé !</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      {role === "agency" ? "Nom de l'agence" : "Votre nom complet"}
                    </label>
                    <div className="relative">
                      {role === "agency"
                        ? <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        : <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
                      <input
                        type="text"
                        placeholder={role === "agency" ? "Conakry Premium Immo" : "Mamadou Diallo"}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full bg-[#151922] border border-[#2a3040] rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#F97316] text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Numéro de téléphone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        placeholder="+224 6XX XXX XXX"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full bg-[#151922] border border-[#2a3040] rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#F97316] text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full bg-[#151922] border border-[#2a3040] rounded-xl pl-10 pr-11 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#F97316] text-sm"
                        required
                        minLength={6}
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
                  <Button type="submit" variant="brand" size="lg" loading={loading} className="w-full">
                    Créer mon compte <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>
                <p className="text-slate-500 text-xs text-center mt-4">
                  En créant un compte, vous acceptez nos{" "}
                  <Link href="/cgv" className="text-[#F97316] hover:underline">conditions d&apos;utilisation</Link>
                </p>
              </>
            )}

            {/* STEP 3 — OTP verification */}
            {step === 3 && (
              <div className="text-center">
                {otpSuccess ? (
                  /* Success state */
                  <div className="py-4">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4 animate-bounce">
                      <CheckCircle className="w-9 h-9 text-green-400" />
                    </div>
                    <h2 className="text-xl font-black text-white mb-1">Compte créé !</h2>
                    <p className="text-slate-400 text-sm">Redirection vers votre compte…</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <div className="w-12 h-12 rounded-full bg-[#F97316]/20 flex items-center justify-center mx-auto mb-4">
                        <Phone className="w-6 h-6 text-[#F97316]" />
                      </div>
                      <h1 className="text-2xl font-black text-white">Vérification SMS</h1>
                      <p className="text-slate-400 text-sm mt-2">
                        Code envoyé au{" "}
                        <span className="text-white font-semibold">
                          {form.phone || "+224 6XX XXX XXX"}
                        </span>{" "}
                        ✓
                      </p>
                    </div>

                    {/* Demo hint */}
                    <div className="bg-[#151922] border border-[#2a3040] rounded-xl px-4 py-3 mb-6 text-left">
                      <p className="text-xs text-slate-400">
                        Pour cette démonstration, votre code est :{" "}
                        <span className="font-mono font-bold text-[#F97316] tracking-widest">{otpCode}</span>
                      </p>
                    </div>

                    {/* Signup error */}
                    {signupError && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4 text-left">
                        <p className="text-red-400 text-sm">{signupError}</p>
                      </div>
                    )}

                    {/* OTP inputs */}
                    <div className="flex justify-center gap-2 mb-4">
                      {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                        <input
                          key={i}
                          ref={(el) => { otpRefs.current[i] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={otpDigits[i]}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          onFocus={(e) => e.target.select()}
                          className={cn(
                            "w-10 h-12 text-center text-lg font-bold rounded-xl border bg-[#151922] text-white focus:outline-none focus:ring-2 transition-all",
                            otpError
                              ? "border-red-500 focus:ring-red-500"
                              : otpDigits[i]
                              ? "border-[#F97316] focus:ring-[#F97316]"
                              : "border-[#2a3040] focus:ring-[#F97316]"
                          )}
                        />
                      ))}
                    </div>

                    {/* Error message */}
                    {otpError && (
                      <p className="text-red-400 text-xs mb-3 font-semibold">
                        Code incorrect. Veuillez réessayer.
                      </p>
                    )}

                    {/* Resend */}
                    <div className="mt-4">
                      {resendEnabled ? (
                        <button
                          onClick={handleResend}
                          className="flex items-center gap-1.5 text-sm text-[#F97316] hover:text-[#EA6C0A] font-semibold mx-auto transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Renvoyer le code
                        </button>
                      ) : (
                        <p className="text-slate-500 text-sm">
                          Renvoyer le code dans{" "}
                          <span className="text-slate-300 font-semibold tabular-nums">{resendTimer}s</span>
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => setStep(2)}
                      className="text-slate-500 hover:text-slate-300 text-xs mt-4 transition-colors"
                    >
                      ← Modifier le numéro
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
