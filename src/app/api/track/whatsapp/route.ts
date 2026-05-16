import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { propertyId } = await request.json().catch(() => ({}));
  if (!propertyId) return NextResponse.json({ error: "missing propertyId" }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ ok: false });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? key;
  const db = createClient(url, serviceKey);

  try {
    await db.rpc("increment_listing_stat_whatsapp", { p_property_id: propertyId });
  } catch {
    // RPC not yet deployed — silent fallback
  }

  return NextResponse.json({ ok: true });
}
