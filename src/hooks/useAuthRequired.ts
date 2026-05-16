"use client";
import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";

export function useAuthRequired() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState("");
  const [action, setAction] = useState<string | undefined>(undefined);

  const requireAuth = useCallback(
    (callback?: () => void, url?: string, actionLabel?: string): boolean => {
      if (!user) {
        setRedirectUrl(url ?? (typeof window !== "undefined" ? window.location.pathname : "/"));
        setAction(actionLabel);
        setShowModal(true);
        return false;
      }
      callback?.();
      return true;
    },
    [user]
  );

  return { requireAuth, showModal, setShowModal, redirectUrl, action };
}
