import { OtpService } from "@/lib/services/otp.service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Mobile number is required." },
        { status: 400 }
      );
    }

    const result = await OtpService.sendOtp(phone);

    return NextResponse.json({
      success: true,
      message: result.message,
      demoOtp: result.demoOtp,
      isDemo: result.isDemo,
      expiresInSeconds: result.expiresInSeconds,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to dispatch verification code." },
      { status: 500 }
    );
  }
}
