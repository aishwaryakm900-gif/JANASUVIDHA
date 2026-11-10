import { ComplaintService } from "@/lib/services/complaint.service";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updated = await ComplaintService.upvoteRecurrence(params.id);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Complaint not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, recurrenceCount: updated.recurrenceCount, complaint: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

