import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";

function secureEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isAuthorizedIvrWebhook(request: NextRequest): boolean {
  const secret = process.env.IVR_WEBHOOK_SECRET?.trim();
  // In development, if secret is not set, allow requests with a warning
  if (!secret) {
    if (process.env.NODE_ENV !== "production") return true;
    return false;
  }
  
  // 1. Authorization: Bearer <secret>
  const authorization = request.headers.get("authorization") || "";
  const bearer = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (bearer && secureEqual(bearer, secret)) return true;

  // 2. Custom headers: xi-api-key, x-webhook-secret
  const headerSecret = request.headers.get("x-webhook-secret") || request.headers.get("xi-api-key") || "";
  if (headerSecret && secureEqual(headerSecret.trim(), secret)) return true;

  // 3. Query parameter: ?secret=<secret>
  const querySecret = request.nextUrl.searchParams.get("secret") || "";
  if (querySecret && secureEqual(querySecret.trim(), secret)) return true;

  return false;
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
