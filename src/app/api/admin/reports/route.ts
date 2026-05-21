import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/** Vérifie que l'appelant est un admin authentifié. */
async function requireAdmin() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") return null;
    return user;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      {
        error:
          "Service non configuré — ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env.local (Dashboard Supabase > Settings > API > service_role).",
      },
      { status: 503 }
    );
  }

  const body = (await req.json()) as {
    action: string;
    id?: string;
    propertyId?: string | null;
  };
  const { action, id, propertyId } = body;

  // ── Masquer : supprime le signalement + met l'annonce en pause ────────────
  if (action === "masquer") {
    if (!id) return NextResponse.json({ error: "Paramètre id manquant" }, { status: 400 });

    await supabaseAdmin.from("reports").delete().eq("id", id);

    if (propertyId) {
      await supabaseAdmin
        .from("properties")
        .update({ status: "paused" })
        .eq("id", propertyId);
    }
    return NextResponse.json({ ok: true });
  }

  // ── Ignorer : marque le signalement comme traité ──────────────────────────
  if (action === "ignorer") {
    if (!id) return NextResponse.json({ error: "Paramètre id manquant" }, { status: 400 });

    const { error } = await supabaseAdmin
      .from("reports")
      .update({ is_handled: true })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // ── Ignorer tout ─────────────────────────────────────────────────────────
  if (action === "ignore-all") {
    const { error } = await supabaseAdmin
      .from("reports")
      .update({ is_handled: true })
      .eq("is_handled", false);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
