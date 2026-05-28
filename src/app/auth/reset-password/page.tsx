"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { erreurFrancais } from "@/lib/errors";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Le mot de passe doit faire 8 caractères minimum.");
      return;
    }
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    if (!supabase) {
      setError("Service non disponible.");
      return;
    }
    setLoading(true);
    const { error: e2 } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (e2) {
      setError(erreurFrancais(e2.message));
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/compte"), 2000);
  }

  const INPUT = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.10)",
  } as const;

  return (
    <div className="min-h-screen bg-[#0A1216] flex flex-col">
      <div className="p-4">
        <Logo />
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm rounded-3xl p-8"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}>
          {done ? (
            <div className="text-center">
              <CheckCircle className="w-14 h-14 text-[#D4AF37] mx-auto mb-4" />
              <h2 className="text-xl font-black text-white mb-2">Mot de passe mis à jour !</h2>
              <p className="text-white/50 text-sm">Redirection vers votre compte…</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <Lock className="w-7 h-7 text-white/70" />
                </div>
                <h1 className="text-2xl font-black text-white">Nouveau mot de passe</h1>
                <p className="text-white/50 text-sm mt-1">Choisissez un mot de passe sécurisé</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-white/75 mb-2">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                    <input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 caractères"
                      required
                      minLength={8}
                      style={{ ...INPUT, fontSize: 16 }}
                      className="w-full rounded-xl pl-10 pr-11 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#E9E900]"
                    />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white/75 mb-2">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                    <input
                      type={showPwd ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Répétez le mot de passe"
                      required
                      style={{ ...INPUT, fontSize: 16 }}
                      className="w-full rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#E9E900]"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <Button type="submit" variant="brand" size="lg" loading={loading} className="w-full">
                  Enregistrer le mot de passe
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
