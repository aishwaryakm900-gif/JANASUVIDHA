import { TranslationService } from "@/lib/services/translation.service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, sourceLang } = await req.json();
    if (!text) {
      return NextResponse.json({ success: false, error: "Text is required" }, { status: 400 });
    }

    const translation = await TranslationService.translateToEnglish(text, sourceLang);
    return NextResponse.json({ success: true, translation });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

