import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ref: string }> }
) {
  const { ref } = await params;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bienloger.gn";

  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && key) {
    const db = createClient(url, key);
    const { data } = await db
      .from("properties")
      .select("id")
      .eq("ref", ref.toUpperCase())
      .eq("status", "active")
      .single();

    if (data?.id) {
      return NextResponse.redirect(`${base}/annonces/${data.id}`, { status: 301 });
    }
  }

  return NextResponse.redirect(`${base}/annonces`, { status: 302 });
}
