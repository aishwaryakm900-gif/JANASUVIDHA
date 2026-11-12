import { NextRequest, NextResponse } from "next/server";
import { DBService } from "@/lib/services/db.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, officialId, email, password, department, designation, hospital } = body;

    if (!name || !officialId || !email || !department || !designation) {
      return NextResponse.json(
        { success: false, error: "All required registration fields must be provided." },
        { status: 400 }
      );
    }

    // Security check: Never allow unauthorized user to self-register as Hospital Administrator
    if (designation === "Hospital Administrator") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Security Violation: Hospital Administrator accounts must be created or approved by an existing authorized administrator.",
        },
        { status: 403 }
      );
    }

    const result = await DBService.registerOfficial({
      name,
      officialId,
      email,
      password,
      department,
      designation,
      hospital: hospital || "Outpatient Department, Ballari",
      registeredByAdmin: false,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Official registered successfully. You may now log in.",
      official: result.official,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

