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
      console.error("[admin/reports] Pas d'utilisateur authentifié");
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("[admin/reports] Erreur lecture profil:", profileError.message);
      return null;
    }

    if (profile?.role !== "admin") {
      console.error("[admin/reports] Rôle insuffisant:", profile?.role);
      return null;
    }

    const db = supabaseAdmin ?? supabase;
    return { user, db };
  } catch (err) {
    console.error("[admin/reports] Erreur requireAdmin:", err);
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

  let body: { action: string; id?: string; propertyId?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de la requête invalide (JSON attendu)" }, { status: 400 });
  }

  const { action, id, propertyId } = body;

  // ── Masquer : supprime le signalement + met l'annonce en pause ────────────
  if (action === "masquer") {
    if (!id) return NextResponse.json({ error: "Paramètre id manquant" }, { status: 400 });

    const { error: reportErr } = await db.from("reports").delete().eq("id", id);
    if (reportErr) {
      console.error("[admin/reports] masquer (delete report) error:", reportErr);
      return NextResponse.json({ error: reportErr.message }, { status: 500 });
    }

    if (propertyId) {
      const { error: propErr } = await db
        .from("properties")
        .update({ status: "paused" })
        .eq("id", propertyId);
      if (propErr) {
        console.error("[admin/reports] masquer (pause property) error:", propErr);
        // On ne bloque pas sur cette erreur — le signalement a déjà été supprimé.
      }
    }

    return NextResponse.json({ ok: true });
  }

  // ── Ignorer : marque le signalement comme traité ──────────────────────────
  if (action === "ignorer") {
    if (!id) return NextResponse.json({ error: "Paramètre id manquant" }, { status: 400 });

    const { error } = await db
      .from("reports")
      .update({ is_handled: true })
      .eq("id", id);

    if (error) {
      console.error("[admin/reports] ignorer error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // ── Ignorer tout ──────────────────────────────────────────────────────────
  if (action === "ignore-all") {
    const { error } = await db
      .from("reports")
      .update({ is_handled: true })
      .eq("is_handled", false);

    if (error) {
      console.error("[admin/reports] ignore-all error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: `Action inconnue: ${action}` }, { status: 400 });
}
