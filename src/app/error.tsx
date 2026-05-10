"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { RefreshCw, Home } from "lucide-react";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{ backgroundColor: "#111418" }}
    >
      {/* Animated "!" */}
      <motion.div
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="mb-8"
      >
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl font-black"
          style={{ backgroundColor: "#F97316", color: "#fff" }}
        >
          !
        </div>
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-3xl font-black text-white mb-3"
      >
        Oops, une erreur est survenue
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="text-base mb-10 max-w-sm"
        style={{ color: "#94a3b8" }}
      >
        Nous travaillons à résoudre ce problème. Merci pour votre patience.
      </motion.p>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <button
          onClick={reset}
          className="flex items-center justify-center gap-2 font-bold px-7 py-3 rounded-xl transition-colors"
          style={{ backgroundColor: "#F97316", color: "#fff" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#EA6C0A")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#F97316")}
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
        <Link
          href="/"
          className="flex items-center justify-center gap-2 font-semibold px-7 py-3 rounded-xl transition-colors border"
          style={{ color: "#fff", borderColor: "rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          <Home className="w-4 h-4" />
          Retour à l&apos;accueil
        </Link>
      </motion.div>

      {/* Footer logo */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="absolute bottom-8 flex items-center gap-2"
      >
        <span className="text-lg font-black" style={{ color: "#F97316" }}>Loger</span>
        <span className="text-lg font-black text-white">Bien</span>
        <span className="text-xs ml-2" style={{ color: "#475569" }}>— Plateforme immobilière guinéenne</span>
      </motion.footer>
    </div>
  );
}
