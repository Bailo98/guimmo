import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendWhatsApp } from "../_shared/whatsapp.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
const WA_APIKEY = Deno.env.get("CALLMEBOT_API_KEY") ?? "";
const APP_URL = Deno.env.get("APP_URL") ?? "https://guimmo-orcin.vercel.app";

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
    .select("id, user_id, filters, profiles(full_name, phone)");

  let notified = 0;
  for (const search of searches ?? []) {
    const profile = Array.isArray(search.profiles) ? search.profiles[0] : search.profiles;
    if (!profile?.phone || !WA_APIKEY) continue;

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

    const listingLines = toNotify
      .slice(0, 3)
      .map((p) => `• ${p.title} — ${p.price.toLocaleString("fr-FR")} GNF`)
      .join("\n");
    const msg =
      `🔔 *BienLoger* — ${toNotify.length} nouvelle(s) annonce(s) correspondent à votre recherche :\n` +
      `${listingLines}\n` +
      (toNotify.length > 3 ? `et ${toNotify.length - 3} autre(s)…\n` : "") +
      `Voir : ${APP_URL}/annonces`;

    const sent = await sendWhatsApp(profile.phone, msg, WA_APIKEY);
    if (sent) {
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
  }

  console.log(`[notify-saved-searches] notified=${notified}`);
  return new Response(JSON.stringify({ notified }), {
    headers: { "Content-Type": "application/json" },
  });
});
