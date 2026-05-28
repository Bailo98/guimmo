"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const STEPS = [
  {
    title: "Bienvenue sur LogerBien 🏠",
    subtitle: "Trouvez votre logement idéal en Guinée",
  },
  {
    title: "Quel est votre budget ?",
  },
  {
    title: "Votre quartier préféré ?",
  },
];

const BUDGET_OPTIONS = [
  "< 500 000 GNF",
  "500k - 1M GNF",
  "1M - 3M GNF",
  "> 3M GNF",
];

const NEIGHBORHOODS = ["Kipé", "Ratoma", "Lambanyi", "Hamdallaye", "Taouyah", "Dixinn"];

export function OnboardingModal() {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const seen = localStorage.getItem("LogerBien-onboarded");
      if (!seen) {
        setShow(true);
      }
    }
  }, []);

  function finish() {
    if (typeof window !== "undefined") {
      localStorage.setItem("LogerBien-onboarded", "1");
    }
    setShow(false);
  }

  if (!mounted || !show) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden bg-[#2c2f36] shadow-2xl">
        {/* Step 0: orange gradient header */}
        {step === 0 && (
          <div
            className="px-8 pt-10 pb-8 text-center"
            style={{
              background: "linear-gradient(135deg, #D4AF37 0%, #B8963A 100%)",
            }}
          >
            <h2 className="text-2xl font-bold text-white leading-tight">
              {STEPS[0].title}
            </h2>
            <p className="mt-2 text-orange-100 text-sm">{STEPS[0].subtitle}</p>
          </div>
        )}

        {/* Step 1+ header */}
        {step > 0 && (
          <div className="px-8 pt-8 pb-2 text-center">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {STEPS[step].title}
            </h2>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-6">
          {/* Step 0 — intent buttons */}
          {step === 0 && (
            <div className="flex flex-col gap-3">
              {[
                { emoji: "🔑", label: "Je cherche à louer" },
                { emoji: "🏡", label: "Je cherche à acheter" },
                { emoji: "📋", label: "Je veux publier" },
              ].map(({ emoji, label }) => (
                <button
                  key={label}
                  onClick={() => setStep(1)}
                  className="flex items-center gap-3 w-full px-5 py-4 rounded-xl border-2 border-[#1e2a30] bg-[#2c2f36] text-white font-semibold text-sm hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors text-left"
                >
                  <span className="text-xl">{emoji}</span>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Step 1 — budget buttons */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {BUDGET_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => setStep(2)}
                  className="px-4 py-4 rounded-xl border-2 border-[#1e2a30] bg-[#2c2f36] text-white font-semibold text-sm hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors text-center"
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {/* Step 2 — neighborhood buttons */}
          {step === 2 && (
            <div className="grid grid-cols-3 gap-3">
              {NEIGHBORHOODS.map((name) => (
                <button
                  key={name}
                  onClick={() => finish()}
                  className="px-3 py-3 rounded-xl border-2 border-[#1e2a30] bg-[#2c2f36] text-white font-semibold text-sm hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors text-center"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Progress dots + skip */}
        <div className="flex items-center justify-between px-6 pb-6">
          <div className="flex items-center gap-2">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className="block w-2 h-2 rounded-full transition-colors"
                style={{
                  backgroundColor: i <= step ? "#D4AF37" : "#cbd5e1",
                }}
              />
            ))}
          </div>
          <button
            onClick={finish}
            className="text-xs text-slate-400 dark:text-slate-500 hover:text-[#D4AF37] transition-colors"
          >
            Passer
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
