"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff, Phone, Lock, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

function ConnexionForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ phone: "", password: "" });
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams.get("redirect") ?? "/compte";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isSupabaseConfigured && supabase) {
      // Real Supabase auth
      // NOTE: Phone OTP auth requires Twilio configured in Supabase.
      // As a workaround, we use the phone number formatted as an email address.
      const email = `${form.phone.replace(/\s/g, "")}@guimmo.gn`;
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: form.password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      // Also set a cookie so middleware can detect auth on SSR
      document.cookie = `guimmo-auth=supabase-session; path=/; max-age=${60 * 60 * 24 * 30}`;
      router.push(redirect);
    } else {
      // Mock auth fallback — used when Supabase is not configured
      await new Promise((r) => setTimeout(r, 1500));
      document.cookie = `guimmo-auth=mock-session; path=/; max-age=${60 * 60 * 24 * 30}`;
      router.push(redirect);
    }
  }

  return (
    <div className="min-h-screen bg-[#111418] flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <Logo />
        <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">
          Retour à l&apos;accueil
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="bg-[#1e2430] rounded-3xl p-8 border border-[#2a3040]">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#F97316]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-[#F97316]" />
              </div>
              <h1 className="text-2xl font-black text-white">Connexion</h1>
              <p className="text-slate-400 text-sm mt-1">Accédez à votre compte GuImmo</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Numéro de téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="+224 6XX XXX XXX"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-[#151922] border border-[#2a3040] rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent text-sm"
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
                    className="w-full bg-[#151922] border border-[#2a3040] rounded-xl pl-10 pr-11 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent text-sm"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link href="/mot-de-passe-oublie" className="text-xs text-[#F97316] hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>

              {/* Error message */}
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

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#2a3040]" />
              </div>
              <div className="relative flex justify-center text-xs text-slate-500 bg-[#1e2430] px-3">ou</div>
            </div>

            {/* WhatsApp login */}
            <a
              href="https://wa.me/224620000000?text=Bonjour%2C%20je%20veux%20me%20connecter%20%C3%A0%20GuImmo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] font-semibold py-3 rounded-xl border border-[#25D366]/30 transition-colors text-sm"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Continuer avec WhatsApp
            </a>

            <p className="text-center text-sm text-slate-400 mt-6">
              Pas encore de compte ?{" "}
              <Link href="/inscription" className="text-[#F97316] font-semibold hover:underline">
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
    <Suspense fallback={<div className="min-h-screen bg-[#111418]" />}>
      <ConnexionForm />
    </Suspense>
  );
}
