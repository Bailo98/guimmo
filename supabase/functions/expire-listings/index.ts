import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail, emailReminder, emailExpired } from "../_shared/notify.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
const APP_URL = Deno.env.get("APP_URL") ?? "https://guimmo-orcin.vercel.app";

async function getEmail(userId: string): Promise<string | null> {
  const { data } = await supabase.auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}

Deno.serve(async () => {
  const now = new Date().toISOString();
  const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Send J-3 reminders for listings expiring in the next 3 days
  const { data: soonExpiring } = await supabase
    .from("properties")
    .select("id, title, expires_at, reminder_sent, owner_id, profiles(full_name)")
    .eq("status", "active")
    .eq("reminder_sent", false)
    .lte("expires_at", threeDaysFromNow)
    .gt("expires_at", now);

  let reminded = 0;
  for (const prop of soonExpiring ?? []) {
    const profile = Array.isArray(prop.profiles) ? prop.profiles[0] : prop.profiles;
    const email = await getEmail(prop.owner_id);
    if (email) {
      const ownerName = profile?.full_name?.split(" ")[0] ?? "cher propriétaire";
      const daysLeft = Math.max(1, Math.ceil(
        (new Date(prop.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      ));
      const renewUrl = `${APP_URL}/annonces/${prop.id}`;
      const tpl = emailReminder(ownerName, prop.title, daysLeft, renewUrl);
      await sendEmail(email, tpl.subject, tpl.html);
      reminded++;
    }
    await supabase.from("properties").update({ reminder_sent: true }).eq("id", prop.id);
  }

  // 2. Fetch listings whose expires_at has passed (before bulk update)
  const { data: toExpire } = await supabase
    .from("properties")
    .select("id, title, owner_id, profiles(full_name)")
    .eq("status", "active")
    .lt("expires_at", now);

  // Pause them all
  const { error } = await supabase
    .from("properties")
    .update({ status: "paused" })
    .eq("status", "active")
    .lt("expires_at", now);

  if (error) console.error("[expire-listings] update error:", error);

  // 3. Notify owners of expired listings
  let notifiedExpired = 0;
  for (const prop of toExpire ?? []) {
    const profile = Array.isArray(prop.profiles) ? prop.profiles[0] : prop.profiles;
    const email = await getEmail(prop.owner_id);
    if (email) {
      const ownerName = profile?.full_name?.split(" ")[0] ?? "cher propriétaire";
      const renewUrl = `${APP_URL}/annonces/${prop.id}`;
      const tpl = emailExpired(ownerName, prop.title, renewUrl);
      await sendEmail(email, tpl.subject, tpl.html);
      notifiedExpired++;
    }
  }

  const expiredCount = toExpire?.length ?? 0;
  console.log(`[expire-listings] expired=${expiredCount} reminded=${reminded} notifiedExpired=${notifiedExpired}`);

  return new Response(
    JSON.stringify({ expired: expiredCount, reminded, notifiedExpired }),
    { headers: { "Content-Type": "application/json" } },
  );
});
