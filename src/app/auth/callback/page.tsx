"use client";
import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

function AuthCallbackInner() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Connexion en cours...");
  const doneRef = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      window.location.href = "/connexion";
      return;
    }

    const oauthError = searchParams.get("error");
    if (oauthError) {
      const desc = searchParams.get("error_description") || oauthError;
      setStatus(`Erreur : ${desc}`);
      setTimeout(() => { window.location.href = "/connexion"; }, 4000);
      return;
    }

    const redirectTo = searchParams.get("redirect") ?? "/compte";

    function finish(session: { user: unknown } | null) {
      if (doneRef.current) return;
      doneRef.current = true;
      if (session) {
        document.cookie = `guimmo-auth=supabase-session; path=/; max-age=${60 * 60 * 24 * 30}`;
        window.location.href = redirectTo;
      } else {
        setStatus("Authentification échouée");
        setTimeout(() => { window.location.href = "/connexion"; }, 3000);
      }
    }

    // The Supabase client (detectSessionInUrl: true) auto-exchanges the code
    // from the URL. We just listen for the resulting SIGNED_IN event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          finish(session);
        }
      }
    );

    // Race guard: exchange may have already completed before the listener fired
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) finish(session);
    });

    // Hard timeout: if nothing fires after 10s, give up
    const timer = setTimeout(() => {
      if (!doneRef.current) {
        setStatus("Délai dépassé. Veuillez réessayer.");
        setTimeout(() => { window.location.href = "/connexion"; }, 2000);
      }
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
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
