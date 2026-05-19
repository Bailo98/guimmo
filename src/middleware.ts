import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/compte", "/publier", "/messages", "/favoris"];
const ADMIN_ROUTES     = ["/admin"];
const AUTH_ROUTES      = ["/connexion", "/inscription"];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authCookie   = request.cookies.get("BienLoger-auth");
  const isAuthenticated = !!authCookie?.value;

  const isProtected = PROTECTED_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );
  // /admin/login is the admin-specific login page — keep accessible
  const isAdmin = ADMIN_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  ) && !pathname.startsWith("/admin/login");
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  if ((isProtected || isAdmin) && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    // Don't leak full admin path in redirect param to avoid exposing admin URL structure
    url.searchParams.set("redirect", isAdmin ? "/admin" : pathname);
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from auth pages (only if no redirect param)
  if (isAuthRoute && isAuthenticated && !request.nextUrl.searchParams.get("redirect")) {
    return NextResponse.redirect(new URL("/compte", request.url));
  }

  return NextResponse.next();
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
