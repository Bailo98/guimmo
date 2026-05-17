import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail, emailSearchAlert } from "../_shared/notify.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
const APP_URL = Deno.env.get("APP_URL") ?? "https://guimmo-orcin.vercel.app";

async function getEmail(userId: string): Promise<string | null> {
  const { data } = await supabase.auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}

function buildAlertLabel(filters: Record<string, unknown>): string {
  const parts: string[] = [];
  if (filters.type) parts.push(String(filters.type));
  if (filters.transaction_type) parts.push(String(filters.transaction_type));
  if (filters.wilaya) parts.push(String(filters.wilaya));
  if (filters.max_price) parts.push(`≤ ${Number(filters.max_price).toLocaleString("fr-FR")} GNF`);
  return parts.join(" · ") || "Recherche sauvegardée";
}

Deno.serve(async () => {
  // Listings published in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: newListings } = await supabase
    .from("properties")
    .select("id, title, type, transaction_type, price, wilaya, commune")
    .eq("status", "active")
    .gte("created_at", oneHourAgo);

  if (!newListings?.length) {
    return new Response(JSON.stringify({ notified: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: searches } = await supabase
    .from("saved_searches")
    .select("id, user_id, filters, profiles(full_name)");

  let notified = 0;
  for (const search of searches ?? []) {
    const profile = Array.isArray(search.profiles) ? search.profiles[0] : search.profiles;
    const email = await getEmail(search.user_id);
    if (!email) {
      console.warn(`[notify-saved-searches] no email for user ${search.user_id}`);
      continue;
    }

    const filters = search.filters as Record<string, unknown>;
    const matches = newListings.filter((p) => {
      if (filters.type && p.type !== filters.type) return false;
      if (filters.transaction_type && p.transaction_type !== filters.transaction_type) return false;
      if (filters.wilaya && p.wilaya !== filters.wilaya) return false;
      if (filters.max_price && p.price > (filters.max_price as number)) return false;
      if (filters.min_price && p.price < (filters.min_price as number)) return false;
      return true;
    });

    if (!matches.length) continue;

    // Dedup: skip listings already notified for this search
    const { data: alreadySent } = await supabase
      .from("notifications_sent")
      .select("property_id")
      .eq("saved_search_id", search.id)
      .in("property_id", matches.map((m) => m.id));

    const sentIds = new Set((alreadySent ?? []).map((r) => r.property_id));
    const toNotify = matches.filter((m) => !sentIds.has(m.id));
    if (!toNotify.length) continue;

    const userName = profile?.full_name?.split(" ")[0] ?? "cher utilisateur";
    const alertLabel = buildAlertLabel(filters);
    const tpl = emailSearchAlert(userName, alertLabel, toNotify, APP_URL);
    await sendEmail(email, tpl.subject, tpl.html);
    notified++;

    // Record sent notifications to avoid duplicates
    await supabase.from("notifications_sent").insert(
      toNotify.map((p) => ({
        saved_search_id: search.id,
        user_id: search.user_id,
        property_id: p.id,
      })),
    );
  }

  console.log(`[notify-saved-searches] notified=${notified}`);
  return new Response(JSON.stringify({ notified }), {
    headers: { "Content-Type": "application/json" },
  });
});
