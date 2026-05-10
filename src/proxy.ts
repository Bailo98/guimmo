import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/compte", "/publier", "/messages"];
const AUTH_ROUTES = ["/connexion", "/inscription"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get("guimmo-auth");
  const isAuthenticated = !!authCookie?.value;

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  if (isProtected && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/compte", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/compte/:path*", "/publier/:path*", "/connexion", "/inscription"],
};
