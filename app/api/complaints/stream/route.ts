import { NextRequest } from "next/server";
import { DBService } from "@/lib/services/db.service";

export const dynamic = "force-dynamic";

/**
 * Server-Sent Events (SSE) route for real-time complaint list updates
 */
export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial snapshot
      try {
        const complaints = await DBService.getComplaints();
        controller.enqueue(
          encoder.encode(`event: initial\ndata: ${JSON.stringify({ complaints, timestamp: new Date().toISOString() })}\n\n`)
        );
      } catch (err: any) {
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`));
      }

      // Keep connection alive with periodic check / heartbeat every 5 seconds
      const interval = setInterval(async () => {
        try {
          const complaints = await DBService.getComplaints();
          controller.enqueue(
            encoder.encode(`event: update\ndata: ${JSON.stringify({ count: complaints.length, complaints, timestamp: new Date().toISOString() })}\n\n`)
          );
        } catch {
          // Stream might be closed by client
        }
      }, 5000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

