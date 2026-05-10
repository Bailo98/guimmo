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

    if (!code) {
      window.location.href = "/connexion";
      return;
    }

    // detectSessionInUrl is disabled — we handle the PKCE exchange once here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.auth as any).exchangeCodeForSession(code)
      .then(({ data, error }: any) => {
        if (error || !data?.session) {
          window.location.href = "/connexion";
          return;
        }
        document.cookie = `guimmo-auth=supabase-session; path=/; max-age=${60 * 60 * 24 * 30}`;
        window.location.href = "/compte";
      })
      .catch(() => {
        window.location.href = "/connexion";
      });
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
