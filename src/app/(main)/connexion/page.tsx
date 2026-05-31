"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Phone, Lock, Mail, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { erreurFrancais } from "@/lib/errors";

/* ─────────────────────────────────────────────
   Shared input style — uses rgba so it stays
   white-on-dark in both dark AND light mode.
   (The global html:not(.dark) input rule will
   upgrade bg to #FFF and color to #121212 in
   light mode, which is readable on the always-
   dark gradient column background.)
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

/* Left-column stats */
const STATS = [
  { val: "500+",  label: "Annonces actives"  },
  { val: "10",    label: "Quartiers couverts" },
  { val: "100%",  label: "Direct proprio"    },
];

function ConnexionForm() {
  const [mode, setMode]               = useState<"phone" | "email">("phone");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [form, setForm]               = useState({ phone: "", email: "", password: "" });
  const searchParams = useSearchParams();

  /* Sanitize: never redirect back to an auth page (breaks loops) */
  const rawRedirect = searchParams.get("redirect") ?? "/compte";
  const redirect = (rawRedirect.startsWith("/connexion") || rawRedirect.startsWith("/inscription"))
    ? "/compte"
    : rawRedirect;

  async function handleGoogleSignIn() {
    if (!isSupabaseConfigured || !supabase) return;
    setLoading(true);
    setError(null);
    /* Store destination in a short-lived cookie read by the route handler.
       redirectTo must be the exact URL registered in Supabase Dashboard —
       no query params, otherwise Supabase rejects it and never calls our handler. */
    if (redirect !== "/compte") {
      document.cookie = `oauth_redirect=${encodeURIComponent(redirect)}; path=/; max-age=300; SameSite=Lax`;
    }
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
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
    try {
      if (isSupabaseConfigured && supabase) {
        const rawPhone  = form.phone.replace(/[\s+\-()]/g, "");
        const normalized = rawPhone.startsWith("224") ? rawPhone : `224${rawPhone}`;
        // ⚠️  DO NOT rename @bienloger.gn → @logerbien.gn without a Supabase SQL migration.
        // This fake domain is the email stored permanently in auth.users for phone-based accounts.
        // Changing it here without updating the DB will lock out all existing phone users.
        const internalEmail = mode === "phone" ? `${normalized}@bienloger.gn` : form.email;

        const { error: authError } = await supabase.auth.signInWithPassword({
          email: internalEmail,
          password: form.password,
        });
        if (authError) { setError(erreurFrancais(authError.message)); return; }

        document.cookie = `LogerBien-auth=supabase-session; path=/; max-age=${60 * 60 * 24 * 30}`;
        /* Hard refresh forces AuthProvider to re-init from fresh session cookies,
           avoiding the SPA race condition where user is still null on /compte. */
        window.location.href = redirect;
      } else {
        await new Promise((r) => setTimeout(r, 1000));
        document.cookie = `LogerBien-auth=mock-session; path=/; max-age=${60 * 60 * 24 * 30}`;
        window.location.href = redirect;
      }
    } catch (err) {
      console.error("EXCEPTION:", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next: "phone" | "email") {
    setMode(next);
    setError(null);
    setForm({ phone: "", email: "", password: "" });
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

        {/* Branding content */}
        <div style={{ position: "relative", zIndex: 1, padding: 48 }}>
          <Logo size="lg" />
          <h2 style={{
            fontSize: 30, fontWeight: 900, lineHeight: 1.25, marginTop: 28, marginBottom: 10,
            color: "rgba(255,255,255,1)",
          }}>
            Trouvez votre logement<br />direct propriétaire<br />en Guinée
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.58)", marginBottom: 32 }}>
            Des annonces vérifiées, sans intermédiaire.
          </p>
          <div style={{ display: "flex", gap: 32 }}>
            {STATS.map((s) => (
              <div key={s.val}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#D4AF37" }}>{s.val}</div>
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
        style={{ background: "linear-gradient(160deg, #0A1216 0%, #1a2535 100%)" }}
      >
        {/* Mobile: logo + tagline */}
        <div className="lg:hidden mb-8 text-center">
          <Logo size="lg" />
          <p style={{ color: "rgba(255,255,255,0.42)", fontSize: 13, marginTop: 8 }}>
            Trouvez votre logement en Guinée
          </p>
        </div>

        <div className="w-full max-w-[400px]">

          {/* ─── Form card ─── */}
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 24,
            padding: 32,
          }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: "rgba(255,255,255,1)" }}>
                Connexion
              </h1>
              <p style={{ color: "rgba(255,255,255,0.48)", fontSize: 14, marginTop: 4 }}>
                Accédez à votre compte LogerBien
              </p>
            </div>

            {/* Mode toggle — outside <form> so it never accidentally submits */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4,
              padding: 4, background: "rgba(0,0,0,0.30)", borderRadius: 12, marginBottom: 20,
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
                      ? { background: "#D4AF37", color: "#0A1216" }
                      : { background: "transparent", color: "rgba(255,255,255,0.48)" }),
                  }}
                >
                  {m === "phone" ? "📱 Téléphone" : "✉️ Email"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Phone or Email */}
              {mode === "phone" ? (
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.70)", marginBottom: 8 }}>
                    Numéro de téléphone
                  </label>
                  <div style={{ position: "relative" }}>
                    <Phone style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "rgba(255,255,255,0.32)", pointerEvents: "none" }} />
                    <input
                      id="phone" name="phone" type="tel"
                      placeholder="Ex : 628 000 000"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      required autoComplete="tel"
                      style={INPUT}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.70)", marginBottom: 8 }}>
                    Adresse email
                  </label>
                  <div style={{ position: "relative" }}>
                    <Mail style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "rgba(255,255,255,0.32)", pointerEvents: "none" }} />
                    <input
                      id="email" name="email" type="email"
                      placeholder="vous@email.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required autoComplete="email"
                      style={INPUT}
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.70)" }}>
                    Mot de passe
                  </label>
                  <Link href="/mot-de-passe-oublie" style={{ fontSize: 12, color: "#D4AF37", textDecoration: "none" }}>
                    Oublié ?
                  </Link>
                </div>
                <div style={{ position: "relative" }}>
                  <Lock style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "rgba(255,255,255,0.32)", pointerEvents: "none" }} />
                  <input
                    id="password" name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required autoComplete="current-password"
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

              {/* Error banner */}
              {error && (
                <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.28)", borderRadius: 12, padding: "12px 16px" }}>
                  <p style={{ color: "#f87171", fontSize: 13, margin: 0 }}>{error}</p>
                </div>
              )}

              {/* CTA */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: "14px 0",
                  background: "#D4AF37", color: "#0A1216",
                  fontWeight: 800, fontSize: 15, borderRadius: 14, border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.75 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "opacity 0.2s",
                  minHeight: 48,
                }}
              >
                {loading
                  ? "Connexion…"
                  : <><span>Se connecter</span><ArrowRight style={{ width: 16, height: 16 }} /></>}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.09)" }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.28)" }}>ou</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.09)" }} />
            </div>

            {/* Google sign-in */}
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                padding: "12px 0",
                background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 14, color: "rgba(255,255,255,0.78)",
                fontWeight: 600, fontSize: 14, cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.5 : 1, transition: "opacity 0.2s",
                minHeight: 48,
              }}
            >
              <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, flexShrink: 0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuer avec Google
            </button>
          </div>

          {/* Sign-up link */}
          <p style={{ textAlign: "center", fontSize: 14, color: "rgba(255,255,255,0.42)", marginTop: 20 }}>
            Pas encore de compte ?{" "}
            <Link href="/inscription" style={{ color: "#D4AF37", fontWeight: 700, textDecoration: "none" }}>
              S&apos;inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense
      fallback={
        <div style={{
          minHeight: "calc(100svh - 72px)",
          background: "linear-gradient(160deg, #0A1216 0%, #1a2535 100%)",
        }} />
      }
    >
      <ConnexionForm />
    </Suspense>
  );
}
