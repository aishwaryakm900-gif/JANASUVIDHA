import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedIvrWebhook } from "@/lib/services/ivr-auth";
import { handleElevenLabsIvrPayload } from "@/lib/services/elevenlabs-ivr.service";

export const dynamic = "force-dynamic";

/**
 * ElevenLabs Conversation Initiation Webhook
 * Triggered at the beginning of an incoming call.
 * Also safely processes post-call payloads if configured to this URL.
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

  try {
    const result = await handleElevenLabsIvrPayload(body);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[ElevenLabs Init Webhook] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process IVR payload" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "JanaSuvidha ElevenLabs Conversation Initiation Webhook",
    timestamp: new Date().toISOString(),
  });
}
