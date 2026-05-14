"use client";
import { useState, useRef, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";

interface VoiceSearchButtonProps {
  onResult: (text: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function VoiceSearchButton({ onResult, className = "", style }: VoiceSearchButtonProps) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SR);
  }, []);

  if (!supported) return null;

  function toggle() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    if (listening) { recRef.current?.stop(); return; }

    const rec = new SR();
    recRef.current = rec;
    // Try fr-GN first, browsers fall back automatically if not supported
    rec.lang = "fr-GN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => setListening(true);
    rec.onend   = () => setListening(false);
    rec.onerror = (e: { error: string }) => {
      setListening(false);
      // fr-GN not recognized by browser — retry with fr-FR
      if (e.error === "language-not-supported" || e.error === "network") {
        const rec2 = new SR();
        recRef.current = rec2;
        rec2.lang = "fr-FR";
        rec2.interimResults = false;
        rec2.maxAlternatives = 1;
        rec2.onstart = () => setListening(true);
        rec2.onend   = () => setListening(false);
        rec2.onerror = () => setListening(false);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rec2.onresult = (e2: any) => { onResult(e2.results[0][0].transcript); };
        try { rec2.start(); } catch { /* silent */ }
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => { onResult(e.results[0][0].transcript); };
    try { rec.start(); } catch { setListening(false); }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={listening ? "Arrêter le micro" : "Recherche vocale"}
      className={className}
      style={{
        position: "relative",
        minHeight: 52,
        minWidth: 52,
        borderRadius: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: listening ? "1px solid rgba(239,68,68,0.50)" : "1px solid rgba(247,242,230,0.18)",
        background: listening ? "rgba(239,68,68,0.15)" : "rgba(247,242,230,0.07)",
        color: listening ? "#f87171" : "rgba(247,242,230,0.60)",
        flexShrink: 0,
        transition: "all 0.2s",
        ...style,
      }}
    >
      {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      {listening && (
        <span
          className="absolute w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"
          style={{ top: 6, right: 6 }}
        />
      )}
    </button>
  );
}
