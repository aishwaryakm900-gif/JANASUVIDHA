import { RefreshCw } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] space-y-3">
      <RefreshCw className="w-8 h-8 text-teal-primary animate-spin" />
      <span className="text-xs font-semibold text-text-muted">
        Loading JANASUVIDHA Grievance Module...
      </span>
    </div>
  );
}

