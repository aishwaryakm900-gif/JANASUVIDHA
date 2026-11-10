"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center space-y-6">
      <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
          System Notice
        </span>
        <h1 className="text-2xl font-extrabold text-teal-deep">
          Something went wrong
        </h1>
        <p className="text-xs text-text-muted leading-relaxed">
          {error.message || "An unexpected error occurred while loading this hospital redressal module."}
        </p>
      </div>

      <div className="flex justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 bg-teal-primary hover:bg-teal-hover text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-white hover:bg-surface-hover text-teal-deep border border-surface-border text-xs font-bold px-5 py-2.5 rounded-xl transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}

