import { ComplaintService } from "@/lib/services/complaint.service";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const complaint = await ComplaintService.getComplaintByTicketOrId(params.id);
    if (!complaint) {
      return NextResponse.json({ success: false, error: "Complaint not found" }, { status: 404 });
    }

    // Check departmental access security for officials
    const officialCookie = req.cookies.get("official_session")?.value;
    if (officialCookie) {
      try {
        const session = JSON.parse(officialCookie);
        if (
          session.designation !== "Hospital Administrator" &&
          session.departmentName.toLowerCase() !== complaint.departmentName?.toLowerCase() &&
          session.departmentName.toLowerCase() !== complaint.category.toLowerCase()
        ) {
          return NextResponse.json(
            {
              success: false,
              error: "Access Denied: You are not authorized to view complaints outside your assigned department.",
            },
            { status: 403 }
          );
        }
      } catch (e) {}
    }

    return NextResponse.json({ success: true, complaint });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const complaint = await ComplaintService.getComplaintByTicketOrId(params.id);
    if (!complaint) {
      return NextResponse.json({ success: false, error: "Complaint not found" }, { status: 404 });
    }

    // Check departmental access security for officials
    const officialCookie = req.cookies.get("official_session")?.value;
    if (officialCookie) {
      try {
        const session = JSON.parse(officialCookie);
        if (
          session.designation !== "Hospital Administrator" &&
          session.departmentName.toLowerCase() !== complaint.departmentName?.toLowerCase() &&
          session.departmentName.toLowerCase() !== complaint.category.toLowerCase()
        ) {
          return NextResponse.json(
            {
              success: false,
              error: "Access Denied: You cannot modify complaints outside your department.",
            },
            { status: 403 }
          );
        }
      } catch (e) {}
    }

    const body = await req.json();
    const { status, actorName, actorRole, notes, beforeUrl, afterUrl } = body;

    if (!status || !actorName) {
      return NextResponse.json(
        { success: false, error: "Status and actor name are required" },
        { status: 400 }
      );
    }

    const updated = await ComplaintService.updateStatus(
      params.id,
      status,
      actorName,
      actorRole || "OFFICIAL",
      notes,
      { beforeUrl, afterUrl }
    );

    return NextResponse.json({ success: true, complaint: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
