import { NextRequest, NextResponse } from "next/server";
import { GeminiService } from "@/lib/services/gemini.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // 1. Audio file uploaded via FormData (MediaRecorder audio blob)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const audioFile = formData.get("audio") as Blob | null;
      const mimeType = (formData.get("mimeType") as string) || audioFile?.type || "audio/webm";
      const liveTranscript = (formData.get("liveTranscript") as string) || "";

      if (!audioFile && !liveTranscript) {
        return NextResponse.json(
          {
            success: false,
            unclear: true,
            error: "No audio stream provided in request.",
            spokenConfirmation: "ಕ್ಷಮಿಸಿ, ಧ್ವನಿ ದಾಖಲಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಮಾತನಾಡಿ.",
          },
          { status: 400 }
        );
      }

      const arrayBuffer = audioFile ? await audioFile.arrayBuffer() : new ArrayBuffer(0);
      const buffer = Buffer.from(arrayBuffer);

      let result = await GeminiService.processAudio(buffer, mimeType, liveTranscript);
      if (result.unclear && liveTranscript.trim()) {
        result = await GeminiService.processText(liveTranscript.trim());
      }
      return NextResponse.json({
        success: !result.unclear,
        ...result,
      });
    }

    // 2. JSON request (base64 audio or text simulation)
    const body = await req.json();

    if (body.audioBase64) {
      const buffer = Buffer.from(body.audioBase64, "base64");
      const mimeType = body.mimeType || "audio/webm";
      const result = await GeminiService.processAudio(buffer, mimeType);
      return NextResponse.json({
        success: !result.unclear,
        ...result,
      });
    }

    if (body.text) {
      const result = await GeminiService.processText(body.text);
      return NextResponse.json({
        success: !result.unclear,
        ...result,
      });
    }

    return NextResponse.json(
      {
        success: false,
        unclear: true,
        error: "Missing audio or text payload in request.",
        spokenConfirmation: "ದಯವಿಟ್ಟು ಮೈಕ್ರೊಫೋನ್ ಬಳಸಿ ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ತಿಳಿಸಿ.",
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[api/voice/process] Processing error:", error);
    return NextResponse.json(
      {
        success: false,
        unclear: true,
        error: error.message || "Failed to process voice input",
        spokenConfirmation: "ಕ್ಷಮಿಸಿ, ಧ್ವನಿ ಪ್ರಕ್ರಿಯೆಗೊಳಿಸುವಲ್ಲಿ ದೋಷ ಸಂಭವಿಸಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಮಾತನಾಡಿ.",
      },
      { status: 500 }
    );
  }
}
