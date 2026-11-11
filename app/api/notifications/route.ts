import { NextRequest, NextResponse } from "next/server";
import { DBService } from "@/lib/services/db.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department") || undefined;
    const recipientType = searchParams.get("recipientType") || undefined;

    const notifications = await DBService.getNotifications({
      department,
      recipientType,
    });

    return NextResponse.json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
