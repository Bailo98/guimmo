"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff, Phone, Lock, Mail, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

function ConnexionForm() {
  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ phone: "", email: "", password: "" });
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams.get("redirect") ?? "/compte";

  async function handleGoogleSignIn() {
    if (!isSupabaseConfigured || !supabase) return;
    setLoading(true);
    setError(null);
    // Store destination in a short-lived cookie read by the route handler.
    // redirectTo must be the exact URL registered in Supabase Dashboard —
    // no query params, otherwise Supabase rejects it and never calls our handler.
    if (redirect !== "/compte") {
      document.cookie = `oauth_redirect=${encodeURIComponent(redirect)}; path=/; max-age=300; SameSite=Lax`;
    }
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (oauthError) {
      setError(`Erreur Google : ${oauthError.message}`);
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isSupabaseConfigured && supabase) {
      const email =
        mode === "phone"
          ? `${form.phone.replace(/[\s+]/g, "")}@gmail.com`
          : form.email;

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: form.password,
      });

      if (authError) {
        setError(
          authError.message.includes("Invalid login credentials")
            ? "Numéro ou mot de passe incorrect."
            : authError.message
        );
        setLoading(false);
        return;
      }

      document.cookie = `guimmo-auth=supabase-session; path=/; max-age=${60 * 60 * 24 * 30}`;
      router.push(redirect);
    } else {
      await new Promise((r) => setTimeout(r, 1000));
      document.cookie = `guimmo-auth=mock-session; path=/; max-age=${60 * 60 * 24 * 30}`;
      router.push(redirect);
    }
  }

  function switchMode(next: "phone" | "email") {
    setMode(next);
    setError(null);
    setForm({ phone: "", email: "", password: "" });
  }

  return (
    <div className="min-h-screen bg-[#111a14] flex flex-col">
      <div className="p-4 flex items-center justify-between">
        <Logo />
        <Link href="/" className="text-sm text-[rgba(240,230,204,0.50)] hover:text-white transition-colors">
          Retour à l&apos;accueil
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="rounded-3xl p-8" style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", border: "1px solid rgba(255,255,255,0.10)" }}>
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <Lock className="w-8 h-8 text-white/70" />
              </div>
              <h1 className="text-2xl font-black text-white">Connexion</h1>
              <p className="text-[rgba(240,230,204,0.50)] text-sm mt-1">Accédez à votre compte GuImmo</p>
            </div>

            {/* Mode toggle — outside <form> so it can never accidentally submit */}
            <div className="flex rounded-xl overflow-hidden mb-4" style={{ border: "1px solid rgba(255,255,255,0.10)" }}>
              <button
                type="button"
                onClick={() => switchMode("phone")}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                  mode === "phone"
                    ? "bg-[#c8901e] text-white"
                    : "text-white/50 hover:text-white"
                }`}
                style={mode !== "phone" ? { background: "rgba(255,255,255,0.05)" } : {}}
              >
                📱 Téléphone
              </button>
              <button
                type="button"
                onClick={() => switchMode("email")}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                  mode === "email"
                    ? "bg-[#c8901e] text-white"
                    : "text-white/50 hover:text-white"
                }`}
                style={mode !== "email" ? { background: "rgba(255,255,255,0.05)" } : {}}
              >
                ✉️ Email
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "phone" ? (
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-[rgba(240,230,204,0.75)] mb-2">
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
                </div>
              ) : (
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-[rgba(240,230,204,0.75)] mb-2">
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
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-[rgba(240,230,204,0.75)] mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(240,230,204,0.50)] pointer-events-none" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full rounded-xl pl-10 pr-11 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#c8901e] text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
                    required
                    autoComplete="current-password"
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

              <div className="flex justify-end">
                <Link href="/mot-de-passe-oublie" className="text-xs text-[#daa84a] hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <Button type="submit" variant="brand" size="lg" loading={loading} className="w-full">
                Se connecter
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#2a3040]" />
              </div>
              <div className="relative flex justify-center text-xs text-white/40 bg-transparent px-3">
                ou
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="flex items-center justify-center gap-3 w-full disabled:opacity-50 text-white/80 font-semibold py-3 rounded-xl transition-colors text-sm hover:text-white"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuer avec Google
            </button>

            <p className="text-center text-sm text-[rgba(240,230,204,0.50)] mt-6">
              Pas encore de compte ?{" "}
              <Link href="/inscription" className="text-[#daa84a] font-semibold hover:underline">
                S&apos;inscrire
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#111a14]" />}>
      <ConnexionForm />
    </Suspense>
  );
}
