import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /official/dashboard and nested routes
  if (pathname.startsWith("/official/") && pathname !== "/official/login") {
    const session = request.cookies.get("official_session");
    if (!session || !session.value) {
      const loginUrl = new URL("/official/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect /admin/dashboard, /admin/complaints, etc.
  if (pathname.startsWith("/admin/") && pathname !== "/admin/login") {
    const session = request.cookies.get("admin_session");
    if (!session || !session.value) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/official/dashboard/:path*",
    "/official/dashboard",
    "/official/complaints/:path*",
    "/official/complaints",
    "/admin/dashboard/:path*",
    "/admin/dashboard",
    "/admin/complaints/:path*",
    "/admin/complaints",
  ],
};
