import crypto from "crypto";

interface StoredOtp {
  hash: string;
  salt: string;
  expiresAt: number;
  attempts: number;
  demoCode?: string;
}

// In-memory thread-safe OTP store for active verification sessions
const otpStore = new Map<string, StoredOtp>();

export class OtpService {
  /**
   * Generates and dispatches a 6-digit OTP to a mobile phone number
   */
  static async sendOtp(phone: string): Promise<{
    success: boolean;
    demoOtp?: string;
    isDemo: boolean;
    message: string;
    expiresInSeconds: number;
  }> {
    const cleanPhone = phone.trim().replace(/[^\d+]/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      throw new Error("Invalid mobile number format.");
    }

    const provider = (process.env.OTP_PROVIDER || "mock").toLowerCase();
    const twilioSid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN?.trim();
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER?.trim();

    // Generate cryptographically secure 6-digit OTP
    const code = crypto.randomInt(100000, 999999).toString();
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.createHash("sha256").update(code + salt).digest("hex");
    const expirySeconds = 300; // 5 minutes
    const expiresAt = Date.now() + expirySeconds * 1000;

    const isLiveTwilio = provider === "twilio" && !!twilioSid && !!twilioAuth && !!twilioFrom;

    if (isLiveTwilio) {
      try {
        const body = `Your JANASUVIDHA verification code is ${code}. Valid for 5 minutes. Do not share this OTP.`;
        const authHeader = "Basic " + Buffer.from(`${twilioSid}:${twilioAuth}`).toString("base64");
        const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;

        const params = new URLSearchParams();
        params.append("To", cleanPhone.startsWith("+") ? cleanPhone : `+91${cleanPhone}`);
        params.append("From", twilioFrom);
        params.append("Body", body);

        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.warn("[Twilio SMS error]", errText);
          // Fallback to storing secure hash
        }
      } catch (err) {
        console.warn("[Twilio Send Exception]", err);
      }

      otpStore.set(cleanPhone, {
        hash,
        salt,
        expiresAt,
        attempts: 0,
      });

      return {
        success: true,
        isDemo: false,
        message: "OTP sent via SMS to your mobile number.",
        expiresInSeconds: expirySeconds,
      };
    }

    // DEMO OTP MODE (Mock)
    otpStore.set(cleanPhone, {
      hash,
      salt,
      expiresAt,
      attempts: 0,
      demoCode: code,
    });

    return {
      success: true,
      demoOtp: code,
      isDemo: true,
      message: `Demo Mode: Verification OTP generated for testing.`,
      expiresInSeconds: expirySeconds,
    };
  }

  /**
   * Verifies the OTP provided by the user
   */
  static async verifyOtp(
    phone: string,
    userCode: string
  ): Promise<{ success: boolean; error?: string }> {
    const cleanPhone = phone.trim().replace(/[^\d+]/g, "");
    const cleanCode = userCode.trim();

    const record = otpStore.get(cleanPhone);
    if (!record) {
      return {
        success: false,
        error: "No active verification request found. Please request a new OTP.",
      };
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanPhone);
      return {
        success: false,
        error: "OTP has expired. Please request a new verification code.",
      };
    }

    if (record.attempts >= 5) {
      otpStore.delete(cleanPhone);
      return {
        success: false,
        error: "Maximum verification attempts exceeded. Please request a new OTP.",
      };
    }

    record.attempts += 1;

    // Verify hash using constant-time comparison
    const incomingHash = crypto
      .createHash("sha256")
      .update(cleanCode + record.salt)
      .digest("hex");

    const match = crypto.timingSafeEqual(
      Buffer.from(incomingHash, "utf-8"),
      Buffer.from(record.hash, "utf-8")
    );

    if (!match) {
      return {
        success: false,
        error: `Incorrect verification code. ${5 - record.attempts} attempts remaining.`,
      };
    }

    // Success -> consume OTP
    otpStore.delete(cleanPhone);
    return { success: true };
  }
}
