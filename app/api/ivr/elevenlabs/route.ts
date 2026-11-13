import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedIvrWebhook } from "@/lib/services/ivr-auth";
import { handleElevenLabsIvrPayload } from "@/lib/services/elevenlabs-ivr.service";

export const dynamic = "force-dynamic";

/**
 * Main Webhook Route for ElevenLabs Conversational AI
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

  try {
    const responseData = await handleElevenLabsIvrPayload(body);
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("[api/ivr/elevenlabs] Error processing webhook:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process IVR webhook." },
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
