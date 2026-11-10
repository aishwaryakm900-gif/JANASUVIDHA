import { OtpService } from "@/lib/services/otp.service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { phone, code, otp } = await req.json();
    const token = code || otp;

    if (!phone || !token) {
      return NextResponse.json(
        { success: false, error: "Phone number and 6-digit OTP code are required." },
        { status: 400 }
      );
    }

    const result = await OtpService.verifyOtp(phone, token);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Invalid OTP code." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Mobile number verified successfully.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "OTP verification failed." },
      { status: 500 }
    );
  }
}
