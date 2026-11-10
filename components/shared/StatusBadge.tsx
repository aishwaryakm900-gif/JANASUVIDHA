import { ComplaintStatus } from "@/types";
import { CheckCircle2, Clock, AlertTriangle, AlertCircle, RefreshCw, ShieldCheck, ArrowUpRight } from "lucide-react";

interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-medium",
    md: "px-2.5 py-1 text-xs font-semibold",
    lg: "px-3.5 py-1.5 text-sm font-semibold",
  };

  switch (status) {
    case "PENDING":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses[size]}`}>
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Pending Triage
        </span>
      );
    case "ASSIGNED":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 ${sizeClasses[size]}`}>
          <Clock className="w-3.5 h-3.5 text-sky-600" />
          Assigned to Officer
        </span>
      );
    case "IN_PROGRESS":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 ${sizeClasses[size]}`}>
          <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
          In Progress
        </span>
      );
    case "RESOLUTION_SUBMITTED":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 ${sizeClasses[size]}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-primary" />
          Resolution Submitted
        </span>
      );
    case "VERIFIED":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 ${sizeClasses[size]}`}>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Verified & Resolved
        </span>
      );
    case "REOPENED":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200 ${sizeClasses[size]}`}>
          <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
          Reopened by Citizen
        </span>
      );
    case "ESCALATED":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 ${sizeClasses[size]}`}>
          <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
          Escalated (SLA Alert)
        </span>
      );
    case "CLOSED":
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-gray-100 text-gray-700 border border-gray-300 ${sizeClasses[size]}`}>
          Closed
        </span>
      );
  }
}

