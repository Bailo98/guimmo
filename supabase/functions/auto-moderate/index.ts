import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail, emailAutoApproved, emailRejected } from "../_shared/notify.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
const APP_URL = Deno.env.get("APP_URL") ?? "https://guimmo-orcin.vercel.app";

// Listings pending for more than 72h with all required fields → auto-approve
const AUTO_APPROVE_HOURS = 72;
// Listings pending for more than 7 days with incomplete data → auto-reject
const AUTO_REJECT_DAYS = 7;

const REQUIRED_FIELDS = ["title", "price", "wilaya", "type", "transaction_type"];

async function getEmail(userId: string): Promise<string | null> {
  const { data } = await supabase.auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}

Deno.serve(async () => {
  const now = Date.now();
  const approveThreshold = new Date(now - AUTO_APPROVE_HOURS * 60 * 60 * 1000).toISOString();
  const rejectThreshold = new Date(now - AUTO_REJECT_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: pending } = await supabase
    .from("properties")
    .select("id, title, price, wilaya, type, transaction_type, description, created_at, owner_id, profiles(full_name)")
    .eq("status", "pending");

  let approved = 0;
  let rejected = 0;

  for (const prop of pending ?? []) {
    const profile = Array.isArray(prop.profiles) ? prop.profiles[0] : prop.profiles;
    const isComplete = REQUIRED_FIELDS.every(
      (f) => prop[f as keyof typeof prop] != null && prop[f as keyof typeof prop] !== "",
    ) && (prop.description?.length ?? 0) >= 20;

    const createdAt = prop.created_at as string;
    const ownerName = profile?.full_name?.split(" ")[0] ?? "cher propriétaire";

    if (isComplete && createdAt < approveThreshold) {
      const { error } = await supabase
        .from("properties")
        .update({ status: "active", moderated_at: new Date().toISOString() })
        .eq("id", prop.id);
      if (!error) {
        approved++;
        const email = await getEmail(prop.owner_id);
        if (email) {
          const tpl = emailAutoApproved(ownerName, prop.title, `${APP_URL}/annonces/${prop.id}`);
          await sendEmail(email, tpl.subject, tpl.html);
        }
      }
    } else if (!isComplete && createdAt < rejectThreshold) {
      const { error } = await supabase
        .from("properties")
        .update({ status: "rejected", moderated_at: new Date().toISOString() })
        .eq("id", prop.id);
      if (!error) {
        rejected++;
        const email = await getEmail(prop.owner_id);
        if (email) {
          const tpl = emailRejected(
            ownerName,
            prop.title,
            "Informations incomplètes — titre, prix, localisation ou description manquants",
            `${APP_URL}/publier`,
          );
          await sendEmail(email, tpl.subject, tpl.html);
        }
      }
    }
  }

  console.log(`[auto-moderate] approved=${approved} rejected=${rejected} pending=${(pending ?? []).length}`);
  return new Response(JSON.stringify({ approved, rejected }), {
    headers: { "Content-Type": "application/json" },
  });
});
