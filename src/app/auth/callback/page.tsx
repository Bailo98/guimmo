"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      router.push("/connexion");
      return;
    }

    const code = searchParams.get("code");

    if (code) {
      // PKCE flow — exchange the code for a session
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.auth as any).exchangeCodeForSession(code).then(({ data }: any) => {
        if (data?.session) {
          document.cookie = `guimmo-auth=supabase-session; path=/; max-age=${60 * 60 * 24 * 30}`;
          router.push("/compte");
        } else {
          router.push("/connexion");
        }
      });
    } else {
      // Implicit flow — session already in URL hash, Supabase handles it
      supabase.auth.getSession().then(({ data: { session } }: { data: { session: unknown } }) => {
        if (session) {
          document.cookie = `guimmo-auth=supabase-session; path=/; max-age=${60 * 60 * 24 * 30}`;
          router.push("/compte");
        } else {
          router.push("/connexion");
        }
      });
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#111418] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white font-semibold">Connexion en cours...</p>
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
