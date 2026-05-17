import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendWhatsApp } from "../_shared/whatsapp.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
const WA_APIKEY = Deno.env.get("CALLMEBOT_API_KEY") ?? "";
const APP_URL = Deno.env.get("APP_URL") ?? "https://guimmo-orcin.vercel.app";

Deno.serve(async () => {
  const now = new Date().toISOString();
  const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Send J-3 reminders for listings expiring in the next 3 days
  const { data: soonExpiring } = await supabase
    .from("properties")
    .select("id, title, expires_at, reminder_sent, profiles(full_name, phone)")
    .eq("status", "active")
    .eq("reminder_sent", false)
    .lte("expires_at", threeDaysFromNow)
    .gt("expires_at", now);

  let reminded = 0;
  for (const prop of soonExpiring ?? []) {
    const profile = Array.isArray(prop.profiles) ? prop.profiles[0] : prop.profiles;
    if (profile?.phone && WA_APIKEY) {
      const expiresDate = new Date(prop.expires_at).toLocaleDateString("fr-FR");
      const msg =
        `⏰ *BienLoger* — Votre annonce "${prop.title}" expire le ${expiresDate}.\n` +
        `Renouvelez-la ici : ${APP_URL}/annonces/${prop.id}`;
      await sendWhatsApp(profile.phone, msg, WA_APIKEY);
      reminded++;
    }
    await supabase
      .from("properties")
      .update({ reminder_sent: true })
      .eq("id", prop.id);
  }

  // 2. Pause listings whose expires_at has passed
  const { data: expired, error } = await supabase
    .from("properties")
    .update({ status: "paused" })
    .eq("status", "active")
    .lt("expires_at", now)
    .select("id");

  if (error) console.error("[expire-listings] update error:", error);

  const expiredCount = expired?.length ?? 0;
  console.log(`[expire-listings] expired=${expiredCount} reminded=${reminded}`);

  return new Response(
    JSON.stringify({ expired: expiredCount, reminded }),
    { headers: { "Content-Type": "application/json" } },
  );
});
