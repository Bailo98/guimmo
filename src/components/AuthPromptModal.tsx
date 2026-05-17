"use client";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface Props {
  onClose: () => void;
  redirectUrl: string;
  action?: string;
}

export function AuthPromptModal({ onClose, redirectUrl, action }: Props) {
  const router = useRouter();
  const encoded = encodeURIComponent(redirectUrl);

  function goSignup() {
    onClose();
    router.push(`/inscription?redirect=${encoded}`);
  }

  function goLogin() {
    onClose();
    router.push(`/connexion?redirect=${encoded}`);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[360px] rounded-[20px] p-8 text-center"
        style={{ background: "#111a1f", border: "1px solid #1e2a30" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
          style={{ color: "#666666", background: "rgba(255,255,255,0.06)" }}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="text-4xl mb-4">🏠</div>

        {/* Title */}
        <h2 className="font-black text-[20px] mb-2" style={{ color: "#ffffff", fontFamily: "Georgia, serif" }}>
          Créez votre compte gratuit
        </h2>

        {/* Subtitle */}
        <p className="text-sm mb-6 leading-relaxed" style={{ color: "#666666" }}>
          Pour{" "}
          <span style={{ color: "#E9E900" }}>{action ?? "contacter ce propriétaire"}</span>
          , créez votre compte BienLoger. C&apos;est gratuit et rapide.
        </p>

        {/* Buttons */}
        <button
          onClick={goSignup}
          className="w-full flex items-center justify-center gap-2 font-bold text-white rounded-2xl mb-3 transition-colors"
          style={{ background: "#E9E900", height: 52, fontSize: 15 }}
        >
          Créer mon compte →
        </button>
        <button
          onClick={goLogin}
          className="w-full flex items-center justify-center font-semibold rounded-2xl transition-colors"
          style={{ border: "1px solid rgba(255,255,255,0.20)", color: "rgba(255,255,255,0.80)", height: 48, fontSize: 14 }}
        >
          J&apos;ai déjà un compte
        </button>
      </div>
    </div>
  );
}
