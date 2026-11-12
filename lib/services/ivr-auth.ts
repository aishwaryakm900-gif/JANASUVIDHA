import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";

function secureEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isAuthorizedIvrWebhook(request: NextRequest): boolean {
  const secret = process.env.IVR_WEBHOOK_SECRET?.trim();
  if (!secret) return false;
  const authorization = request.headers.get("authorization") || "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  return Boolean(supplied) && secureEqual(supplied, secret);
}

export function isValidTwilioSignature(
  request: NextRequest,
  form: URLSearchParams
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const signature = request.headers.get("x-twilio-signature") || "";
  if (!authToken || !signature) return false;

  const configuredBase = process.env.TWILIO_WEBHOOK_BASE_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  const url = configuredBase
    ? `${configuredBase.replace(/\/$/, "")}${request.nextUrl.pathname}${request.nextUrl.search}`
    : request.url;
  let signed = url;
  const keys: string[] = [];
  form.forEach((_value, key) => {
    if (!keys.includes(key)) keys.push(key);
  });
  keys.sort();
  for (const key of keys) {
    signed += key + (form.get(key) || "");
  }
  const expected = createHmac("sha1", authToken).update(signed, "utf8").digest("base64");
  return secureEqual(signature, expected);
}
