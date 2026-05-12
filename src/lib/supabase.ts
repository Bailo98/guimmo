import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(url && key);

export const supabase = isSupabaseConfigured
  ? createClient(url, key, {
      auth: {
        flowType: "pkce",
        // Server route handler (route.ts) does the exchange — browser client
        // must not touch the code.
        detectSessionInUrl: false,
        persistSession: true,
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
      },
    })
  : null;
