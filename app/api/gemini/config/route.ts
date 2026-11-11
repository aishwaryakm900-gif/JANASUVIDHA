import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Gemini API key is not configured." }, { status: 503 });

  try {
    const now = Date.now();
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/auth_tokens", {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        uses: 1,
        expireTime: new Date(now + 30 * 60 * 1000).toISOString(),
        newSessionExpireTime: new Date(now + 60 * 1000).toISOString(),
      }),
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data.error?.message || "Unable to create Gemini Live token." }, { status: response.status });
    return NextResponse.json({ token: data.name }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[api/gemini/config] Token creation failed:", error);
    return NextResponse.json({ error: "Unable to create Gemini Live token." }, { status: 502 });
  }
}

