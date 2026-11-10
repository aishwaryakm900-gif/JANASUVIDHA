import { NextRequest, NextResponse } from "next/server";
import { DBService } from "@/lib/services/db.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      verifiedPhoneNumber,
      requestedResource,
      resourceType,
      originalTranscript,
      englishTranslation,
      languageCode,
      hospitalName,
      departmentName,
    } = body;

    if (!verifiedPhoneNumber || !requestedResource) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: verifiedPhoneNumber and requestedResource are mandatory." },
        { status: 400 }
      );
    }

    const request = await DBService.createPrivateAvailabilityRequest({
      verifiedPhoneNumber,
      requestedResource,
      resourceType: resourceType || "MEDICINE",
      originalTranscript: originalTranscript || requestedResource,
      englishTranslation: englishTranslation || requestedResource,
      languageCode: languageCode || "kn",
      hospitalName: hospitalName || "Victoria District Hospital",
      departmentName: departmentName || "Pharmacy and Medicine Availability",
    });

    return NextResponse.json({
      success: true,
      request,
      message: "Private availability request registered successfully. You will receive an SMS notification when the resource becomes available.",
    });
  } catch (error: any) {
    console.error("[api/availability-requests] Creation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create private availability request." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentName = searchParams.get("department") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    const requests = await DBService.getPrivateAvailabilityRequests({
      departmentName,
      status,
      search,
    });

    return NextResponse.json({
      success: true,
      requests,
      count: requests.length,
    });
  } catch (error: any) {
    console.error("[api/availability-requests] Fetch error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch private availability requests." },
      { status: 500 }
    );
  }
}

