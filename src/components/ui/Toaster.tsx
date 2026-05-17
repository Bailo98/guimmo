"use client";
import React, { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { registerToastListener } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const STYLES: Record<string, React.CSSProperties> = {
  success: { background: "rgba(233,233,0,0.10)", border: "1px solid #E9E900", color: "#E9E900" },
  error:   { background: "rgba(239,68,68,0.10)",  border: "1px solid #ef4444", color: "#fca5a5" },
  info:    { background: "rgba(233,233,0,0.08)",  border: "1px solid rgba(233,233,0,0.40)", color: "#E9E900" },
  warning: { background: "rgba(233,233,0,0.10)",  border: "1px solid #E9E900", color: "#E9E900" },
};

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    registerToastListener((event) => {
      setToasts((prev) => [...prev, event]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== event.id));
      }, 3000);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-2 pointer-events-none w-max max-w-[90vw]">
      {toasts.map((t) => {
        const Icon = ICONS[t.type];
        return (
          <div
            key={t.id}
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold animate-[slideUp_0.3s_ease-out]"
            style={{ ...STYLES[t.type], backdropFilter: "blur(12px)" }}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {t.message}
          </div>
        );
      })}
    </div>
  );
}
