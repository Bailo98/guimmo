import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Listings pending for more than 72h with all required fields → auto-approve
const AUTO_APPROVE_HOURS = 72;
// Listings pending for more than 7 days with incomplete data → auto-reject
const AUTO_REJECT_DAYS = 7;

const REQUIRED_FIELDS = ["title", "price", "wilaya", "type", "transaction_type"];

Deno.serve(async () => {
  const now = Date.now();
  const approveThreshold = new Date(now - AUTO_APPROVE_HOURS * 60 * 60 * 1000).toISOString();
  const rejectThreshold = new Date(now - AUTO_REJECT_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // Fetch all listings that have been pending
  const { data: pending } = await supabase
    .from("properties")
    .select("id, title, price, wilaya, type, transaction_type, description, created_at")
    .eq("status", "pending");

  let approved = 0;
  let rejected = 0;

  for (const prop of pending ?? []) {
    const isComplete = REQUIRED_FIELDS.every(
      (f) => prop[f as keyof typeof prop] != null && prop[f as keyof typeof prop] !== "",
    ) && (prop.description?.length ?? 0) >= 20;

    const createdAt = prop.created_at as string;

    if (isComplete && createdAt < approveThreshold) {
      // Well-formed listing pending too long → approve
      const { error } = await supabase
        .from("properties")
        .update({ status: "active", moderated_at: new Date().toISOString() })
        .eq("id", prop.id);
      if (!error) approved++;
    } else if (!isComplete && createdAt < rejectThreshold) {
      // Incomplete listing pending more than 7 days → reject
      const { error } = await supabase
        .from("properties")
        .update({ status: "rejected", moderated_at: new Date().toISOString() })
        .eq("id", prop.id);
      if (!error) rejected++;
    }
  }

  console.log(`[auto-moderate] approved=${approved} rejected=${rejected} pending=${(pending ?? []).length}`);
  return new Response(JSON.stringify({ approved, rejected }), {
    headers: { "Content-Type": "application/json" },
  });
});
