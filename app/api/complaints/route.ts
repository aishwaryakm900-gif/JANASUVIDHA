import { ComplaintService } from "@/lib/services/complaint.service";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") as any;
    const status = searchParams.get("status") as any;
    const onlyMedicine = searchParams.get("onlyMedicine") === "true";
    const publicOnly = searchParams.get("publicOnly") === "true";
    const rawDept = searchParams.get("department");
    const isAdmin =
      searchParams.get("admin") === "true" ||
      Boolean(req.cookies.get("admin_session")?.value) ||
      Boolean(req.headers.get("referer")?.includes("/admin"));

    let officialDepartment: string | undefined = undefined;
    if (rawDept && rawDept !== "All Departments" && rawDept !== "ALL") {
      officialDepartment = rawDept;
    }

    let designation = searchParams.get("designation") || undefined;

    // Only apply official session cookie if:
    // 1) NOT an admin request
    // 2) The caller did NOT explicitly specify a department in query params
    if (!isAdmin && rawDept === null) {
      const officialCookie = req.cookies.get("official_session")?.value;
      if (officialCookie) {
        try {
          const session = JSON.parse(officialCookie);
          if (session.designation !== "Hospital Administrator" && session.departmentName) {
            officialDepartment = session.departmentName;
            designation = session.designation;
          }
        } catch (e) {}
      }
    }

    const complaints = await ComplaintService.getComplaints({
      officialDepartment,
      designation,
      category,
      status,
      search,
      onlyMedicine,
      excludePrivateMedicine: publicOnly,
      visibility: publicOnly ? "PUBLIC" : undefined,
    });

    return NextResponse.json({ success: true, count: complaints.length, complaints });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.transcript && !body.originalTranscript) {
      return NextResponse.json(
        { success: false, error: "Complaint transcript is required." },
        { status: 400 }
      );
    }

    const isMed =
      body.isMedicineComplaint ||
      body.category === "Pharmacy and Medicine Availability" ||
      body.department === "Pharmacy and Medicine Availability" ||
      !!body.medicineName;

    const result = await ComplaintService.createComplaint({
      idempotencyKey: body.idempotencyKey,
      transcript: body.transcript || body.originalTranscript,
      originalLanguage: body.originalLanguage,
      languageCode: body.languageCode,
      englishTranslation: body.englishTranslation,
      summary: body.summary || body.complaintSummary,
      category: isMed ? "Pharmacy and Medicine Availability" : (body.category || "Hospital Services"),
      department: isMed ? "Pharmacy and Medicine Availability" : (body.department || "Hospital Services"),
      priority: body.priority,
      location: body.location || "Outpatient Department, Ballari - Kiosk #1",
      source: body.source || "VOICE_KIOSK",
      medicineName: body.medicineName,
      citizenPhone: body.citizenPhone,
      citizenName: body.citizenName,
      isMedicineComplaint: isMed,
      visibility: isMed ? "PRIVATE" : (body.visibility || "PUBLIC"),
    });

    return NextResponse.json({
      success: true,
      complaint: result.complaint,
      receipt: result.complaint.receipt,
      isDuplicate: result.isDuplicateDetected,
    });
  } catch (error: any) {
    console.error("[api/complaints POST Error]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process complaint" },
      { status: 500 }
    );
  }
}
