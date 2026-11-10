import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/janasuvidha?schema=public"),
  AI_API_KEY: z.string().optional().default(""),
  AI_MODEL: z.string().default("gemini-1.5-flash"),
  AI_BASE_URL: z.string().optional().default(""),
  SPEECH_API_KEY: z.string().optional().default(""),
  SPEECH_API_BASE_URL: z.string().optional().default(""),
  SPEECH_PROVIDER: z.string().default("bhashini"),
  TTS_API_KEY: z.string().optional().default(""),
  TTS_API_BASE_URL: z.string().optional().default(""),
  SMS_API_KEY: z.string().optional().default(""),
  SMS_API_SECRET: z.string().optional().default(""),
  SMS_SENDER_ID: z.string().default("JANASV"),
  SMS_PROVIDER: z.string().default("mock"),
  OTP_EXPIRY_SECONDS: z.coerce.number().default(300),
  AUTH_SECRET: z.string().default("janasuvidha-local-dev-secret-key-32-chars-long"),
  NEXTAUTH_SECRET: z.string().default("janasuvidha-local-dev-secret-key-32-chars-long"),
  STORAGE_PROVIDER: z.string().default("local"),
  STORAGE_ACCESS_KEY: z.string().optional().default(""),
  STORAGE_SECRET_KEY: z.string().optional().default(""),
  STORAGE_BUCKET: z.string().default("janasuvidha-evidence"),
  STORAGE_ENDPOINT: z.string().optional().default(""),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_DEMO_MODE: z.string().default("true"),
});

export type EnvConfig = z.infer<typeof envSchema>;

function parseEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.warn("⚠️ Invalid or missing environment variables; falling back to safe defaults with Demo Mode:", result.error.format());
    return envSchema.parse({
      NEXT_PUBLIC_DEMO_MODE: "true",
    });
  }
  return result.data;
}

export const env = parseEnv();

export const isDemoMode = env.NEXT_PUBLIC_DEMO_MODE === "true" || !env.AI_API_KEY || !env.SMS_API_KEY;

