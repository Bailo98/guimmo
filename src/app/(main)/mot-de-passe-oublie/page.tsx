"use client";
import { useState } from "react";
import Link from "next/link";
import { Phone, ArrowRight, CheckCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

export default function MotDePasseOubliePage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-[#111418] flex flex-col">
      <div className="p-4">
        <Logo />
      </div>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-[#1e2430] rounded-3xl p-8 border border-[#2a3040]">
          {!sent ? (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#F97316]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-[#F97316]" />
                </div>
                <h1 className="text-2xl font-black text-white">Mot de passe oublié</h1>
                <p className="text-slate-400 text-sm mt-1">Entrez votre numéro pour recevoir un code WhatsApp</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="tel" placeholder="+224 6XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-[#151922] border border-[#2a3040] rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#F97316] text-sm" required />
                </div>
                <Button type="submit" loading={loading} variant="brand" size="lg" className="w-full">
                  Recevoir le code <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-black text-white">Code envoyé !</h2>
              <p className="text-slate-400 text-sm mt-2 mb-6">Vérifiez votre WhatsApp au {phone}</p>
              <Link href="/connexion" className="flex items-center justify-center gap-2 bg-[#F97316] text-white font-bold py-3 rounded-xl hover:bg-[#EA6C0A] transition-colors">
                Retour à la connexion
              </Link>
            </div>
          )}
          <p className="text-center text-sm text-slate-400 mt-6">
            <Link href="/connexion" className="text-[#F97316] hover:underline">← Retour</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
