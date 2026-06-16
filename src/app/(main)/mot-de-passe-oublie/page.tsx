"use client";
import { useState } from "react";
import Link from "next/link";
import { Mail, CheckCircle, Phone } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { erreurFrancais } from "@/lib/errors";

const SUPPORT_WA = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT ?? "224628222510";

export default function MotDePasseOubliePage() {
  const [tab, setTab]         = useState<"phone" | "email">("phone");
  const [phone, setPhone]     = useState("");
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [sent, setSent]       = useState(false);

  async function handleEmailReset(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setError(null);
    setLoading(true);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const { error: e2 } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/reset-password`,
    });
    setLoading(false);
    if (e2) { setError(erreurFrancais(e2.message)); return; }
    setSent(true);
  }

  const waText = encodeURIComponent(
    `Bonjour, je veux réinitialiser mon mot de passe LogerBien. Mon numéro : ${phone}`
  );
  const waUrl = `https://wa.me/${SUPPORT_WA.replace(/\D/g, "")}?text=${waText}`;

  const INPUT: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    fontSize: 16,
    color: "var(--text-primary)",
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <div className="p-4">
        <Logo />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="rounded-3xl p-8"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-soft)" }}>

            <div className="text-center mb-6">
              <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>Mot de passe oublié</h1>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Choisissez comment récupérer votre accès</p>
            </div>

            {/* Tab toggle */}
            <div className="flex rounded-xl overflow-hidden mb-6"
              style={{ border: "1px solid rgba(255,255,255,0.10)" }}>
              {(["phone", "email"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTab(t); setError(null); setSent(false); }}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                    tab === t ? "bg-[var(--accent-gold)] text-[var(--bg-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                  style={tab !== t ? { background: "var(--border-subtle)" } : {}}
                >
                  <span className="inline-flex items-center justify-center gap-1.5">
                    {t === "phone" ? <Phone className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                    {t === "phone" ? "Par téléphone" : "Par email"}
                  </span>
                </button>
              ))}
            </div>

            {/* ── Phone tab ── */}
            {tab === "phone" && (
              <div className="space-y-5">
                <div className="rounded-2xl p-4 text-sm leading-relaxed"
                  style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                  Pour réinitialiser votre mot de passe par téléphone, contactez notre équipe sur WhatsApp.
                  Nous vous aiderons en quelques minutes.
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                    Votre numéro (optionnel)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+224 6XX XXX XXX"
                    style={{ ...INPUT, width: "100%", borderRadius: 12, padding: "12px 16px", color: "var(--text-primary)" }}
                    className="focus:outline-none focus:ring-2 focus:ring-[var(--accent-gold)] placeholder:text-[var(--text-muted)]"
                  />
                </div>

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full font-bold text-white rounded-2xl transition-opacity hover:opacity-90"
                  style={{ background: "#25D366", height: 52, fontSize: 15 }}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current flex-shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Contacter le support WhatsApp
                </a>
              </div>
            )}

            {/* ── Email tab ── */}
            {tab === "email" && (
              <>
                {sent ? (
                  <div className="text-center py-4">
                    <CheckCircle className="w-14 h-14 text-[var(--accent-gold)] mx-auto mb-4" />
                    <h2 className="text-xl font-black mb-2" style={{ color: "var(--text-primary)" }}>Email envoyé !</h2>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Vérifiez votre boîte email et cliquez sur le lien de réinitialisation.</p>
                  </div>
                ) : (
                  <form onSubmit={handleEmailReset} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                        Adresse email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-muted)" }} />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="vous@email.com"
                          required
                          style={{ ...INPUT, width: "100%" }}
                          className="rounded-xl pl-10 pr-4 py-3 placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-gold)]"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                        <p className="text-red-400 text-sm">{error}</p>
                      </div>
                    )}

                    <Button type="submit" variant="brand" size="lg" loading={loading} className="w-full">
                      Recevoir le lien
                    </Button>
                  </form>
                )}
              </>
            )}

            <p className="text-center text-sm mt-6" style={{ color: "var(--text-secondary)" }}>
              <Link href="/connexion" className="text-[var(--accent-gold)] hover:underline">
                ← Retour à la connexion
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
