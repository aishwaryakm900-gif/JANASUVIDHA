import { ComplaintService } from "@/lib/services/complaint.service";
import { SupabaseSyncService } from "@/lib/services/supabase-sync.service";
import { AIService } from "@/lib/services/ai.service";

/**
 * Checks whether an incoming payload is an ElevenLabs post-call webhook
 */
export function isPostCallPayload(body: any): boolean {
  if (!body) return false;
  const eventType = String(body.type || body.event || body.data?.event || "").toLowerCase();
  if (
    eventType.includes("post_call") ||
    eventType.includes("transcription") ||
    eventType.includes("ended") ||
    eventType.includes("completed")
  ) {
    return true;
  }
  const status = String(body.data?.status || body.status || "").toLowerCase();
  if (status === "done" || status === "completed") {
    return true;
  }
  const direct = body.transcript || body.data?.transcript;
  if (Array.isArray(direct) && direct.length > 0) {
    return true;
  }
  if (typeof direct === "string" && direct.trim().length > 0) {
    return true;
  }
  if (body.analysis?.transcript_summary || body.data?.analysis?.transcript_summary) {
    return true;
  }
  return false;
}

/**
 * Extracts the user/human statements as a clean transcript
 */
export function extractCallerStatements(body: any): string {
  const data = body?.data || {};
  const direct = body.transcript || data.transcript || body.conversation_transcript || data.conversation_transcript;
  if (typeof direct === "string" && direct.trim()) return direct.trim();

  const turns = Array.isArray(direct) ? direct : [];

  const userTurns = turns
    .filter((turn: any) => !turn.role || ["user", "caller", "human"].includes(String(turn.role).toLowerCase()))
    .map((turn: any) => String(turn.message || turn.text || turn.content || "").trim())
    .filter(Boolean);

  if (userTurns.length > 0) return userTurns.join(" ");

  // Fallback: If roles aren't specified, join all non-empty turns
  return turns
    .map((turn: any) => String(turn.message || turn.text || turn.content || "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

/**
 * Extracts full conversational dialogue for call_logs storage
 */
export function extractFullDialogue(body: any): string {
  const data = body?.data || {};
  const turns = Array.isArray(body.conversation_transcript)
    ? body.conversation_transcript
    : Array.isArray(data.conversation_transcript)
      ? data.conversation_transcript
      : Array.isArray(body.transcript)
        ? body.transcript
        : Array.isArray(data.transcript)
          ? data.transcript
          : [];

  if (turns.length > 0) {
    return turns
      .map((t: any) => {
        const speaker = (t.role || "SPEAKER").toUpperCase();
        const text = String(t.message || t.text || t.content || "").trim();
        return `${speaker}: ${text}`;
      })
      .join("\n");
  }

  if (typeof body.transcript === "string") return body.transcript;
  if (typeof data.transcript === "string") return data.transcript;
  return "";
}

/**
 * Extracts customer name if mentioned or collected by ElevenLabs agent
 */
export function extractCustomerName(body: any, text: string): string | null {
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

  // Check analysis summary: e.g. "The user, Mahesh Kumar from Ballari..."
  const summary = String(analysis?.transcript_summary || "");
  const summaryMatch = summary.match(/(?:The user|caller|patient)[,\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
  if (summaryMatch && summaryMatch[1] && summaryMatch[1].toLowerCase() !== "who") {
    return summaryMatch[1].trim();
  }

  // Regex heuristic for common name patterns (both English and Indian scripts)
  const match = text.match(
    /(?:my name is|i am|this is|ಹೆಸರು|ನನ್ನ ಹೆಸರು|ನನ್ನ ಹೆಸರು:|मेरा नाम|నా పేరు|என் பெயர்)\s+([A-Za-z\u0C80-\u0CFF\u0900-\u097F]+(?:\s+[A-Za-z\u0C80-\u0CFF\u0900-\u097F]+)?)/i
  );
  if (match && match[1]) {
    return match[1].trim();
  }

  return null;
}

/**
 * Extracts location/ward if mentioned in summary or transcript
 */
export function extractLocation(body: any, text: string): string {
  const data = body?.data || {};
  const analysis = body?.analysis || data?.analysis || {};
  const dataCollection = analysis?.data_collection_results || {};

  const collectedLoc = dataCollection.location || dataCollection.ward || body.location || data.location;
  if (typeof collectedLoc === "string" && collectedLoc.trim()) {
    return collectedLoc.trim();
  }

  // Check analysis transcript_summary: "in Ward 14 of Ballari Hospital"
  const summary = String(analysis?.transcript_summary || "");
  const wardMatch = summary.match(/(?:in|at)\s+([A-Za-z0-9\s]+(?:Hospital|Ward\s*\d+|OPD|Clinic)[^.,]*)/i);
  if (wardMatch && wardMatch[1]) {
    return wardMatch[1].trim();
  }

  // Check text regex for Ward or hospital
  const textWardMatch = text.match(/(?:Ward\s*\d+|ವಾರ್ಡ್\s*\d+|वार्ड\s*\d+)/i);
  if (textWardMatch) {
    return `${textWardMatch[0].trim()}, Outpatient Department, Ballari`;
  }

  return process.env.IVR_LOCATION || "Outpatient Department, Ballari - Phone IVR";
}

/**
 * Core handler for processing ElevenLabs IVR payloads (both post-call and initiation)
 */
export async function handleElevenLabsIvrPayload(body: any) {
  const data = body?.data || {};
  const metadata = body?.metadata || data?.metadata || {};
  const phoneCall = metadata?.phone_call || data?.phone_call || {};
  const analysis = body?.analysis || data?.analysis || {};
  const dataCollection = analysis?.data_collection_results || {};
  const dynamicVars = data?.conversation_initiation_client_data?.dynamic_variables || {};

  // 1. Identify Call Identifiers
  const callSid = String(
    body.call_sid ||
    body.callSid ||
    metadata.call_sid ||
    data.call_sid ||
    phoneCall.call_sid ||
    dynamicVars.call_sid ||
    ""
  ).trim();

  const conversationId = String(
    body.conversation_id ||
    body.conversationId ||
    data.conversation_id ||
    ""
  ).trim();

  // ElevenLabs puts caller phone number in data.user_id (e.g. "+918147464388")
  const rawCaller = String(
    data.user_id ||
    body.user_id ||
    phoneCall.caller_id ||
    phoneCall.from ||
    body.caller_number ||
    body.callerNumber ||
    body.caller_id ||
    body.from ||
    body.from_number ||
    metadata.caller_id ||
    metadata.from ||
    data.caller_number ||
    dataCollection.caller_phone ||
    dataCollection.phone_number ||
    dynamicVars.caller_phone ||
    ""
  ).trim();

  const callerNumber =
    rawCaller && !["unspecified", "anonymous", "unknown", "none"].includes(rawCaller.toLowerCase())
      ? rawCaller
      : null;

  const toNumber = String(
    phoneCall.to ||
    body.to ||
    body.to_number ||
    metadata.to ||
    data.to_number ||
    ""
  ).trim() || null;

  const agentId = String(
    data.agent_id ||
    body.agent_id ||
    metadata.agent_id ||
    phoneCall.agent_id ||
    ""
  ).trim() || null;

  const durationSecs =
    Number(
      metadata?.charging?.asr_usage?.total_audio_input_seconds ||
      metadata.call_duration_secs ||
      body.duration_secs ||
      body.duration ||
      data.duration_secs ||
      0
    ) || null;

  const recordingUrl = String(
    body.recording_url ||
    body.audio_url ||
    data.recording_url ||
    ""
  ).trim() || null;

  // 2. CHECK IF THIS IS A POST-CALL TRANSCRIPTION / COMPLETED CONVERSATION
  if (isPostCallPayload(body)) {
    console.log("[ElevenLabs Webhook] Processing post-call transcription for conv:", conversationId);

    const callerTranscript = extractCallerStatements(body);
    const fullTranscript = extractFullDialogue(body) || callerTranscript;

    if (!callerTranscript && !fullTranscript) {
      if (callSid || conversationId) {
        await SupabaseSyncService.upsertCallLog({
          callSid: callSid || undefined,
          conversationId: conversationId || undefined,
          callerNumber: callerNumber || undefined,
          toNumber: toNumber || undefined,
          agentId: agentId || undefined,
          transcript: "No speech detected during call.",
          duration: durationSecs || undefined,
          recordingUrl: recordingUrl || undefined,
          status: "completed_no_speech",
          callMetadata: body,
        });
      }
      return {
        success: true,
        registered: false,
        reason: "No caller grievance statements detected in transcript.",
      };
    }

    // Extract structured details
    const customerName = extractCustomerName(body, callerTranscript);
    const finalLocation = extractLocation(body, callerTranscript);

    // Language detection
    let languageCode = "en";
    let originalLanguage = "English";
    if (/[\u0C80-\u0CFF]/.test(callerTranscript)) {
      languageCode = "kn";
      originalLanguage = "Kannada";
    } else if (/[\u0900-\u097F]/.test(callerTranscript)) {
      languageCode = "hi";
      originalLanguage = "Hindi";
    } else if (/[\u0C00-\u0C7F]/.test(callerTranscript)) {
      languageCode = "te";
      originalLanguage = "Telugu";
    } else if (/[\u0B80-\u0BFF]/.test(callerTranscript)) {
      languageCode = "ta";
      originalLanguage = "Tamil";
    } else if (/[\u0D00-\u0D7F]/.test(callerTranscript)) {
      languageCode = "ml";
      originalLanguage = "Malayalam";
    }

    const collectedCategory = dataCollection.complaint_category || dataCollection.category || body.category;
    const collectedSummary =
      analysis?.call_summary_title ||
      analysis?.transcript_summary ||
      dataCollection.issue_description ||
      body.summary;

    let category = collectedCategory;
    let department = "";
    let summary = collectedSummary;
    let priority = "Medium";

    try {
      const aiClassification = await AIService.classifyComplaint(callerTranscript, finalLocation);
      if (!category) category = aiClassification.category;
      department = aiClassification.departmentName;
      if (!summary) summary = aiClassification.summary;
      priority = (aiClassification.suggestedPriority as any) || "Medium";
    } catch (aiErr) {
      console.warn("[IVR ElevenLabs] AI triaging fallback:", aiErr);
    }

    if (!category || category === "OTHER" || category === "Other") {
      category = "Hospital Services";
    }

    const finalSummary = summary?.trim() || callerTranscript.slice(0, 100);

    // 4. Register Complaint with Idempotency Protection
    const idempotencyKey = `ivr:${conversationId || callSid || Date.now()}`;

    const result = await ComplaintService.createComplaint({
      idempotencyKey,
      transcript: callerTranscript.slice(0, 12000),
      languageCode,
      originalLanguage,
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

    // 5. Update Call Log in Supabase with full conversation transcript & linked complaint_id
    await SupabaseSyncService.upsertCallLog({
      callSid: callSid || undefined,
      conversationId: conversationId || undefined,
      callerNumber: callerNumber || undefined,
      toNumber: toNumber || undefined,
      agentId: agentId || undefined,
      complaintId: complaintId,
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

    console.log(`[ElevenLabs Webhook] Complaint registered successfully: ${ticketNumber} (UUID: ${complaintId})`);

    return {
      success: true,
      submitted: true,
      duplicate: result.isDuplicateDetected,
      complaintId: ticketNumber,
      complaintUuid: complaintId,
      source: "ivr",
      category,
      department: complaint.departmentName,
      status: complaint.status,
    };
  }

  // 3. CONVERSATION INITIATION WEBHOOK (Pre-call handshake)
  console.log("[ElevenLabs Webhook] Processing conversation initiation for conv:", conversationId);

  if (callSid || conversationId) {
    await SupabaseSyncService.upsertCallLog({
      callSid: callSid || undefined,
      conversationId: conversationId || undefined,
      callerNumber: callerNumber || undefined,
      toNumber: toNumber || undefined,
      agentId: agentId || undefined,
      status: "in_progress",
      callMetadata: { stage: "initiation", receivedAt: new Date().toISOString(), raw: body },
    });
  }

  return {
    conversation_initiation_client_data: {
      dynamic_variables: {
        hospital_name: "Outpatient Department, Ballari",
        caller_phone: callerNumber || "Unspecified",
        call_sid: callSid || "Direct-ElevenLabs",
        init_timestamp: new Date().toISOString(),
      },
    },
  };
}
