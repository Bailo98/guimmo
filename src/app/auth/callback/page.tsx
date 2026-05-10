"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      router.push("/connexion");
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: unknown } }) => {
      if (session) {
        document.cookie = `guimmo-auth=supabase-session; path=/; max-age=${60 * 60 * 24 * 30}`;
        router.push("/compte");
      } else {
        router.push("/connexion");
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-[#111418] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white font-semibold">Connexion en cours...</p>
      </div>
    </div>
  );
}
