import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  // Destination priority: ?next= param → ?redirect= param → oauth_redirect cookie → /compte
  const cookieStore = await cookies();
  const cookieRedirect = cookieStore.get("oauth_redirect")?.value;
  const next = searchParams.get("next")
    ?? searchParams.get("redirect")
    ?? (cookieRedirect ? decodeURIComponent(cookieRedirect) : null)
    ?? "/compte";

  if (oauthError) {
    const desc = searchParams.get("error_description") ?? oauthError;
    return NextResponse.redirect(`${origin}/connexion?error=${encodeURIComponent(desc)}`);
  }

  if (code) {
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

    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`);
      response.cookies.set("LogerBien-auth", "supabase-session", {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      return response;
    }

  }

  return NextResponse.redirect(`${origin}/connexion?error=oauth`);
}
