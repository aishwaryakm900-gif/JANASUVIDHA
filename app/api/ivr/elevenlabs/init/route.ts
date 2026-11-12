import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedIvrWebhook } from "@/lib/services/ivr-auth";
import { SupabaseSyncService } from "@/lib/services/supabase-sync.service";

export const dynamic = "force-dynamic";

/**
 * ElevenLabs Conversation Initiation Webhook
 * Triggered at the beginning of an incoming call / conversation.
 * Captures Twilio CallSid, caller number, and ElevenLabs conversation ID.
 */
export async function POST(request: NextRequest) {
  if (!isAuthorizedIvrWebhook(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized webhook" }, { status: 401 });
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const data = body?.data || {};
  const metadata = body?.metadata || {};

  const callSid = String(
    body.call_sid ||
    body.callSid ||
    metadata.call_sid ||
    data.call_sid ||
    body.caller_sid ||
    ""
  ).trim();

  const conversationId = String(
    body.conversation_id ||
    body.conversationId ||
    data.conversation_id ||
    ""
  ).trim();

  const callerNumber = String(
    body.caller_id ||
    body.caller_number ||
    body.from ||
    body.from_number ||
    metadata.caller_id ||
    metadata.from ||
    data.caller_number ||
    ""
  ).trim();

  const toNumber = String(
    body.to ||
    body.to_number ||
    metadata.to ||
    data.to_number ||
    ""
  ).trim();

  const agentId = String(body.agent_id || metadata.agent_id || "").trim();

  // Save preliminary call record to Supabase call_logs with status "in_progress"
  if (callSid || conversationId) {
    void SupabaseSyncService.upsertCallLog({
      callSid: callSid || undefined,
      conversationId: conversationId || undefined,
      callerNumber: callerNumber || undefined,
      toNumber: toNumber || undefined,
      agentId: agentId || undefined,
      status: "in_progress",
      callMetadata: {
        stage: "initiation",
        receivedAt: new Date().toISOString(),
        raw: body,
      },
    });
  }

  // Return dynamic variables and hospital prompt overrides for ElevenLabs Conversational AI
  return NextResponse.json({
    conversation_initiation_client_data: {
      conversation_config_override: {
        agent: {
          prompt: {
            prompt: `You are JanaSuvidha, the official AI Grievance Assistant for Outpatient Department, Ballari (Government Hospital).
Listen attentively to the caller's hospital grievance (such as medicine shortages, sanitation/hygiene issues, broken equipment, water supply problems, or staff negligence).
1. Greet the caller warmly in their language (Kannada, English, or Hindi).
2. Ask for their name and the exact hospital location/ward of the problem.
3. Understand their grievance clearly and summarize it back to them.
4. Confirm their permission to submit the grievance to hospital department authorities.
5. Provide reassuring confirmation that their grievance will be recorded in the official grievance system.`,
          },
        },
      },
      dynamic_variables: {
        hospital_name: "Outpatient Department, Ballari",
        hospital_district: "Ballari",
        caller_phone: callerNumber || "Unspecified",
        call_sid: callSid || "Direct-ElevenLabs",
        init_timestamp: new Date().toISOString(),
      },
    },
  });
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "JanaSuvidha ElevenLabs Conversation Initiation Webhook",
    timestamp: new Date().toISOString(),
  });
}

