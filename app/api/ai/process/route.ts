import { AIService } from "@/lib/services/ai.service";
import { TranslationService } from "@/lib/services/translation.service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, location } = await req.json();
    if (!text || !text.trim()) {
      return NextResponse.json({ success: false, error: "Speech text is required" }, { status: 400 });
    }

    // 1. Detect language, translate, and formulate verbal confirmation in same language
    const translation = await TranslationService.processComplaintSpeech(text);

    // 2. Classify category and department
    const classification = await AIService.classifyComplaint(
      translation.translatedText,
      location || "Hospital Facility"
    );

    return NextResponse.json({
      success: true,
      detectedLanguage: translation.detectedLanguage,
      originalText: text,
      translatedText: translation.translatedText,
      spokenConfirmation: translation.spokenConfirmation,
      category: classification.category,
      departmentName: classification.departmentName,
      departmentCode: classification.departmentCode,
      suggestedPriority: classification.suggestedPriority,
      summary: classification.summary,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

