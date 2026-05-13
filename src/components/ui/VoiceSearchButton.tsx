"use client";
import { useState, useRef } from "react";
import { Mic, MicOff } from "lucide-react";
import { toast } from "@/lib/toast";

interface VoiceSearchButtonProps {
  onResult: (text: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function VoiceSearchButton({ onResult, className = "", style }: VoiceSearchButtonProps) {
  const [listening, setListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);

  function toggle() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast("Micro non supporté sur ce navigateur", "error"); return; }

    if (listening) { recRef.current?.stop(); return; }

    const rec = new SR();
    recRef.current = rec;
    rec.lang = "fr-FR";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => setListening(true);
    rec.onend   = () => setListening(false);
    rec.onerror = () => { setListening(false); toast("Micro indisponible", "error"); };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const text: string = e.results[0][0].transcript;
      onResult(text);
    };
    rec.start();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={listening ? "Arrêter le micro" : "Recherche vocale"}
      className={className}
      style={{
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
      {listening
        ? <MicOff className="w-5 h-5" />
        : <Mic className="w-5 h-5" />}
      {listening && (
        <span
          className="absolute w-3 h-3 rounded-full bg-red-500"
          style={{ top: 8, right: 8, animation: "pulse 1s infinite" }}
        />
      )}
    </button>
  );
}
