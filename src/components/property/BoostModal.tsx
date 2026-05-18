"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Check, Loader2, Star } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { toast } from "@/lib/toast";

interface BoostModalProps {
  propertyId: string;
  propertyTitle: string;
  isBoosted?: boolean;
  boostExpiry?: string;
  onClose: () => void;
}

const BOOST_PLANS = [
  {
    id: "basic",
    label: "Basic",
    days: 7,
    price: 50000,
    priceLabel: "50.000 GNF",
    badge: "Économique",
    badgeColor: "#475569",
    badgeBg: "#e2e8f0",
    advantages: [
      "Mise en avant 7 jours",
      "+300% de vues",
      "Apparition en tête de liste",
    ],
  },
  {
    id: "pro",
    label: "Pro",
    days: 14,
    price: 90000,
    priceLabel: "90.000 GNF",
    badge: "Populaire",
    badgeColor: "#fff",
    badgeBg: "#E9E900",
    popular: true,
    advantages: [
      "Mise en avant 14 jours",
      "+500% de vues",
      "Badge Sponsorisé visible",
      "Notification aux chercheurs",
    ],
  },
  {
    id: "premium",
    label: "Premium",
    days: 30,
    price: 150000,
    priceLabel: "150.000 GNF",
    badge: "Meilleur rapport",
    badgeColor: "#fff",
    badgeBg: "#7c3aed",
    advantages: [
      "Mise en avant 30 jours",
      "+1000% de vues",
      "Priorité absolue",
      "Support dédié",
    ],
  },
];

const PAYMENT_METHODS = [
  { id: "orange", label: "Payer par Orange Money" },
  { id: "mtn", label: "Payer par MTN Mobile Money" },
];

export function BoostModal({ propertyId, propertyTitle, isBoosted, boostExpiry, onClose }: BoostModalProps) {
  const boostListing = useAppStore((s) => s.boostListing);
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [selectedPayment, setSelectedPayment] = useState("orange");
  const [loading, setLoading] = useState(false);

  // Compute remaining boost days if already boosted
  let remainingDays: number | null = null;
  if (isBoosted && boostExpiry) {
    const diff = new Date(boostExpiry).getTime() - Date.now();
    remainingDays = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  async function handleConfirm() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    const plan = BOOST_PLANS.find((p) => p.id === selectedPlan)!;
    boostListing(propertyId, plan.days);
    setLoading(false);
    toast("Annonce boostée avec succès !", "success");
    onClose();
  }

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          key="panel"
          className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-y-auto"
          style={{ backgroundColor: "#1e2430", maxHeight: "92vh" }}
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 pb-4 border-b" style={{ borderColor: "#2a3040" }}>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Zap className="w-5 h-5" style={{ color: "#E9E900" }} />
                <h2 className="text-lg font-black text-white">Booster votre annonce</h2>
              </div>
              <p className="text-xs mt-1 line-clamp-1" style={{ color: "#64748b" }}>
                {propertyTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ml-3"
              style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Already boosted banner */}
            {isBoosted && remainingDays !== null && (
              <div className="rounded-xl p-3 text-sm font-semibold text-white flex items-center gap-2"
                style={{ backgroundColor: "rgba(233,233,0,0.15)", border: "1px solid rgba(249,115,22,0.4)" }}>
                <Star className="w-4 h-4 flex-shrink-0" style={{ color: "#E9E900" }} />
                Votre annonce est boostée encore {remainingDays} jour{remainingDays > 1 ? "s" : ""}
              </div>
            )}

            {/* Plans */}
            <div className="space-y-3">
              {BOOST_PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className="w-full text-left rounded-2xl p-4 border transition-all"
                    style={{
                      borderColor: isSelected ? "#E9E900" : "#2a3040",
                      backgroundColor: isSelected ? "rgba(249,115,22,0.08)" : "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                          style={{
                            borderColor: isSelected ? "#E9E900" : "#475569",
                            backgroundColor: isSelected ? "#E9E900" : "transparent",
                          }}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="font-bold text-white text-sm">{plan.label} — {plan.days} jours</span>
                      </div>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ color: plan.badgeColor, backgroundColor: plan.badgeBg }}
                      >
                        {plan.badge}
                      </span>
                    </div>
                    <p className="text-base font-black ml-6" style={{ color: "#E9E900" }}>
                      {plan.priceLabel}
                    </p>
                    <ul className="ml-6 mt-2 space-y-1">
                      {plan.advantages.map((adv) => (
                        <li key={adv} className="flex items-center gap-1.5 text-xs" style={{ color: "#94a3b8" }}>
                          <Check className="w-3 h-3 flex-shrink-0" style={{ color: "#E9E900" }} />
                          {adv}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            {/* Payment method */}
            <div>
              <p className="text-xs font-semibold mb-3" style={{ color: "#94a3b8" }}>
                MODE DE PAIEMENT
              </p>
              <div className="space-y-2">
                {PAYMENT_METHODS.map((m) => {
                  const isSelected = selectedPayment === m.id;
                  return (
                    <label
                      key={m.id}
                      className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all"
                      style={{
                        borderColor: isSelected ? "#E9E900" : "#2a3040",
                        backgroundColor: isSelected ? "rgba(249,115,22,0.08)" : "rgba(255,255,255,0.03)",
                      }}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={m.id}
                        checked={isSelected}
                        onChange={() => setSelectedPayment(m.id)}
                        className="accent-[#E9E900]"
                      />
                      <span className="text-sm font-semibold" style={{ color: isSelected ? "#E9E900" : "#94a3b8" }}>
                        {m.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl font-semibold text-sm border"
                style={{ borderColor: "#2a3040", color: "#94a3b8", backgroundColor: "transparent" }}
                disabled={loading}
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                style={{ backgroundColor: "#E9E900", color: "#fff", opacity: loading ? 0.8 : 1 }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Confirmer le paiement
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
