import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const next = searchParams.get("next") ?? searchParams.get("redirect") ?? "/compte";

  console.log("[callback] origin:", origin);
  console.log("[callback] code:", code ? `présent (${code.slice(0, 8)}…)` : "ABSENT");
  console.log("[callback] error param:", oauthError ?? "aucun");
  console.log("[callback] next:", next);

  if (oauthError) {
    const desc = searchParams.get("error_description") ?? oauthError;
    console.log("[callback] OAuth provider error:", desc);
    return NextResponse.redirect(`${origin}/connexion?error=${encodeURIComponent(desc)}`);
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    console.log("[callback] exchangeCodeForSession error:", error ? `${error.status} — ${error.message}` : "aucun");

    if (!error) {
      console.log("[callback] success → redirect to", next);
      const response = NextResponse.redirect(`${origin}${next}`);
      response.cookies.set("guimmo-auth", "supabase-session", {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      return response;
    }

    console.log("[callback] exchange failed → redirect to /connexion?error=oauth");
  } else {
    console.log("[callback] no code → redirect to /connexion?error=oauth");
  }

  return NextResponse.redirect(`${origin}/connexion?error=oauth`);
}
