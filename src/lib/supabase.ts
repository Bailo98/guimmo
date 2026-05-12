import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(url && key);

// createBrowserClient stores the PKCE code_verifier in cookies (not localStorage)
// so the server-side route handler can read it to complete the exchange.
export const supabase = isSupabaseConfigured
  ? createBrowserClient(url, key)
  : null;
