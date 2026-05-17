import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async () => {
  const results: Record<string, number> = {};

  // 1. Delete notifications_sent older than 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: deletedNotifs } = await supabase
    .from("notifications_sent")
    .delete()
    .lt("created_at", thirtyDaysAgo)
    .select("id");
  results.notifications_sent = deletedNotifs?.length ?? 0;

  // 2. Delete resolved reports older than 90 days
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data: deletedReports } = await supabase
    .from("reports")
    .delete()
    .eq("resolved", true)
    .lt("created_at", ninetyDaysAgo)
    .select("id");
  results.reports = deletedReports?.length ?? 0;

  // 3. Delete rejected listings older than 60 days
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const { data: deletedListings } = await supabase
    .from("properties")
    .delete()
    .eq("status", "rejected")
    .lt("created_at", sixtyDaysAgo)
    .select("id");
  results.rejected_listings = deletedListings?.length ?? 0;

  // 4. Delete cleanup_logs older than 1 year
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("cleanup_logs")
    .delete()
    .lt("created_at", oneYearAgo);

  // 5. Log this run
  await supabase.from("cleanup_logs").insert({
    ran_at: new Date().toISOString(),
    results,
  });

  console.log("[cleanup]", results);
  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" },
  });
});
