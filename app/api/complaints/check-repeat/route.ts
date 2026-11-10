import { NextRequest, NextResponse } from "next/server";
import { DBService } from "@/lib/services/db.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { category, department, location } = await req.json();

    if (!category && !department) {
      return NextResponse.json(
        { hasActive: false },
        { status: 200 }
      );
    }

    const existingComplaint = await DBService.findActiveComplaintForCategory({
      category: category || "",
      department: department || "",
      location,
    });

    if (existingComplaint) {
      return NextResponse.json({
        hasActive: true,
        complaint: existingComplaint,
      });
    }

    return NextResponse.json({
      hasActive: false,
    });
  } catch (error: any) {
    console.error("[api/complaints/check-repeat] Error:", error);
    return NextResponse.json({ hasActive: false }, { status: 200 });
  }
}

