"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, User, Home, Search } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { toast } from "@/lib/toast";

type Role = "chercheur" | "proprietaire";

const STEPS = ["Votre profil", "Informations", "Prêt !"];

export default function OnboardingPage() {
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  // Pre-fill from profile if available
  useEffect(() => {
    if (profile) {
      if (profile.full_name) setFullName(profile.full_name);
      if (profile.phone)     setPhone(profile.phone);
      // If already completed, redirect home
      if (profile.onboarding_completed) router.replace("/");
    }
  }, [profile, router]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !profile) return; // still loading
    if (!user) router.replace("/connexion?redirect=/onboarding");
  }, [user, profile, router]);

  async function handleSave() {
    if (!user || !isSupabaseConfigured || !supabase) return;
    if (!role) { toast("Veuillez choisir un profil", "error"); return; }
    if (!fullName.trim()) { toast("Veuillez saisir votre nom", "error"); return; }

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        role,
        account_type: role,
        onboarding_completed: true,
      })
      .eq("id", user.id);

    if (error) {
      toast("Erreur lors de la sauvegarde", "error");
      setSaving(false);
      return;
    }

    await refreshProfile();
    setSaving(false);
    setStep(3);
  }

  function handleFinish(destination: string) {
    router.replace(destination);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "var(--bg-primary)" }}>
      <div className="w-full max-w-md">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{
                    background: step > i + 1 ? "#D4AF37" : step === i + 1 ? "rgba(212,175,55,0.20)" : "var(--bg-secondary)",
                    border: step === i + 1 ? "2px solid #D4AF37" : "2px solid transparent",
                    color: step > i + 1 ? "#0A1216" : step === i + 1 ? "#D4AF37" : "var(--text-secondary)",
                  }}
                >
                  {step > i + 1 ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-1" style={{ background: step > i + 1 ? "#D4AF37" : "var(--border)" }} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            {STEPS.map((label, i) => (
              <span
                key={label}
                className="text-[10px] font-semibold"
                style={{ color: step === i + 1 ? "#D4AF37" : "var(--text-secondary)" }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Step 1: Role ── */}
        {step === 1 && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div className="mb-8 text-center">
              <div className="text-5xl mb-3">👋</div>
              <h1 className="text-2xl font-black mb-2" style={{ color: "var(--text-primary)" }}>
                Bienvenue sur LogerBien !
              </h1>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Pour personnaliser votre expérience, dites-nous qui vous êtes.
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {([
                {
                  id: "chercheur" as Role,
                  icon: Search,
                  title: "Je cherche un logement",
                  sub: "Locataire ou acheteur en Guinée ou depuis la diaspora",
                },
                {
                  id: "proprietaire" as Role,
                  icon: Home,
                  title: "Je propose un logement",
                  sub: "Propriétaire, agent ou agence immobilière",
                },
              ]).map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    style={{
                      width: "100%", textAlign: "left", padding: "16px 18px",
                      borderRadius: 16, cursor: "pointer", transition: "all 0.15s",
                      background: role === r.id ? "rgba(212,175,55,0.10)" : "var(--bg-card)",
                      border: role === r.id ? "2px solid #D4AF37" : "1px solid var(--border)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                        background: role === r.id ? "rgba(212,175,55,0.15)" : "var(--bg-secondary)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Icon style={{ width: 20, height: 20, color: role === r.id ? "#D4AF37" : "var(--text-secondary)" }} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 2 }}>{r.title}</p>
                        <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>{r.sub}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => { if (role) setStep(2); else toast("Veuillez choisir un profil", "error"); }}
              style={{
                width: "100%", padding: "14px", borderRadius: 14, border: "none",
                background: role ? "#D4AF37" : "var(--bg-secondary)", color: role ? "#0A1216" : "var(--text-secondary)",
                fontWeight: 700, fontSize: 15, cursor: role ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.2s",
              }}
            >
              Continuer <ChevronRight style={{ width: 18, height: 18 }} />
            </button>
          </div>
        )}

        {/* ── Step 2: Profile info ── */}
        {step === 2 && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div className="mb-8 text-center">
              <div style={{ width: 56, height: 56, borderRadius: 16, margin: "0 auto 12px", background: "rgba(212,175,55,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User style={{ width: 28, height: 28, color: "#D4AF37" }} />
              </div>
              <h1 className="text-2xl font-black mb-2" style={{ color: "var(--text-primary)" }}>
                Votre profil
              </h1>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Ces informations sont visibles sur vos annonces.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                  Nom complet <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Mamadou Diallo"
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: 12, outline: "none",
                    background: "var(--bg-card)", border: "1px solid var(--border)",
                    color: "var(--text-primary)", fontSize: 15, boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                  Téléphone <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>(optionnel)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+224 6XX XX XX XX"
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: 12, outline: "none",
                    background: "var(--bg-card)", border: "1px solid var(--border)",
                    color: "var(--text-primary)", fontSize: 15, boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  padding: "14px 20px", borderRadius: 14, border: "1px solid var(--border)",
                  background: "transparent", color: "var(--text-secondary)", fontWeight: 600, fontSize: 14, cursor: "pointer",
                }}
              >
                Retour
              </button>
              <button
                onClick={handleSave}
                disabled={!fullName.trim() || saving}
                style={{
                  flex: 1, padding: "14px", borderRadius: 14, border: "none",
                  background: fullName.trim() && !saving ? "#D4AF37" : "var(--bg-secondary)",
                  color: fullName.trim() && !saving ? "#0A1216" : "var(--text-secondary)",
                  fontWeight: 700, fontSize: 15, cursor: fullName.trim() && !saving ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {saving ? (
                  <div style={{ width: 18, height: 18, border: "2px solid #0A1216", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                ) : (
                  <>Enregistrer <ChevronRight style={{ width: 18, height: 18 }} /></>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Done ── */}
        {step === 3 && (
          <div style={{ textAlign: "center", animation: "fadeIn 0.3s ease" }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, margin: "0 auto 20px", background: "rgba(212,175,55,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 style={{ width: 44, height: 44, color: "#D4AF37" }} />
            </div>
            <h1 className="text-2xl font-black mb-3" style={{ color: "var(--text-primary)" }}>
              Tout est prêt ! 🎉
            </h1>
            <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
              {role === "proprietaire"
                ? "Publiez votre première annonce et touchez des milliers de locataires en Guinée."
                : "Explorez des centaines de logements à Conakry et dans toute la Guinée."}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {role === "proprietaire" ? (
                <button
                  onClick={() => handleFinish("/publier")}
                  style={{
                    width: "100%", padding: "14px", borderRadius: 14, border: "none",
                    background: "#D4AF37", color: "#0A1216", fontWeight: 700, fontSize: 15, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  🏠 Publier ma première annonce
                </button>
              ) : (
                <button
                  onClick={() => handleFinish("/annonces")}
                  style={{
                    width: "100%", padding: "14px", borderRadius: 14, border: "none",
                    background: "#D4AF37", color: "#0A1216", fontWeight: 700, fontSize: 15, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  🔍 Explorer les annonces
                </button>
              )}
              <button
                onClick={() => handleFinish("/")}
                style={{
                  width: "100%", padding: "14px", borderRadius: 14,
                  border: "1px solid var(--border)", background: "transparent",
                  color: "var(--text-secondary)", fontWeight: 600, fontSize: 14, cursor: "pointer",
                }}
              >
                Accueil
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
