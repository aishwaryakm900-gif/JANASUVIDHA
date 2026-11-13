"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-[#F5F8F7] text-[#263238] p-4 font-sans">
        <div className="max-w-md w-full bg-white border border-[#E2EBE8] rounded-2xl p-8 text-center shadow-lg space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
              System Notice
            </span>
            <h1 className="text-2xl font-extrabold text-[#12343B]">
              Application Error
            </h1>
            <p className="text-xs text-[#607477] leading-relaxed">
              {error?.message || "An unexpected application error occurred. Please try reloading."}
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center gap-2 bg-[#147D78] hover:bg-[#0e5e5a] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
            <a
              href="/"
              className="inline-flex items-center gap-2 bg-white hover:bg-[#F5F8F7] text-[#12343B] border border-[#E2EBE8] text-xs font-bold px-5 py-2.5 rounded-xl transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Return Home</span>
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
