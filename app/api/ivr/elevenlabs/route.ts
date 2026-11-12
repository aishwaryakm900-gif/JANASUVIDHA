import { NextRequest, NextResponse } from "next/server";
import { ComplaintService } from "@/lib/services/complaint.service";
import { isAuthorizedIvrWebhook } from "@/lib/services/ivr-auth";
import { SupabaseSyncService } from "@/lib/services/supabase-sync.service";
import { AIService } from "@/lib/services/ai.service";

export const dynamic = "force-dynamic";

/**
 * Extracts the user/human statements as a clean transcript
 */
function extractCallerStatements(body: any): string {
  const direct = body.transcript || body.data?.transcript;
  if (typeof direct === "string" && direct.trim()) return direct.trim();

  const turns = Array.isArray(direct)
    ? direct
    : Array.isArray(body.conversation_transcript)
      ? body.conversation_transcript
      : Array.isArray(body.data?.conversation_transcript)
        ? body.data.conversation_transcript
        : [];

  const userTurns = turns
    .filter((turn: any) => !turn.role || ["user", "caller", "human"].includes(String(turn.role).toLowerCase()))
    .map((turn: any) => String(turn.message || turn.text || turn.content || "").trim())
    .filter(Boolean);

  if (userTurns.length > 0) return userTurns.join(" ");

  // Fallback: If roles aren't specified, join all turns
  return turns
    .map((turn: any) => String(turn.message || turn.text || turn.content || "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

/**
 * Extracts full conversational dialogue for call_logs storage
 */
function extractFullDialogue(body: any): string {
  const turns = Array.isArray(body.conversation_transcript)
    ? body.conversation_transcript
    : Array.isArray(body.data?.conversation_transcript)
      ? body.data.conversation_transcript
      : Array.isArray(body.transcript)
        ? body.transcript
        : [];

  if (turns.length > 0) {
    return turns
      .map((t: any) => {
        const speaker = (t.role || "speaker").toUpperCase();
        const text = String(t.message || t.text || t.content || "").trim();
        return `${speaker}: ${text}`;
      })
      .join("\n");
  }

  if (typeof body.transcript === "string") return body.transcript;
  if (typeof body.data?.transcript === "string") return body.data.transcript;
  return "";
}

/**
 * Extracts customer name if mentioned or collected by ElevenLabs agent
 */
function extractCustomerName(body: any, text: string): string | null {
  const data = body?.data || {};
  const analysis = body?.analysis || data?.analysis || {};
  const dataCollection = analysis?.data_collection_results || {};

  const collectedName =
    dataCollection.customer_name ||
    dataCollection.caller_name ||
    dataCollection.name ||
    body.customer_name ||
    data.customer_name;

  if (typeof collectedName === "string" && collectedName.trim() && collectedName.trim().toLowerCase() !== "unknown") {
    return collectedName.trim();
  }

  // Regex heuristic for common name patterns
  const match = text.match(/(?:my name is|i am|this is|ಹೆಸರು|ನನ್ನ ಹೆಸರು|मेरा नाम)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  if (match && match[1]) {
    return match[1].trim();
  }

  return null;
}

/**
 * Main Webhook Route for ElevenLabs Conversational AI
 * Supports both conversation initiation and post-call webhook payloads.
 */
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
  const metadata = body?.metadata || {};
  const analysis = body?.analysis || data?.analysis || {};
  const dataCollection = analysis?.data_collection_results || {};

  // 1. Identify Call Identifiers
  const callSid = String(
    body.call_sid ||
    body.callSid ||
    metadata.call_sid ||
    data.call_sid ||
    ""
  ).trim();

  const conversationId = String(
    body.conversation_id ||
    body.conversationId ||
    data.conversation_id ||
    ""
  ).trim();

  const callerNumber = String(
    body.caller_number ||
    body.callerNumber ||
    body.caller_id ||
    body.from ||
    body.from_number ||
    metadata.caller_id ||
    metadata.from ||
    data.caller_number ||
    ""
  ).trim() || null;

  const toNumber = String(
    body.to ||
    body.to_number ||
    metadata.to ||
    data.to_number ||
    ""
  ).trim() || null;

  const agentId = String(body.agent_id || metadata.agent_id || "").trim() || null;
  const durationSecs = Number(body.duration_secs || body.duration || data.duration_secs || 0) || null;
  const recordingUrl = String(body.recording_url || body.audio_url || data.recording_url || "").trim() || null;

  const eventType = String(body.type || body.event || data.event || "").toLowerCase();

  // If this is an initiation webhook event:
  if (eventType.includes("init") || (!body.transcript && !body.conversation_transcript && conversationId)) {
    if (callSid || conversationId) {
      void SupabaseSyncService.upsertCallLog({
        callSid: callSid || undefined,
        conversationId: conversationId || undefined,
        callerNumber: callerNumber || undefined,
        toNumber: toNumber || undefined,
        agentId: agentId || undefined,
        status: "in_progress",
        callMetadata: { stage: "initiation", raw: body },
      });
    }

    return NextResponse.json({
      conversation_initiation_client_data: {
        dynamic_variables: {
          hospital_name: "Outpatient Department, Ballari",
          caller_phone: callerNumber || "Unspecified",
          call_sid: callSid || "Direct-ElevenLabs",
        },
      },
    });
  }

  // 2. Extract Transcript
  const callerTranscript = extractCallerStatements(body);
  const fullTranscript = extractFullDialogue(body) || callerTranscript;

  if (!callerTranscript) {
    // If no speech was detected in the conversation
    if (callSid || conversationId) {
      void SupabaseSyncService.upsertCallLog({
        callSid: callSid || undefined,
        conversationId: conversationId || undefined,
        callerNumber: callerNumber || undefined,
        toNumber: toNumber || undefined,
        agentId: agentId || undefined,
        transcript: fullTranscript || "No speech detected during call.",
        duration: durationSecs || undefined,
        recordingUrl: recordingUrl || undefined,
        status: "completed_no_speech",
        callMetadata: body,
      });
    }

    return NextResponse.json({
      success: true,
      registered: false,
      reason: "No caller grievance statements detected in transcript.",
    });
  }

  // 3. Extract Structured Complaint Information
  const customerName = extractCustomerName(body, callerTranscript);
  const languageCode = String(
    body.language_code ||
    body.languageCode ||
    data.language_code ||
    "en"
  ).split(/[-_]/)[0].toLowerCase();

  const collectedCategory = dataCollection.complaint_category || dataCollection.category || body.category;
  const collectedLocation = dataCollection.location || dataCollection.ward || body.location;
  const collectedSummary = analysis?.transcript_summary || dataCollection.issue_description || body.summary;

  // Triaging & Classification via AI triaging engine
  let category = collectedCategory;
  let department = "";
  let summary = collectedSummary;
  let priority = "Medium";

  try {
    const aiClassification = await AIService.classifyComplaint(callerTranscript, collectedLocation || "Hospital");
    if (!category) category = aiClassification.category;
    department = aiClassification.departmentName;
    if (!summary) summary = aiClassification.summary;
    priority = (aiClassification.suggestedPriority as any) || "Medium";
  } catch (aiErr) {
    console.warn("[IVR ElevenLabs] AI triaging fallback:", aiErr);
  }

  // If still unidentified, mark for review as requested
  if (!category || category === "OTHER" || category === "Other") {
    category = "Hospital Services";
  }

  const finalLocation = collectedLocation?.trim() || process.env.IVR_LOCATION || "Outpatient Department, Ballari - Phone IVR";
  const finalSummary = summary?.trim() || callerTranscript.slice(0, 80);

  // 4. Register Complaint with Idempotency Protection
  const idempotencyKey = `ivr:${callSid || conversationId || Date.now()}`;

  try {
    const result = await ComplaintService.createComplaint({
      idempotencyKey,
      transcript: callerTranscript.slice(0, 12000),
      languageCode,
      englishTranslation: finalSummary,
      summary: finalSummary,
      category: category as any,
      department: department || undefined,
      priority: priority as any,
      location: finalLocation,
      source: "ivr",
      citizenPhone: callerNumber || undefined,
      citizenName: customerName || undefined,
      visibility: "PUBLIC",
    });

    const complaint = result.complaint;
    const complaintId = complaint.id;
    const ticketNumber = complaint.complaintNumber || complaint.ticketNumber;

    // 5. Save Full Conversation Transcript & Metadata in call_logs linked to complaint_id
    await SupabaseSyncService.upsertCallLog({
      callSid: callSid || undefined,
      conversationId: conversationId || undefined,
      callerNumber: callerNumber || undefined,
      toNumber: toNumber || undefined,
      agentId: agentId || undefined,
      complaintId: complaintId, // Foreign key link to complaints table
      transcript: fullTranscript,
      recordingUrl: recordingUrl || undefined,
      duration: durationSecs || undefined,
      status: "completed",
      callMetadata: {
        ticketNumber,
        category,
        customerName,
        customerPhone: callerNumber,
        isDuplicate: result.isDuplicateDetected,
        analysis: analysis || {},
      },
    });

    return NextResponse.json({
      success: true,
      submitted: true,
      duplicate: result.isDuplicateDetected,
      complaintId: ticketNumber,
      complaintUuid: complaintId,
      source: "ivr",
      category,
      department: complaint.departmentName,
      status: complaint.status,
    });
  } catch (error: any) {
    console.error("[api/ivr/elevenlabs] Failed to register IVR complaint:", error);

    // Save failure state in call_logs for auditing
    if (callSid || conversationId) {
      void SupabaseSyncService.upsertCallLog({
        callSid: callSid || undefined,
        conversationId: conversationId || undefined,
        callerNumber: callerNumber || undefined,
        transcript: fullTranscript,
        status: "failed_registration",
        callMetadata: { error: error.message },
      });
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to register IVR complaint." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "JanaSuvidha ElevenLabs Post-Call & Transcription Webhook",
    database: "Supabase Relational Pipeline",
    timestamp: new Date().toISOString(),
  });
}
