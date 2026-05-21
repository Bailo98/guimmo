import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Vérifie que l'appelant est un admin Supabase authentifié.
 * Retourne le client SSR (session admin + RLS is_admin()) ou null.
 *
 * NOTE : on n'utilise PAS supabaseAdmin (service_role) ici car la policy RLS
 * "properties_admin FOR ALL USING (is_admin())" permet à l'admin authentifié
 * de tout faire sans service_role key. Cela évite le bug "unregistered api key"
 * qui survenait quand SUPABASE_SERVICE_ROLE_KEY était présente avec une valeur
 * invalide (le createClient(@supabase/supabase-js) ne supporte pas le nouveau
 * format de clé sb_publishable_/sb_secret_).
 */
async function requireAdmin() {
  try {
    const supabase = await createSupabaseServerClient();

    // Diagnostic : confirme que la session est bien lue côté serveur
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("[admin/properties] auth.getUser error:", authError.message);
      return null;
    }
    if (!user) {
      console.error("[admin/properties] Aucune session — l'admin n'est pas connecté via Supabase Auth");
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
      console.error("[admin/properties] Rôle insuffisant:", profile?.role, "— attendu: admin");
      return null;
    }

    console.log("[admin/properties] Admin vérifié:", user.email);
    return supabase; // client authentifié avec session admin
  } catch (err) {
    console.error("[admin/properties] Exception dans requireAdmin:", err);
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

  let body: { action: string; id: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const { action, id } = body;

  if (!id) {
    return NextResponse.json({ error: "Paramètre id manquant" }, { status: 400 });
  }

  if (action === "approve") {
    const { error } = await supabase
      .from("properties")
      .update({ status: "active" })
      .eq("id", id);
    if (error) {
      console.error("[admin/properties] approve error:", error.code, error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "suspend") {
    const { error } = await supabase
      .from("properties")
      .update({ status: "paused" })
      .eq("id", id);
    if (error) {
      console.error("[admin/properties] suspend error:", error.code, error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("[admin/properties] delete error:", error.code, error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: `Action inconnue: ${action}` }, { status: 400 });
}
