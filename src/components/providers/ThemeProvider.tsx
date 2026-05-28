"use client";

/**
 * ZustandThemeSync
 * ─────────────────
 * next-themes owns the actual <html class="dark|light"> management.
 * This component just keeps the Zustand store in sync so that any
 * legacy code reading useAppStore().theme still gets the right value.
 */

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useAppStore } from "@/lib/store";

export function ZustandThemeSync() {
  const { resolvedTheme } = useTheme();
  const setTheme = useAppStore((s) => s.setTheme);

  useEffect(() => {
    if (resolvedTheme === "dark" || resolvedTheme === "light") {
      setTheme(resolvedTheme);
    }
  }, [resolvedTheme, setTheme]);

  return null;
}
