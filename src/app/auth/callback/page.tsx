"use client";
import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

function AuthCallbackInner() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Connexion en cours...");
  // Guard: prevent double-exchange if searchParams ref changes between renders
  const exchangedRef = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      window.location.href = "/connexion";
      return;
    }

    const code = searchParams.get("code");
    const redirectTo = searchParams.get("redirect") ?? "/compte";
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hashParams.get("access_token");

    // PKCE flow: code in query param
    if (code) {
      // Guard: code is single-use — abort if already exchanged in this page lifecycle
      if (exchangedRef.current) return;
      exchangedRef.current = true;

      setStatus("Échange du code PKCE...");

      // Remove code from URL immediately to prevent re-use on refresh
      const cleanUrl = window.location.pathname + (redirectTo !== "/compte" ? `?redirect=${redirectTo}` : "");
      window.history.replaceState({}, "", cleanUrl);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.auth as any).exchangeCodeForSession(code)
        .then(({ data, error }: any) => {
          if (error) {
            setStatus(`Erreur: ${error.message}`);
            setTimeout(() => { window.location.href = "/connexion"; }, 4000);
            return;
          }
          if (data?.session) {
            document.cookie = `guimmo-auth=supabase-session; path=/; max-age=${60 * 60 * 24 * 30}`;
            window.location.href = redirectTo;
          } else {
            setStatus("Session introuvable après échange");
            setTimeout(() => { window.location.href = "/connexion"; }, 4000);
          }
        })
        .catch((e: Error) => {
          setStatus(`Exception: ${e.message}`);
          setTimeout(() => { window.location.href = "/connexion"; }, 4000);
        });
      return;
    }

    // Implicit flow fallback: access_token in hash (legacy)
    if (accessToken) {
      setStatus("Session via token implicite...");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase.auth.getSession().then(({ data }: any) => {
        if (data?.session) {
          document.cookie = `guimmo-auth=supabase-session; path=/; max-age=${60 * 60 * 24 * 30}`;
          window.location.href = redirectTo;
        } else {
          setTimeout(() => { window.location.href = "/connexion"; }, 2000);
        }
      });
      return;
    }

    // No code and no token
    const error = searchParams.get("error_description") || searchParams.get("error");
    setStatus(error ? `Erreur Google: ${error}` : "Aucun code reçu");
    setTimeout(() => { window.location.href = "/connexion"; }, 4000);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#111418] flex items-center justify-center">
      <div className="text-center max-w-sm px-4">
        <div className="w-12 h-12 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white font-semibold">{status}</p>
        <p className="text-slate-400 text-sm mt-2">Veuillez patienter...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#111418]" />}>
      <AuthCallbackInner />
    </Suspense>
  );
}
