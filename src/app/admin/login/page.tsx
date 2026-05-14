"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Small delay for UX feel
    setTimeout(() => {
      if (password === "BienLoger@2025") {
        localStorage.setItem("BienLoger-admin-session", "authenticated");
        window.location.href = "/admin";
      } else {
        setError("Mot de passe incorrect");
        setLoading(false);
      }
    }, 400);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111418",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "#1e2430",
          borderRadius: "1.5rem",
          padding: "2.5rem 2rem",
          border: "1px solid #2a3040",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              fontSize: "2.25rem",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              marginBottom: "0.5rem",
            }}
          >
            <span style={{ color: "#CE1126" }}>Gu</span>
            <span style={{ color: "#FCD116" }}>Im</span>
            <span style={{ color: "#009460" }}>mo</span>
          </div>
          <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>
            Panneau d&apos;administration
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label
              htmlFor="password"
              style={{
                display: "block",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#94a3b8",
                marginBottom: "0.5rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              autoComplete="current-password"
              required
              style={{
                width: "100%",
                background: "#151922",
                border: error ? "1px solid #ef4444" : "1px solid #2a3040",
                borderRadius: "0.75rem",
                padding: "0.75rem 1rem",
                fontSize: "0.875rem",
                color: "#fff",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => {
                if (!error) e.target.style.borderColor = "#F97316";
              }}
              onBlur={(e) => {
                if (!error) e.target.style.borderColor = "#2a3040";
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "0.75rem",
                padding: "0.75rem 1rem",
                fontSize: "0.875rem",
                color: "#f87171",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span>✗</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: loading ? "#7c3b0c" : "#F97316",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.875rem",
              padding: "0.875rem",
              borderRadius: "0.75rem",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
              marginTop: "0.5rem",
            }}
          >
            {loading ? "Connexion en cours…" : "Se connecter"}
          </button>
        </form>

        {/* Footer hint */}
        <p
          style={{
            textAlign: "center",
            color: "#475569",
            fontSize: "0.75rem",
            marginTop: "1.5rem",
            marginBottom: 0,
          }}
        >
          Accès réservé aux administrateurs BienLoger
        </p>
      </div>
    </div>
  );
}
