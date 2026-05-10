"use client";
import { useEffect, Suspense } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

function AuthCallbackInner() {
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      window.location.href = "/connexion";
      return;
    }

    function redirect(session: unknown) {
      if (!session) return false;
      document.cookie = `guimmo-auth=supabase-session; path=/; max-age=${60 * 60 * 24 * 30}`;
      window.location.href = "/compte";
      return true;
    }

    // Supabase v2 auto-exchanges the PKCE code from the URL on init.
    // We just need to listen for the resulting session — do NOT call
    // exchangeCodeForSession manually (double-exchange kills the code).
    let done = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (event: string, session: any) => {
        if (done) return;
        if (event === "SIGNED_IN" && session) {
          done = true;
          subscription.unsubscribe();
          redirect(session);
        }
      }
    );

    // Also check immediately — the SIGNED_IN event may have already fired
    // before our listener was registered.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.auth.getSession().then(({ data }: any) => {
      if (done) return;
      if (data?.session) {
        done = true;
        subscription.unsubscribe();
        redirect(data.session);
      }
    });

    // Fallback: give Supabase up to 10 seconds to finish the code exchange.
    const timeout = setTimeout(() => {
      if (!done) {
        done = true;
        subscription.unsubscribe();
        window.location.href = "/connexion";
      }
    }, 10000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#111418] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white font-semibold">Connexion en cours...</p>
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
