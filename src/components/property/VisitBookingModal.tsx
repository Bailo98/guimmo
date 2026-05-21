"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, CalendarCheck, MapPin, Video, Play } from "lucide-react";
import type { Property } from "@/types";

interface Props {
  property: Property;
  onClose: () => void;
  initialTab?: "physical" | "virtual";
}

const TIME_SLOTS = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

function getTodayString() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

function buildWhatsAppUrl(phone: string, message: string) {
  const clean = phone.replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function VisitBookingModal({ property, onClose, initialTab = "physical" }: Props) {
  const [tab, setTab] = useState<"physical" | "virtual">(initialTab);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [mounted, setMounted] = useState(false);
  const portalRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    portalRef.current = document.body;
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const today = getTodayString();

  function handleConfirm() {
    if (!date || !time || !name) return;
    const msg = `Bonjour, je souhaite réserver une visite pour ${property.title} le ${date} à ${time}. Mon nom: ${name}. Réf: #${property.id}`;
    const url = buildWhatsAppUrl(property.contact_phone ?? "", msg);
    window.open(url, "_blank");
  }

  function handleContactWhatsApp() {
    const msg = `Bonjour, je suis intéressé(e) par la visite virtuelle de ${property.title}. Réf: #${property.id}`;
    const url = buildWhatsAppUrl(property.contact_phone ?? "", msg);
    window.open(url, "_blank");
  }

  const canConfirm = date && time && name.trim();

  if (!mounted || !portalRef.current) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md bg-[#2c2f36] rounded-2xl shadow-2xl overflow-hidden"
        style={{ animation: "modalScaleIn 0.2s ease-out both" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#1e2a30]">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-[#E9E900]" />
            <h2 className="font-bold text-slate-900 dark:text-white text-lg">Réserver une visite</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-[#151922] hover:bg-slate-200 dark:hover:bg-[#0e1218] transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Property title */}
        <div className="px-5 pt-3 pb-0">
          <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 line-clamp-1">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            {property.title}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex mx-5 mt-4 bg-slate-100 dark:bg-[#151922] rounded-xl p-1 gap-1">
          <button
            onClick={() => setTab("physical")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === "physical"
                ? "bg-[#2c2f36] text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            Visite physique
          </button>
          <button
            onClick={() => setTab("virtual")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === "virtual"
                ? "bg-[#2c2f36] text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <Video className="w-4 h-4" />
            Visite 360°
          </button>
        </div>

        {/* Tab content */}
        <div className="px-5 pt-4 pb-5">
          {tab === "physical" ? (
            <div className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Date de visite
                </label>
                <input
                  type="date"
                  min={today}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#1e2a30] bg-[#2c2f36] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E9E900]/40 focus:border-[#E9E900] transition"
                />
              </div>

              {/* Time slots */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Heure préférée
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setTime(slot)}
                      className={`py-2 rounded-xl text-sm font-semibold transition-all ${
                        time === slot
                          ? "bg-[#E9E900] text-white shadow-[0_2px_10px_rgba(249,115,22,0.35)]"
                          : "bg-slate-100 dark:bg-[#151922] text-slate-600 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-[#E9E900]"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Votre nom
                </label>
                <input
                  type="text"
                  placeholder="Prénom et nom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#1e2a30] bg-[#2c2f36] text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E9E900]/40 focus:border-[#E9E900] transition"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Votre téléphone <span className="font-normal text-slate-400">(optionnel)</span>
                </label>
                <input
                  type="tel"
                  placeholder="+224 6XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#1e2a30] bg-[#2c2f36] text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E9E900]/40 focus:border-[#E9E900] transition"
                />
              </div>

              {/* Confirm button */}
              <button
                onClick={handleConfirm}
                disabled={!canConfirm}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all ${
                  canConfirm
                    ? "bg-[#E9E900] hover:bg-[#c4c400] active:scale-95 text-white shadow-[0_4px_20px_rgba(249,115,22,0.35)]"
                    : "bg-slate-200 dark:bg-[#151922] text-slate-400 cursor-not-allowed"
                }`}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Confirmer la visite
              </button>

              {/* Info */}
              <p className="text-center text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#25D366] flex-shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                La confirmation se fait par WhatsApp avec le propriétaire
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {false ? (
                <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-[#151922]" />
              ) : (
                <div className="w-full aspect-video rounded-xl bg-slate-100 dark:bg-[#151922] flex flex-col items-center justify-center gap-3 text-center px-6">
                  <div className="w-16 h-16 bg-slate-200 dark:bg-[#2a3040] rounded-2xl flex items-center justify-center">
                    <Play className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                    Visite 360° bientôt disponible pour cette annonce
                  </p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs">
                    Contactez directement le propriétaire pour organiser une visite
                  </p>
                </div>
              )}

              <button
                onClick={handleContactWhatsApp}
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] active:scale-95 text-white font-bold py-3.5 rounded-xl transition-all text-sm shadow-[0_4px_20px_rgba(37,211,102,0.3)]"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Contacter sur WhatsApp
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes modalScaleIn {
          from { opacity: 0; transform: scale(0.93); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>,
    portalRef.current
  );
}
