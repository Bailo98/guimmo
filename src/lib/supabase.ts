import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(url && key);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = isSupabaseConfigured ? createClient(url, key) : null;
