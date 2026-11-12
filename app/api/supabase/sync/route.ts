import { NextRequest, NextResponse } from "next/server";
import { SupabaseSyncService } from "@/lib/services/supabase-sync.service";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

/**
 * Check Supabase connection status
 */
export async function GET() {
  const configured = SupabaseSyncService.isConfigured();
  return NextResponse.json({
    success: true,
    supabaseConfigured: configured,
    message: configured
      ? "Supabase credentials detected in environment."
      : "Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or ANON_KEY to .env.local",
  });
}

/**
 * Trigger full synchronization of all data from local DB to Supabase
 */
export async function POST(req: NextRequest) {
  try {
    const report = await SupabaseSyncService.syncAllDataToSupabase();
    return NextResponse.json({
      success: report.success,
      report,
    }, { status: report.success ? 200 : (report.configured ? 500 : 400) });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
    }, { status: 500 });
  }
}

