import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Vérifie que l'appelant est un admin Supabase.
 * Retourne le client DB à utiliser (service_role si disponible, sinon session admin).
 */
async function requireAdmin() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error("[admin/properties] Pas d'utilisateur authentifié");
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("[admin/properties] Erreur lecture profil:", profileError.message);
      return null;
    }

    if (profile?.role !== "admin") {
      console.error("[admin/properties] Rôle insuffisant:", profile?.role);
      return null;
    }

    // Utilise service_role si configuré (bypass RLS total),
    // sinon la session admin authentifiée (RLS policy properties_admin).
    const db = supabaseAdmin ?? supabase;
    return { user, db };
  } catch (err) {
    console.error("[admin/properties] Erreur requireAdmin:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth) {
    return NextResponse.json(
      { error: "Non autorisé — connectez-vous en tant qu'admin Supabase." },
      { status: 401 }
    );
  }

  const { db } = auth;

  let body: { action: string; id: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de la requête invalide (JSON attendu)" }, { status: 400 });
  }

  const { action, id } = body;

  if (!id) {
    return NextResponse.json({ error: "Paramètre id manquant" }, { status: 400 });
  }

  if (action === "approve") {
    const { error } = await db
      .from("properties")
      .update({ status: "active" })
      .eq("id", id);
    if (error) {
      console.error("[admin/properties] approve error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "suspend") {
    const { error } = await db
      .from("properties")
      .update({ status: "paused" })
      .eq("id", id);
    if (error) {
      console.error("[admin/properties] suspend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    const { error } = await db
      .from("properties")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("[admin/properties] delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: `Action inconnue: ${action}` }, { status: 400 });
}
