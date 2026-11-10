"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Shield } from "lucide-react";
import { ComplaintItem } from "@/types";
import { formatDate } from "@/lib/utils";

export default function GrievanceReportPage() {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/complaints?publicOnly=true")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setComplaints(data.complaints);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F8F7] p-6 sm:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2EBE8]">
          <Link
            href="/citizen/kiosk"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#147D78] hover:text-[#0e5e5a] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Voice Kiosk</span>
          </Link>

          <span className="text-xs text-[#607477]">
            Privacy-Protected Grievance Record
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12343B]">
            Hospital Grievance Report
          </h1>
          <p className="text-xs sm:text-sm text-[#607477]">
            Live list of hospital concerns currently under resolution. No personal citizen details are displayed.
          </p>
        </div>

        {/* Complaints List Table */}
        {loading ? (
          <div className="py-20 text-center text-xs text-[#607477] flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#147D78]" />
            <span>Loading records...</span>
          </div>
        ) : complaints.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#E2EBE8] text-[#607477] text-xs">
            No grievances on record.
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#E2EBE8] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F8F7] text-[#607477] uppercase font-semibold border-b border-[#E2EBE8]">
                  <tr>
                    <th className="py-3 px-5">Complaint ID</th>
                    <th className="py-3 px-5">Summary</th>
                    <th className="py-3 px-5">Department</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2EBE8]">
                  {complaints.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F5F8F7]/50 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-[#12343B]">
                        {c.complaintNumber || c.ticketNumber}
                      </td>
                      <td className="py-3.5 px-5 font-medium text-[#263238]">
                        {c.summary}
                      </td>
                      <td className="py-3.5 px-5 text-[#607477]">
                        {c.departmentName || c.category || "Hospital Services"}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            c.status === "VERIFIED"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : c.status === "IN_PROGRESS"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-sky-50 text-sky-800 border border-sky-200"
                          }`}
                        >
                          {String(c.status ?? "pending").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-[#607477]">
                        {formatDate(c.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

