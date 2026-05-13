import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { propertyId } = await request.json().catch(() => ({}));
  if (!propertyId) return NextResponse.json({ error: "missing propertyId" }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ ok: false });

  const db = createClient(url, key);
  try {
    await db.rpc("increment_views", { property_id: propertyId });
  } catch {
    // RPC not available — silent
  }

  return NextResponse.json({ ok: true });
}
