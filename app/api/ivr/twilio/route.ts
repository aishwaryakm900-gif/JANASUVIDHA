import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/services/prisma";
import { isValidTwilioSignature } from "@/lib/services/ivr-auth";
import { ComplaintService } from "@/lib/services/complaint.service";

export const dynamic = "force-dynamic";

function xmlEscape(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  }[character]!));
}

function twiml(content: string) {
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response>${content}</Response>`, {
    headers: { "Content-Type": "text/xml; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function say(text: string, language: string) {
  return `<Say language="${xmlEscape(language)}">${xmlEscape(text)}</Say>`;
}

function languageCode(twilioLanguage: string): string {
  const code = twilioLanguage.toLowerCase().split(/[-_]/)[0];
  return ["kn", "hi", "en", "te", "ta", "ml"].includes(code) ? code : "en";
}

function isYes(text: string) {
  const value = text.toLowerCase().trim();
  return /\b(yes|yeah|yep|submit|confirm)\b/i.test(value) ||
    ["ಹೌದು", "ಸರಿ", "हाँ", "हां", "जी", "అవును", "సరే", "ஆம்", "അതെ", "ശരി"].some((word) => value.includes(word));
}

function isNo(text: string) {
  const value = text.toLowerCase().trim();
  return /\b(no|nope|cancel|stop)\b/i.test(value) ||
    ["ಇಲ್ಲ", "ಬೇಡ", "नहीं", "नही", "రద్దు", "కాదు", "இல்லை", "வேண்டாம்", "അല്ല", "വേണ്ട"].some((word) => value.includes(word));
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const form = new URLSearchParams();
  formData.forEach((value, key) => form.append(key, String(value)));
  if (!isValidTwilioSignature(request, form)) {
    return NextResponse.json({ success: false, error: "Invalid Twilio webhook signature." }, { status: 401 });
  }

  const callSid = form.get("CallSid")?.trim();
  if (!callSid) return twiml(say("We could not identify this call. Please call again later.", "en-IN") + "<Hangup/>");

  const configuredLanguage = process.env.TWILIO_IVR_LANGUAGE?.trim() || "en-IN";
  const code = languageCode(configuredLanguage);
  const step = request.nextUrl.searchParams.get("step");
  const speech = (form.get("SpeechResult") || "").trim();
  const caller = form.get("From")?.trim();

  if (!speech) {
    if (step === "confirm") {
      return twiml(
        say("Sorry, I did not hear your answer. Please say yes to submit this complaint, or no to cancel.", configuredLanguage) +
        `<Gather input="speech" action="${request.nextUrl.pathname}?step=confirm" method="POST" language="${xmlEscape(configuredLanguage)}" speechTimeout="auto"/>` +
        say("We did not receive a response. Please call again.", configuredLanguage) + "<Hangup/>"
      );
    }
    return twiml(
      say("Welcome to JanaSuvidha. Please describe the hospital issue you want to report after the tone.", configuredLanguage) +
      `<Gather input="speech" action="${request.nextUrl.pathname}?step=complaint" method="POST" language="${xmlEscape(configuredLanguage)}" speechTimeout="auto"/>` +
      say("We did not receive a complaint. Please call again when you are ready.", configuredLanguage) + "<Hangup/>"
    );
  }

  if (step !== "confirm") {
    await prisma.ivrCall.upsert({
      where: { callSid },
      update: { transcript: speech.slice(0, 12000), languageCode: code, status: "AWAITING_CONFIRMATION" },
      create: { callSid, transcript: speech.slice(0, 12000), languageCode: code, status: "AWAITING_CONFIRMATION" },
    });
    return twiml(
      say(`I heard: ${speech.slice(0, 450)}. If this is correct and you agree to send it to the hospital authorities, say yes. Otherwise say no.`, configuredLanguage) +
      `<Gather input="speech" action="${request.nextUrl.pathname}?step=confirm" method="POST" language="${xmlEscape(configuredLanguage)}" speechTimeout="auto"/>` +
      say("We did not receive confirmation. Your complaint was not submitted.", configuredLanguage) + "<Hangup/>"
    );
  }

  const call = await prisma.ivrCall.findUnique({ where: { callSid } });
  if (!call?.transcript) return twiml(say("I could not find the complaint from this call. Please call again.", configuredLanguage) + "<Hangup/>");
  if (isNo(speech)) {
    await prisma.ivrCall.update({ where: { callSid }, data: { status: "CANCELLED" } });
    return twiml(say("Your complaint was cancelled. Thank you for calling JanaSuvidha.", configuredLanguage) + "<Hangup/>");
  }
  if (!isYes(speech)) {
    return twiml(
      say("Please say yes to submit the complaint, or no to cancel.", configuredLanguage) +
      `<Gather input="speech" action="${request.nextUrl.pathname}?step=confirm" method="POST" language="${xmlEscape(configuredLanguage)}" speechTimeout="auto"/>` +
      "<Hangup/>"
    );
  }

  try {
    const result = await ComplaintService.createComplaint({
      idempotencyKey: `twilio:${callSid}`,
      transcript: call.transcript,
      languageCode: call.languageCode,
      location: process.env.IVR_LOCATION || "Outpatient Department, Ballari - Phone IVR",
      source: "PHONE_IVR",
      citizenPhone: caller,
    });
    await prisma.ivrCall.update({ where: { callSid }, data: { status: "COMPLETED", complaintId: result.complaint.id } });
    const ticket = result.complaint.complaintNumber || result.complaint.ticketNumber || "";
    return twiml(say(`Thank you. Your complaint has been registered. Your complaint number is ${ticket}.`, configuredLanguage) + "<Hangup/>");
  } catch (error) {
    console.error("[api/ivr/twilio] Complaint registration failed:", error);
    return twiml(say("We could not register your complaint just now. Please try again later.", configuredLanguage) + "<Hangup/>");
  }
}
