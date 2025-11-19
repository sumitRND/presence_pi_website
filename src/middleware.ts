// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const ssoToken = request.cookies.get("sso_token");
  const isSSOPage = request.nextUrl.pathname === "/sso";
  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard");

  if (isSSOPage) {
    return NextResponse.next();
  }

  // No token = redirect to PI Website
  if (isDashboardRoute && !ssoToken) {
    return NextResponse.redirect(
      new URL(process.env.NEXT_PUBLIC_PI_WEBSITE_URL!, request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/sso"],
};
