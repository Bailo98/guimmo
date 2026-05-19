import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── Auth guard ───────────────────────────────────────────────────────────────
// Vercel injects Authorization: Bearer <CRON_SECRET> on scheduled invocations.
// You can also trigger it manually: curl -H "Authorization: Bearer <CRON_SECRET>" /api/check-availability
function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // dev — no secret set, allow
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${cronSecret}`;
}

// ─── WhatsApp link builder ─────────────────────────────────────────────────────
function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

// ─── Route handler ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // In production use SUPABASE_SERVICE_ROLE_KEY to bypass RLS for updates.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? key;

  if (!url || !key) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const db = createClient(url, serviceKey!);

  const now         = new Date();
  const days30Ago   = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const days45Ago   = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString();

  // ── 1. Fetch stale available listings (> 30 days without update) ──────────
  const { data: staleListings, error: fetchErr } = await db
    .from("properties")
    .select("id, title, contact_phone, updated_at")
    .eq("available_now", true)
    .lt("updated_at", days30Ago);

  if (fetchErr) {
    console.error("[check-availability] fetch error:", fetchErr.message);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  const listings = staleListings ?? [];

  const whatsappLinks: string[] = [];
  const autoClosedIds: string[] = [];

  for (const listing of listings) {
    const phone = listing.contact_phone as string | null;
    const updatedAt = new Date(listing.updated_at as string);
    const isOver45 = updatedAt < new Date(days45Ago);

    // ── 2. Build & log WhatsApp reminder link ─────────────────────────────
    if (phone) {
      const message = `Bonjour ! Votre annonce "${listing.title}" sur LogerBien est toujours disponible ? Répondez OUI pour la garder en ligne, sinon elle sera automatiquement marquée comme louée. Merci !`;
      const waUrl = buildWhatsAppUrl(phone, message);
      whatsappLinks.push(waUrl);
      console.log(`[check-availability] Reminder for listing ${listing.id}: ${waUrl}`);
    }

    // ── 3. Auto-close listings older than 45 days ─────────────────────────
    if (isOver45) {
      autoClosedIds.push(listing.id as string);
    }
  }

  // Batch update listings over 45 days → available_now = false
  let closedCount = 0;
  if (autoClosedIds.length > 0) {
    const { error: updateErr } = await db
      .from("properties")
      .update({ available_now: false })
      .in("id", autoClosedIds)
      .select("id");

    if (updateErr) {
      console.error("[check-availability] update error:", updateErr.message);
    } else {
      closedCount = autoClosedIds.length;
      console.log(`[check-availability] Auto-closed ${closedCount} listings (>45 days)`);
    }
  }

  const result = {
    checked:        listings.length,
    reminders_logged: whatsappLinks.length,
    auto_closed:    closedCount,
    auto_closed_ids: autoClosedIds,
    ran_at:         now.toISOString(),
  };

  console.log("[check-availability] Done:", result);
  return NextResponse.json(result);
}
