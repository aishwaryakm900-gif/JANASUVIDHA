import { AIService } from "@/lib/services/ai.service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, location } = await req.json();
    if (!text) {
      return NextResponse.json({ success: false, error: "Text is required" }, { status: 400 });
    }

    const classification = await AIService.classifyComplaint(text, location);
    return NextResponse.json({ success: true, classification });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

