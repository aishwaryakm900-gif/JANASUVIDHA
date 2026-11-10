import { ComplaintService } from "@/lib/services/complaint.service";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { rating, comment, isResolved } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: "Valid rating (1-5) is required" }, { status: 400 });
    }

    const updated = await ComplaintService.addFeedback(
      params.id,
      rating,
      comment,
      isResolved !== false
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: "Complaint not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, complaint: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

