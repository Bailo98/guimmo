import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(url && key);

export const supabase = isSupabaseConfigured
  ? createClient(url, key, {
      auth: {
        flowType: "pkce",
        // Let the client auto-detect and exchange the code from the URL.
        // Manual exchangeCodeForSession caused double-exchange: the client's
        // internal init could consume the code first, making the manual call fail.
        detectSessionInUrl: true,
        persistSession: true,
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
      },
    })
  : null;
