"use client";
import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

function AuthCallbackInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      window.location.href = "/connexion";
      return;
    }

    const code = searchParams.get("code");

    async function handleCallback() {
      if (code) {
        // PKCE flow
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data } = await (supabase!.auth as any).exchangeCodeForSession(code);
          if (data?.session) {
            document.cookie = `guimmo-auth=supabase-session; path=/; max-age=${60 * 60 * 24 * 30}`;
            window.location.href = "/compte";
            return;
          }
        } catch {
          // fallthrough to session check
        }
      }

      // Listen for auth state change (implicit flow or delayed PKCE)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: { subscription } } = supabase!.auth.onAuthStateChange((event: any, session: any) => {
        if (event === "SIGNED_IN" && session) {
          document.cookie = `guimmo-auth=supabase-session; path=/; max-age=${60 * 60 * 24 * 30}`;
          subscription.unsubscribe();
          window.location.href = "/compte";
        }
      });

      // Also check immediately
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: { session } } = await supabase!.auth.getSession() as any;
      if (session) {
        document.cookie = `guimmo-auth=supabase-session; path=/; max-age=${60 * 60 * 24 * 30}`;
        subscription.unsubscribe();
        window.location.href = "/compte";
        return;
      }

      // Timeout fallback
      setTimeout(() => {
        subscription.unsubscribe();
        window.location.href = "/connexion";
      }, 5000);
    }

    handleCallback();
  }, [searchParams]);

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
