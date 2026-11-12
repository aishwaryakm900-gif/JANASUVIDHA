import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DBService } from "@/lib/services/db.service";

export async function POST(req: NextRequest) {
  try {
    const { email, officialId } = await req.json();

    const officials = await DBService.getOfficials();
    let official = officials.find(
      (o) =>
        (email && o.email.toLowerCase() === email.toLowerCase()) ||
        (officialId && o.officialId && o.officialId.toLowerCase() === officialId.toLowerCase())
    );

    // Default to Demo Official (Hygiene Officer) if nothing matched in demo
    if (!official) {
      official = officials[0];
    }

    const sessionData = {
      id: official.id,
      name: official.name,
      officialId: official.officialId,
      email: official.email,
      departmentId: official.departmentId,
      departmentName: official.departmentName,
      designation: official.designation,
      hospitalName: official.hospitalName || "Outpatient Department, Ballari",
      role: official.role,
      isSupervisor: official.designation === "Department Supervisor",
    };

    cookies().set({
      name: "official_session",
      value: JSON.stringify(sessionData),
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return NextResponse.json({ success: true, official: sessionData });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
