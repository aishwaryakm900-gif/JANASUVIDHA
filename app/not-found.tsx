import Link from "next/link";
import { ShieldAlert, ArrowLeft, Home, HelpCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center space-y-6">
      <div className="w-16 h-16 rounded-3xl bg-teal-soft text-teal-primary flex items-center justify-center mx-auto shadow-sm">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold text-teal-primary uppercase tracking-wider">
          404 — Page Not Found
        </span>
        <h1 className="text-3xl font-extrabold text-teal-deep">
          Hospital Route Not Found
        </h1>
        <p className="text-xs text-text-muted leading-relaxed">
          The requested page or grievance file does not exist or has been relocated within the hospital system.
        </p>
      </div>

      <div className="flex justify-center gap-3 pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-teal-primary hover:bg-teal-hover text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Go to Home</span>
        </Link>
        <Link
          href="/citizen/issues"
          className="inline-flex items-center gap-2 bg-white hover:bg-surface-hover text-teal-deep border border-surface-border text-xs font-bold px-5 py-2.5 rounded-xl transition-colors"
        >
          <span>Public Board</span>
        </Link>
      </div>
    </div>
  );
}

