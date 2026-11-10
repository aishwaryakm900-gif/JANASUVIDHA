import { NextRequest, NextResponse } from "next/server";
import { DBService } from "@/lib/services/db.service";
import { AvailabilityStatus } from "@/types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { status, actorName } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: "Status field is required." },
        { status: 400 }
      );
    }

    const result = await DBService.updatePrivateRequestStatus(params.id, {
      status: status as AvailabilityStatus,
      actorName: actorName || "Department Officer",
    });

    if (!result.request) {
      return NextResponse.json(
        { success: false, error: "Private availability request not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      request: result.request,
      notificationSent: !!result.notificationSent,
      message: result.notificationSent
        ? `Resource marked Available. SMS notification dispatched to ${result.request.verifiedPhoneNumber}.`
        : `Status updated to ${status}.`,
    });
  } catch (error: any) {
    console.error("[api/availability-requests/[id]/status] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update availability status." },
      { status: 500 }
    );
  }
}

