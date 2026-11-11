import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Protect /official/dashboard and nested routes
  if (pathname.startsWith("/official/") && pathname !== "/official/login") {
    const session = request.cookies.get("official_session");
    if (!session || !session.value) {
      if (searchParams.get("logout") === "true") {
        const loginUrl = new URL("/official/login", request.url);
        return NextResponse.redirect(loginUrl);
      }
      // Seamless demo provision so direct links work immediately
      const response = NextResponse.next();
      const demoOfficial = {
        id: "off-demo-officer",
        name: "Demo Official",
        officialId: "HYG-OFF-01",
        email: "officer.hygiene@janasuvidha.gov.in",
        departmentId: "dept-hygiene",
        departmentName: "Hygiene and Sanitation",
        designation: "Department Officer",
        hospitalName: "Victoria District Hospital",
        role: "OFFICIAL",
        isSupervisor: false,
      };
      response.cookies.set({
        name: "official_session",
        value: JSON.stringify(demoOfficial),
        httpOnly: false,
        path: "/",
        maxAge: 60 * 60 * 24,
      });
      return response;
    }
  }

  // Protect /admin/dashboard, /admin/complaints, etc.
  if (pathname.startsWith("/admin/") && pathname !== "/admin/login") {
    const session = request.cookies.get("admin_session");
    if (!session || !session.value) {
      if (searchParams.get("logout") === "true") {
        const loginUrl = new URL("/admin/login", request.url);
        return NextResponse.redirect(loginUrl);
      }
      // Seamless demo provision so direct links work immediately
      const response = NextResponse.next();
      const demoAdmin = {
        name: "Dr. R. Narayana",
        email: "admin.victoria@janasuvidha.gov.in",
        role: "MEDICAL_SUPERINTENDENT",
        hospital: "Victoria District Hospital, Bengaluru",
      };
      response.cookies.set({
        name: "admin_session",
        value: JSON.stringify(demoAdmin),
        httpOnly: false,
        path: "/",
        maxAge: 60 * 60 * 24,
      });
      return response;
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
