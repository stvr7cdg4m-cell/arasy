import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("arasy_session");
  const isAuthenticated = session?.value === "authenticated_session_active";

  const protectedPaths = [
    "/dashboard",
    "/stock-analysis",
    "/decision-center",
    "/mix-optimizer",
    "/planning",
    "/integrations",
  ];

  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/stock-analysis/:path*",
    "/decision-center/:path*",
    "/mix-optimizer/:path*",
    "/planning/:path*",
    "/integrations/:path*",
    "/login",
  ],
};
