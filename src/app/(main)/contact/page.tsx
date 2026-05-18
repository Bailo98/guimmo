"use client";
import { useState } from "react";
import Link from "next/link";
import { MessageCircle, Phone, Mail, MapPin, Send, CheckCircle } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSending(false);
    setSent(true);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 pb-24">
      <nav className="flex items-center gap-2 text-xs text-slate-400 mb-8">
        <Link href="/" className="hover:text-[#009460]">Accueil</Link>
        <span>/</span>
        <span className="text-slate-600 dark:text-slate-300">Contact</span>
      </nav>

      <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Contactez-nous</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-10">Notre équipe vous répond en moins de 24h.</p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Contact info */}
        <div className="space-y-4">
          <div className="bg-[#2c2f36] rounded-2xl p-5 border border-[#1e2a30] flex items-start gap-4">
            <div className="w-10 h-10 bg-[#25D366]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5 text-[#25D366]" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm mb-0.5">WhatsApp</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-2">Réponse en quelques minutes</p>
              <a
                href="https://wa.me/224628222510"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-[#25D366] hover:underline"
              >
                +224 628 222 510
              </a>
            </div>
          </div>

          <div className="bg-[#2c2f36] rounded-2xl p-5 border border-[#1e2a30] flex items-start gap-4">
            <div className="w-10 h-10 bg-[#009460]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-[#009460]" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm mb-0.5">Téléphone</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-2">Lun–Ven, 8h–18h</p>
              <a href="tel:+224628222510" className="text-sm font-semibold text-[#009460] hover:underline">
                +224 628 222 510
              </a>
            </div>
          </div>

          <div className="bg-[#2c2f36] rounded-2xl p-5 border border-[#1e2a30] flex items-start gap-4">
            <div className="w-10 h-10 bg-[#009460]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-[#009460]" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm mb-0.5">Email</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-2">Réponse sous 24h</p>
              <a href="mailto:contact@BienLoger.gn" className="text-sm font-semibold text-[#009460] hover:underline">
                contact@BienLoger.gn
              </a>
            </div>
          </div>

          <div className="bg-[#2c2f36] rounded-2xl p-5 border border-[#1e2a30] flex items-start gap-4">
            <div className="w-10 h-10 bg-[#009460]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-[#009460]" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm mb-0.5">Adresse</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Kipé, Conakry<br />République de Guinée</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-[#2c2f36] rounded-2xl p-6 border border-[#1e2a30]">
          {sent ? (
            <div className="flex flex-col items-center justify-center h-full py-10 text-center">
              <div className="w-16 h-16 bg-[#009460]/10 rounded-2xl flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-[#009460]" />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Message envoyé !</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Nous vous répondrons dans les plus brefs délais.</p>
              <button
                onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                className="text-sm font-semibold text-[#009460] hover:underline"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="font-bold text-slate-900 dark:text-white mb-4">Envoyer un message</h2>
              {[
                { key: "name", label: "Nom complet", type: "text", placeholder: "Votre nom" },
                { key: "email", label: "Email", type: "email", placeholder: "votre@email.com" },
                { key: "subject", label: "Sujet", type: "text", placeholder: "Objet de votre message" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">{f.label}</label>
                  <input
                    type={f.type}
                    required
                    placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full bg-[#2c2f36] border border-[#1e2a30] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#009460] placeholder:text-slate-400"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Décrivez votre demande..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full bg-[#2c2f36] border border-[#1e2a30] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#009460] placeholder:text-slate-400 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 bg-[#009460] hover:bg-[#007a50] disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors text-sm"
              >
                {sending ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {sending ? "Envoi en cours…" : "Envoyer le message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
