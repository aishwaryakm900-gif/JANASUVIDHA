import { NextRequest, NextResponse } from "next/server";
import { DBService } from "@/lib/services/db.service";
import { ObservationType } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const {
      observationType,
      response,
      durationSinceLastCleaning,
      languageCode,
      originalTranscript,
      location,
    } = body;

    if (!observationType || !response) {
      return NextResponse.json(
        { success: false, error: "observationType and response are required." },
        { status: 400 }
      );
    }

    const result = await DBService.addComplaintObservation({
      complaintId: params.id,
      observationType: observationType as ObservationType,
      response,
      durationSinceLastCleaning,
      languageCode: languageCode || "kn",
      originalTranscript,
      location,
    });

    return NextResponse.json({
      success: true,
      complaint: result.complaint,
      observation: result.observation,
      message:
        observationType === "CLEAN_REPORTED"
          ? "Thank you for letting us know the facility is clean. A supervisor will verify."
          : "Your observation has been added to the ongoing grievance record. Recurrence count updated.",
    });
  } catch (error: any) {
    console.error("[api/complaints/[id]/observations] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record observation." },
      { status: 500 }
    );
  }
}

