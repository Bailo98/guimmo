"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Headset, MessageCircle, X, Send } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Only rendered on the home page — avoids cluttering every detail / listing page

const QUICK_SUGGESTIONS = [
  "Appartement à louer à Kipé",
  "Prix des villas à Ratoma",
  "Comment publier une annonce ?",
  "Maisons à vendre à Conakry",
];

/** Converts markdown [text](url) links to <a> elements */
function parseLinks(text: string): React.ReactNode[] {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (!m) return part;
    const isExternal = m[2].startsWith("http");
    return (
      <a
        key={i}
        href={m[2]}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        style={{ color: "var(--accent-gold)", textDecoration: "underline", textUnderlineOffset: 2 }}
      >
        {m[1]}
      </a>
    );
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ChatbotWidget({ whatsappNumber }: { whatsappNumber?: string }) {
  const pathname  = usePathname();
  const [mounted, setMounted]   = useState(false);
  const [open,    setOpen]      = useState(false);
  const [showTip, setShowTip]   = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,   setInput]     = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setMounted(true);
      try {
        setShowTip(window.localStorage.getItem("lb-assistant-tip-seen") !== "1");
      } catch {
        setShowTip(false);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const dismissTip = () => {
    setShowTip(false);
    try {
      window.localStorage.setItem("lb-assistant-tip-seen", "1");
    } catch {
      // localStorage can be unavailable in private contexts.
    }
  };

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      const userMsg: Message = { role: "user", content: text.trim() };
      const updated = [...messages, userMsg];
      setMessages(updated);
      setInput("");
      setLoading(true);
      try {
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: updated }),
        });
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message ?? "Je n'ai pas pu répondre. Réessayez 🙏" },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Désolé, je rencontre un problème. Contactez-nous sur WhatsApp 📱" },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading],
  );

  if (!mounted || pathname !== "/") return null;

  return (
    <>
      {/* ── Chat panel ───────────────────────────────────────────────── */}
      {open && (
        <div
          style={{
            position: "fixed",
            // Panel sits above the FAB (52 px) + gap (8 px), itself above the pill nav
            bottom: "calc(76px + env(safe-area-inset-bottom, 0px) + 16px + 60px)",
            left: 16,
            zIndex: 61,
            width: "min(320px, calc(100vw - 32px))",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: 440,
              borderRadius: 20,
              overflow: "hidden",
              background: "#1e2830",
              boxShadow: "0 12px 48px rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--accent-gold)",
                padding: "12px 16px",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    width: 30, height: 30, borderRadius: "50%",
                    background: "rgba(0,0,0,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 800, color: "var(--bg-primary)",
                  }}
                >
                  LB
                </span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--bg-primary)", lineHeight: 1.2 }}>
                    Assistant LogerBien
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: "#333" }}>En ligne · propulsé par IA</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                style={{
                  background: "rgba(0,0,0,0.12)", border: "none", borderRadius: "50%",
                  width: 28, height: 28, cursor: "pointer", color: "var(--bg-primary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  minHeight: "auto",
                }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1, overflowY: "auto",
                padding: 12,
                display: "flex", flexDirection: "column", gap: 8,
              }}
            >
              {/* Welcome + quick suggestions when no messages yet */}
              {messages.length === 0 && (
                <>
                  <div
                    style={{
                      alignSelf: "flex-start",
                      background: "#2c3a44",
                      borderRadius: "16px 16px 16px 4px",
                      padding: "10px 14px",
                      fontSize: 13, lineHeight: 1.5, color: "#f0f0f0",
                      maxWidth: "88%",
                    }}
                  >
                    Bonjour ! 👋 Je suis l&apos;assistant LogerBien. Comment puis-je vous aider à trouver votre logement à Conakry ?
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                    {QUICK_SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        style={{
                          background: "transparent",
                          border: "1px solid rgba(212,175,55,0.35)",
                          color: "var(--accent-gold)",
                          borderRadius: 999, padding: "5px 11px",
                          fontSize: 11, fontWeight: 500, cursor: "pointer",
                          transition: "background 0.15s",
                          minHeight: "auto",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(212,175,55,0.08)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Conversation */}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "88%",
                      borderRadius:
                        msg.role === "user"
                          ? "16px 16px 4px 16px"
                          : "16px 16px 16px 4px",
                      padding: "10px 14px",
                      fontSize: 13, lineHeight: 1.5,
                      background: msg.role === "user" ? "var(--accent-gold)" : "#2c3a44",
                      color: msg.role === "user" ? "var(--bg-primary)" : "#f0f0f0",
                    }}
                  >
                    {msg.role === "assistant"
                      ? parseLinks(msg.content)
                      : msg.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div
                    style={{
                      background: "#2c3a44",
                      borderRadius: "16px 16px 16px 4px",
                      padding: "12px 16px",
                      display: "flex", gap: 5, alignItems: "center",
                    }}
                  >
                    {[0, 1, 2].map((j) => (
                      <span
                        key={j}
                        style={{
                          width: 7, height: 7,
                          borderRadius: "50%",
                          background: "var(--accent-gold)",
                          display: "inline-block",
                          animation: `lb-bounce 1.2s ease-in-out ${j * 0.2}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.06)",
                padding: "10px 12px",
                display: "flex", gap: 8, alignItems: "center",
                flexShrink: 0,
              }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder="Posez votre question…"
                style={{
                  flex: 1,
                  background: "var(--bg-card)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 999,
                  color: "var(--text-primary)",
                  fontSize: 13,
                  padding: "9px 14px",
                  outline: "none",
                  fontFamily: "inherit",
                  minHeight: "auto",
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                aria-label="Envoyer"
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: input.trim() && !loading ? "var(--accent-gold)" : "rgba(255,255,255,0.07)",
                  border: "none",
                  cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.2s",
                  flexShrink: 0,
                  minHeight: "auto",
                }}
              >
                <Send
                  style={{
                    width: 14, height: 14,
                    color: input.trim() && !loading ? "var(--bg-primary)" : "rgba(255,255,255,0.25)",
                  }}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {showTip && !open && (
        <div
          style={{
            position: "fixed",
            bottom: "calc(132px + env(safe-area-inset-bottom, 0px) + 16px)",
            left: 12,
            zIndex: 62,
            width: "min(210px, calc(50vw - 18px))",
            borderRadius: 18,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            boxShadow: "0 14px 34px rgba(15, 23, 42, 0.18)",
            padding: "12px",
          }}
        >
          <p style={{ margin: 0, color: "var(--text-primary)", fontSize: 14, fontWeight: 900, lineHeight: 1.25 }}>
            Pose tes questions ici
          </p>
          <button
            onClick={dismissTip}
            style={{
              marginTop: 9,
              minHeight: 34,
              borderRadius: 999,
              border: "none",
              background: "var(--accent-gold)",
              color: "var(--bg-primary)",
              padding: "0 14px",
              fontSize: 13,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Compris
          </button>
        </div>
      )}

      {/* ── FAB toggle ───────────────────────────────────────────────── */}
      <button
        onClick={() => {
          dismissTip();
          setOpen((v) => !v);
        }}
        aria-label="Ouvrir l'assistant LogerBien"
        style={{
          position: "fixed",
          bottom: "calc(76px + env(safe-area-inset-bottom, 0px) + 16px)",
          left: 12,
          zIndex: 60,
          width: 56,
          height: 56,
          minHeight: 56,
          borderRadius: "50%",
          background: "var(--accent-gold)",
          border: "none",
          cursor: "pointer",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          padding: 0,
          boxShadow: "0 4px 20px rgba(212,175,55,0.4)",
          transition: "transform 0.2s, background 0.2s",
          color: "var(--bg-primary)",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
      >
        {open
          ? <X style={{ width: 23, height: 23, color: "var(--bg-primary)" }} />
          : (
            <span style={{ position: "relative", width: 27, height: 27, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Headset style={{ width: 25, height: 25, color: "var(--bg-primary)" }} strokeWidth={2.6} />
              <MessageCircle style={{ position: "absolute", right: -5, bottom: -4, width: 13, height: 13, color: "var(--bg-primary)" }} strokeWidth={3} />
            </span>
          )
        }
      </button>

      {/* Bounce keyframes for typing indicator */}
      <style>{`
        @keyframes lb-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.6; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </>
  );
}
