import { createClient } from "@supabase/supabase-js";
import { cache } from "react";

export const getContactWhatsApp = cache(async (): Promise<string> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return "224628222510";
  try {
    const db = createClient(url, key);
    const { data } = await db
      .from("site_config")
      .select("value")
      .eq("key", "contact_whatsapp")
      .single();
    if (data?.value) {
      const raw =
        typeof data.value === "string"
          ? data.value
          : String(data.value);
      const digits = raw.replace(/\D/g, "");
      return digits || "224628222510";
    }
    return "224628222510";
  } catch {
    return "224628222510";
  }
});
