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
