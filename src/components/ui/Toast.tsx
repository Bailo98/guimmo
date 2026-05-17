"use client";
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), 3000);
  }, [dismiss]);

  const value: ToastContextValue = {
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
    info: (msg) => addToast(msg, "info"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// ─── Toaster ──────────────────────────────────────────────────────────────────

const STYLES: Record<ToastType, { style: React.CSSProperties; textColor: string; icon: React.ReactNode }> = {
  success: {
    style: { background: "rgba(233,233,0,0.10)", border: "1px solid #E9E900" },
    textColor: "#E9E900",
    icon: <CheckCircle className="w-4 h-4 flex-shrink-0" />,
  },
  error: {
    style: { background: "rgba(239,68,68,0.10)", border: "1px solid #ef4444" },
    textColor: "#fca5a5",
    icon: <AlertCircle className="w-4 h-4 flex-shrink-0" />,
  },
  info: {
    style: { background: "rgba(233,233,0,0.10)", border: "1px solid rgba(233,233,0,0.50)" },
    textColor: "#E9E900",
    icon: <Info className="w-4 h-4 flex-shrink-0" />,
  },
};

interface ToasterProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

function Toaster({ toasts, onDismiss }: ToasterProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-20 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none"
    >
      {toasts.map((toast) => {
        const style = STYLES[toast.type];
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-3 w-full max-w-sm px-4 py-3 rounded-xl shadow-lg animate-toast-in text-sm font-medium"
            style={{ ...style.style, color: style.textColor, backdropFilter: "blur(12px)" }}
          >
            {style.icon}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => onDismiss(toast.id)}
              className="flex-shrink-0 ml-1 hover:opacity-70 transition-opacity"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// Named export so layout.tsx can import it independently if needed
export { Toaster };
