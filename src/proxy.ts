import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/compte", "/publier", "/messages", "/favoris"];
const ADMIN_ROUTES     = ["/admin"];
const AUTH_ROUTES      = ["/connexion", "/inscription"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );
  const isAdmin = ADMIN_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  ) && !pathname.startsWith("/admin/login");
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  // Fast-path: if the route doesn't need auth, skip the Supabase call
  if (!isProtected && !isAdmin && !isAuthRoute) {
    return NextResponse.next();
  }

  // Build a response object that we'll mutate if Supabase needs to refresh cookies
  let res = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write refreshed cookies back onto both the request and the response
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          res = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() does a server-side JWT validation — more reliable than getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user;

  if ((isProtected || isAdmin) && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("redirect", isAdmin ? "/admin" : pathname);
    return NextResponse.redirect(url);
  }

  // Redirect already-logged-in users away from auth pages
  if (isAuthRoute && isAuthenticated && !request.nextUrl.searchParams.get("redirect")) {
    return NextResponse.redirect(new URL("/compte", request.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/compte/:path*",
    "/publier/:path*",
    "/messages/:path*",
    "/favoris/:path*",
    "/admin/:path*",
    "/connexion",
    "/inscription",
  ],
};
