import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const adminSession = {
      name: "Dr. R. Narayana",
      email: email || "admin.ballari@janasuvidha.gov.in",
      role: "MEDICAL_SUPERINTENDENT",
      hospital: "Outpatient Department, Ballari",
    };

    cookies().set({
      name: "admin_session",
      value: JSON.stringify(adminSession),
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return NextResponse.json({ success: true, admin: adminSession });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

