import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail, emailMonthlyReport } from "../_shared/notify.ts";

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
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Fetch all owners who have active listings
  const { data: owners } = await supabase
    .from("properties")
    .select("owner_id, profiles!inner(full_name)")
    .eq("status", "active");

  if (!owners?.length) {
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Deduplicate by owner_id
  const ownerMap = new Map<string, { full_name: string | null }>();
  for (const row of owners) {
    if (!ownerMap.has(row.owner_id)) {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      ownerMap.set(row.owner_id, profile);
    }
  }

  let sent = 0;
  for (const [ownerId, profile] of ownerMap) {
    const email = await getEmail(ownerId);
    if (!email) {
      console.warn(`[monthly-report] no email for owner ${ownerId}`);
      continue;
    }

    // Count their active listings
    const { count: activeCount } = await supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", ownerId)
      .eq("status", "active");

    // Views & contacts last month
    const { data: statsData } = await supabase
      .from("listing_stats")
      .select("views, contacts")
      .eq("owner_id", ownerId)
      .gte("updated_at", firstOfMonth)
      .lt("updated_at", firstOfThisMonth);

    const totalViews = (statsData ?? []).reduce((s, r) => s + (r.views ?? 0), 0);
    const totalContacts = (statsData ?? []).reduce((s, r) => s + (r.contacts ?? 0), 0);

    const month = new Date(firstOfMonth).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    const ownerName = profile?.full_name?.split(" ")[0] ?? "cher propriétaire";

    const tpl = emailMonthlyReport(
      ownerName,
      month,
      { views: totalViews, contacts: totalContacts, active: activeCount ?? 0 },
      `${APP_URL}/compte`,
    );
    await sendEmail(email, tpl.subject, tpl.html);
    sent++;
  }

  console.log(`[monthly-report] sent=${sent}/${ownerMap.size}`);
  return new Response(JSON.stringify({ sent, total: ownerMap.size }), {
    headers: { "Content-Type": "application/json" },
  });
});
