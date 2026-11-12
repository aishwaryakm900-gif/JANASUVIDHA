import { NextRequest, NextResponse } from "next/server";
import { ComplaintService } from "@/lib/services/complaint.service";
import { isAuthorizedIvrWebhook } from "@/lib/services/ivr-auth";

export const dynamic = "force-dynamic";

function extractTranscript(body: any): string {
  const direct = body.transcript || body.data?.transcript;
  if (typeof direct === "string") return direct.trim();
  const turns = Array.isArray(direct)
    ? direct
    : Array.isArray(body.conversation_transcript)
      ? body.conversation_transcript
      : Array.isArray(body.data?.conversation_transcript)
        ? body.data.conversation_transcript
        : [];
  return turns
    .filter((turn: any) => !turn.role || ["user", "caller", "human"].includes(String(turn.role).toLowerCase()))
    .map((turn: any) => String(turn.message || turn.text || turn.content || "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

export async function POST(request: NextRequest) {
  if (!isAuthorizedIvrWebhook(request)) {
    return NextResponse.json({ success: false, error: "Invalid IVR webhook authorization." }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Expected a JSON webhook payload." }, { status: 400 });
  }

  const data = body?.data || {};
  const callId = String(body.callSid || body.call_sid || body.conversation_id || data.call_sid || data.conversation_id || body.event_id || "").trim();
  const transcript = extractTranscript(body);
  const confirmed = body.confirmed === true || data.confirmed === true ||
    [body.consent, body.confirmation, data.consent, data.confirmation].some((value) =>
      typeof value === "string" && /^(yes|true|confirmed|approved)$/i.test(value.trim())
    );

  if (!callId || !transcript) {
    return NextResponse.json({ success: false, error: "callSid and a caller transcript are required." }, { status: 400 });
  }
  if (!confirmed) {
    return NextResponse.json({ success: true, submitted: false, reason: "Caller confirmation is required before registration." }, { status: 202 });
  }

  try {
    const languageCode = String(body.languageCode || body.language_code || data.language_code || "en").split(/[-_]/)[0].toLowerCase();
    const phone = String(body.callerNumber || body.caller_number || body.from_number || data.caller_number || "").trim() || undefined;
    const result = await ComplaintService.createComplaint({
      idempotencyKey: `elevenlabs:${callId}`,
      transcript: transcript.slice(0, 12000),
      languageCode,
      location: process.env.IVR_LOCATION || "Outpatient Department, Ballari - Phone IVR",
      source: "PHONE_IVR",
      citizenPhone: phone,
    });
    return NextResponse.json({
      success: true,
      submitted: true,
      duplicate: result.isDuplicateDetected,
      complaintId: result.complaint.complaintNumber,
      status: result.complaint.status,
    });
  } catch (error) {
    console.error("[api/ivr/elevenlabs] Complaint registration failed:", error);
    return NextResponse.json({ success: false, error: "Could not register the IVR complaint." }, { status: 500 });
  }
}
