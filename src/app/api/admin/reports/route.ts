import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Même logique que /api/admin/properties :
 * utilise la session admin SSR + RLS is_admin(), sans service_role key.
 */
async function requireAdmin() {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("[admin/reports] auth.getUser error:", authError.message);
      return null;
    }
    if (!user) {
      console.error("[admin/reports] Aucune session admin");
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

    console.log("[admin/reports] Admin vérifié:", user.email);
    return supabase;
  } catch (err) {
    console.error("[admin/reports] Exception dans requireAdmin:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const supabase = await requireAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Non autorisé — connectez-vous à /connexion avec un compte Supabase ayant role='admin' dans la table profiles." },
      { status: 401 }
    );
  }

  let body: { action: string; id?: string; propertyId?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const { action, id, propertyId } = body;

  // ── Masquer : supprime le signalement + met l'annonce en pause ────────────
  if (action === "masquer") {
    if (!id) return NextResponse.json({ error: "Paramètre id manquant" }, { status: 400 });

    const { error: reportErr } = await supabase.from("reports").delete().eq("id", id);
    if (reportErr) {
      console.error("[admin/reports] masquer (delete) error:", reportErr.code, reportErr.message);
      return NextResponse.json({ error: reportErr.message }, { status: 500 });
    }

    if (propertyId) {
      const { error: propErr } = await supabase
        .from("properties")
        .update({ status: "paused" })
        .eq("id", propertyId);
      if (propErr) {
        console.error("[admin/reports] masquer (pause property) error:", propErr.code, propErr.message);
        // Le signalement est déjà supprimé — on ne bloque pas.
      }
    }

    return NextResponse.json({ ok: true });
  }

  // ── Ignorer ───────────────────────────────────────────────────────────────
  if (action === "ignorer") {
    if (!id) return NextResponse.json({ error: "Paramètre id manquant" }, { status: 400 });

    const { error } = await supabase
      .from("reports")
      .update({ is_handled: true })
      .eq("id", id);

    if (error) {
      console.error("[admin/reports] ignorer error:", error.code, error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // ── Ignorer tout ──────────────────────────────────────────────────────────
  if (action === "ignore-all") {
    const { error } = await supabase
      .from("reports")
      .update({ is_handled: true })
      .eq("is_handled", false);

    if (error) {
      console.error("[admin/reports] ignore-all error:", error.code, error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: `Action inconnue: ${action}` }, { status: 400 });
}
