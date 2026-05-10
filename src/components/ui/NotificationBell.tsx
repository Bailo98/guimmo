"use client";
import { Bell, CheckCircle, Info, AlertTriangle, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";

export function NotificationBell() {
  const notifications = useAppStore((s) => s.notifications);
  const markAllRead = useAppStore((s) => s.markAllRead);
  const [open, setOpen] = useState(false);
  const [justMarked, setJustMarked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const count = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  function handleMarkAllRead() {
    markAllRead();
    setJustMarked(true);
    setTimeout(() => setJustMarked(false), 2000);
  }

  function getIcon(type: "success" | "info" | "warning") {
    if (type === "success") return <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />;
    if (type === "warning") return <AlertTriangle className="w-4 h-4 text-[#F97316] shrink-0" />;
    return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Bell className="w-4 h-4" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-[#F97316] text-white text-[10px] font-bold flex items-center justify-center px-0.5 leading-none">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 rounded-2xl shadow-2xl border border-slate-100 dark:border-[#2a3040] bg-white dark:bg-[#1a2030] z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-[#2a3040]">
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
              Notifications {count > 0 && <span className="text-[#F97316]">({count})</span>}
            </span>
            {count > 0 ? (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-medium text-[#F97316] hover:underline"
              >
                {justMarked ? <><Check className="w-3 h-3" /> Lu !</> : "Tout lire"}
              </button>
            ) : (
              <span className="text-xs text-green-500 font-medium flex items-center gap-1">
                <Check className="w-3 h-3" /> Tout lu
              </span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-400 dark:text-slate-500">
              <Bell className="w-8 h-8" />
              <span className="text-sm">Aucune notification</span>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-[#2a3040] max-h-80 overflow-y-auto">
              {notifications.slice(0, 8).map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 transition-colors",
                    !n.read ? "bg-orange-50 dark:bg-orange-900/10" : "bg-white dark:bg-[#1a2030]"
                  )}
                >
                  {getIcon(n.type)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-snug">{n.message}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  {!n.read && <div className="w-2 h-2 bg-[#F97316] rounded-full flex-shrink-0 mt-1.5" />}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
