"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  Download,
  Receipt,
  Eye,
  X,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Pill,
  Phone,
  Send,
} from "lucide-react";
import { ComplaintItem } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { ComplaintReceiptCard } from "@/components/ComplaintReceiptCard";

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"ALL" | "FACILITY" | "MEDICINE">("ALL");
  const [activeComplaint, setActiveComplaint] = useState<ComplaintItem | null>(null);
  const [showReceiptOnly, setShowReceiptOnly] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/complaints");
      const data = await res.json();
      if (data.success) {
        setComplaints(data.complaints);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkMedicineAvailable = async (complaint: ComplaintItem) => {
    setUpdatingId(complaint.id);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "VERIFIED",
          actorName: "Hospital Administrator",
          actorRole: "ADMIN",
          notes: `Medicine "${complaint.medicineName || complaint.summary}" confirmed in stock. Dispatched SMS notification to ${complaint.citizenPhone || complaint.maskedCitizenPhone}.`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNotificationMsg(
          `✓ Medicine marked AVAILABLE! SMS alert triggered to ${complaint.citizenPhone || complaint.maskedCitizenPhone || "citizen"}.`
        );
        setTimeout(() => setNotificationMsg(null), 5000);
        await loadData();
        if (activeComplaint && activeComplaint.id === complaint.id) {
          setActiveComplaint(data.complaint);
        }
      }
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExportCSV = () => {
    if (!complaints.length) return;
    const headers = [
      "Complaint ID",
      "Type",
      "Medicine Name",
      "Citizen Phone",
      "Original Language",
      "Original Transcript",
      "English Translation",
      "Summary",
      "Category",
      "Department",
      "Responsible Authority",
      "Reporting Location",
      "Submission Date & Time",
      "Status",
    ];

    const rows = (complaints || []).map((c) => [
      `"${c.complaintNumber || c.ticketNumber || ""}"`,
      `"${c.isMedicineComplaint ? "MEDICINE_REQUEST" : "FACILITY_GRIEVANCE"}"`,
      `"${String(c.medicineName ?? "").replace(/"/g, '""')}"`,
      `"${c.citizenPhone || c.maskedCitizenPhone || ""}"`,
      `"${c.originalLanguage || ""}"`,
      `"${String(c.originalTranscript ?? "").replace(/"/g, '""')}"`,
      `"${String((c.englishTranslation || c.translatedText) ?? "").replace(/"/g, '""')}"`,
      `"${String(c.summary ?? "").replace(/"/g, '""')}"`,
      `"${c.category || ""}"`,
      `"${c.departmentName || ""}"`,
      `"${c.assignedOfficialName || "Department Supervisor"}"`,
      `"${c.wardOrLocation || ""}"`,
      `"${c.receipt?.submissionDate || ""} ${c.receipt?.submissionTime || ""}"`,
      `"${String(c.status ?? "")}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `janasuvidha-citizen-grievances-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = (complaints || []).filter((c) => {
    if (activeTab === "MEDICINE" && !c.isMedicineComplaint && c.category !== "Pharmacy and Medicine Availability") return false;
    if (activeTab === "FACILITY" && (c.isMedicineComplaint || c.category === "Pharmacy and Medicine Availability")) return false;
    if (selectedStatus !== "ALL" && c.status !== selectedStatus) return false;
    if (selectedDept !== "ALL" && c.departmentName !== selectedDept) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        (c.complaintNumber && c.complaintNumber.toLowerCase().includes(q)) ||
        (c.ticketNumber && c.ticketNumber.toLowerCase().includes(q)) ||
        (c.medicineName && c.medicineName.toLowerCase().includes(q)) ||
        (c.citizenPhone && c.citizenPhone.includes(q)) ||
        (c.summary && c.summary.toLowerCase().includes(q)) ||
        (c.originalTranscript && c.originalTranscript.toLowerCase().includes(q)) ||
        (c.englishTranslation && c.englishTranslation.toLowerCase().includes(q)) ||
        (c.wardOrLocation && c.wardOrLocation.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F5F8F7] p-6 sm:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between pb-4 border-b border-[#E2EBE8]">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#147D78] hover:text-[#0e5e5a] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Admin Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              className="p-2 rounded-xl bg-white border border-[#E2EBE8] text-[#607477] hover:text-[#12343B] cursor-pointer"
              title="Refresh Records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#147D78] bg-[#E8F4F1] px-3.5 py-1.5 rounded-xl border border-[#147D78]/20 hover:bg-[#147D78] hover:text-white transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {notificationMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-3.5 rounded-2xl animate-in fade-in flex items-center justify-between shadow-xs">
            <span>{notificationMsg}</span>
            <button
              type="button"
              onClick={() => setNotificationMsg(null)}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="space-y-1">
          <span className="text-[11px] font-bold text-[#147D78] uppercase tracking-wider block">
            Centralized Grievance & Availability Registry
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12343B]">
            Citizen Grievance Records
          </h1>
          <p className="text-xs text-[#607477]">
            Complete canonical repository of grievances and medicine availability requests captured across Victoria District Hospital.
          </p>
        </div>

        {/* Tab switcher: All vs Facility vs Medicine */}
        <div className="flex items-center gap-2 border-b border-[#E2EBE8] pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`text-xs font-bold px-4 py-2 rounded-t-xl transition-all cursor-pointer ${
              activeTab === "ALL"
                ? "bg-white text-[#147D78] border-t-2 border-[#147D78] shadow-2xs"
                : "text-[#607477] hover:text-[#12343B]"
            }`}
          >
            All Grievances ({complaints.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("FACILITY")}
            className={`text-xs font-bold px-4 py-2 rounded-t-xl transition-all cursor-pointer ${
              activeTab === "FACILITY"
                ? "bg-white text-[#147D78] border-t-2 border-[#147D78] shadow-2xs"
                : "text-[#607477] hover:text-[#12343B]"
            }`}
          >
            Public Facility Issues ({complaints.filter((c) => !c.isMedicineComplaint && c.category !== "Pharmacy and Medicine Availability").length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("MEDICINE")}
            className={`text-xs font-bold px-4 py-2 rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "MEDICINE"
                ? "bg-white text-blue-700 border-t-2 border-blue-600 shadow-2xs"
                : "text-[#607477] hover:text-[#12343B]"
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>Medicine Availability ({complaints.filter((c) => c.isMedicineComplaint || c.category === "Pharmacy and Medicine Availability").length})</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#607477] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, medicine, phone, transcript..."
              className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-[#E2EBE8] bg-white focus:outline-none focus:border-[#147D78]"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs py-2 px-3 rounded-xl border border-[#E2EBE8] bg-white text-[#12343B] focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              <option value="Hygiene and Sanitation">Hygiene and Sanitation</option>
              <option value="Water and Facilities">Water and Facilities</option>
              <option value="Pharmacy and Medicine Availability">Pharmacy & Medicine</option>
              <option value="Bed Management">Bed Management</option>
              <option value="Infrastructure Maintenance">Infrastructure</option>
              <option value="Hospital Services">Hospital Services</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs py-2 px-3 rounded-xl border border-[#E2EBE8] bg-white text-[#12343B] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLUTION_SUBMITTED">Resolution Submitted</option>
              <option value="VERIFIED">Verified / Available</option>
              <option value="ESCALATED">Escalated</option>
            </select>
          </div>
        </div>

        {/* Master Table */}
        <div className="bg-white rounded-3xl border border-[#E2EBE8] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F8F7] text-[#607477] uppercase font-semibold border-b border-[#E2EBE8]">
                <tr>
                  <th className="py-3 px-4">Complaint ID</th>
                  <th className="py-3 px-4">Type / Medicine</th>
                  <th className="py-3 px-4">Registered Phone</th>
                  <th className="py-3 px-4">Language</th>
                  <th className="py-3 px-4">Summary</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2EBE8]">
                {filtered.map((c) => {
                  const isMed = c.isMedicineComplaint || c.category === "Pharmacy and Medicine Availability";
                  return (
                    <tr key={c.id} className="hover:bg-[#F5F8F7]/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#12343B] whitespace-nowrap">
                        <div>{c.complaintNumber || c.ticketNumber}</div>
                        {c.recurrenceCount && c.recurrenceCount > 1 && (
                          <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            ⚡ {c.recurrenceCount} Confirmations
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {isMed ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            <Pill className="w-3 h-3 text-blue-600" />
                            <span>{c.medicineName || "Prescribed Medicine"}</span>
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                            Public Facility
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-[#12343B] whitespace-nowrap">
                        {c.citizenPhone ? (
                          <span className="text-[#12343B]">{c.citizenPhone}</span>
                        ) : c.maskedCitizenPhone ? (
                          <span className="text-[#607477]">{c.maskedCitizenPhone}</span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">N/A</span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#E8F4F1] text-[#147D78]">
                          {c.originalLanguage}
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-[#12343B] truncate">
                          {c.summary}
                        </div>
                        <div className="text-[11px] text-[#607477] italic truncate">
                          "{c.originalTranscript}"
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-medium text-[#12343B] block">
                          {c.departmentName}
                        </span>
                        <span className="text-[10px] text-[#607477]">
                          {c.assignedOfficialName || "Assigned Officer"}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            c.status === "VERIFIED"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : c.status === "IN_PROGRESS"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : c.status === "RESOLUTION_SUBMITTED"
                              ? "bg-blue-50 text-blue-800 border border-blue-200"
                              : "bg-sky-50 text-sky-800 border border-sky-200"
                          }`}
                        >
                          {c.status === "VERIFIED" && isMed ? "AVAILABLE & NOTIFIED" : String(c.status ?? "pending").replace(/_/g, " ")}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                        {isMed && c.status !== "VERIFIED" && (
                          <button
                            type="button"
                            onClick={() => handleMarkMedicineAvailable(c)}
                            disabled={updatingId === c.id}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 rounded-lg shadow-2xs transition-all cursor-pointer"
                            title="Mark Available & Send SMS"
                          >
                            <Send className="w-3 h-3" />
                            <span>Mark Available</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setActiveComplaint(c);
                            setShowReceiptOnly(true);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#147D78] bg-[#E8F4F1] hover:bg-[#147D78] hover:text-white px-2.5 py-1 rounded-lg border border-[#147D78]/20 transition-all cursor-pointer"
                          title="Print / View Receipt"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>Receipt</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveComplaint(c);
                            setShowReceiptOnly(false);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#607477] hover:text-[#12343B] bg-white border border-[#E2EBE8] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DETAIL AUDIT & MEDICINE MODAL */}
      {activeComplaint && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2EBE8]">
              <div>
                <span className="font-mono text-xs font-bold text-[#147D78] bg-[#E8F4F1] px-2 py-0.5 rounded">
                  {activeComplaint.complaintNumber || activeComplaint.ticketNumber}
                </span>
                <h3 className="text-lg font-extrabold text-[#12343B] mt-1">
                  {showReceiptOnly
                    ? "Citizen Grievance Receipt"
                    : activeComplaint.isMedicineComplaint
                    ? "Medicine Availability Request Audit"
                    : "Complaint Audit & History"}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowReceiptOnly(!showReceiptOnly)}
                  className="text-xs font-semibold text-[#147D78] hover:underline px-2 py-1 cursor-pointer"
                >
                  {showReceiptOnly ? "View History" : "View Receipt"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveComplaint(null)}
                  className="text-[#607477] hover:text-[#12343B] p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {showReceiptOnly ? (
              /* RECEIPT VIEW */
              <div className="flex flex-col items-center py-2">
                {activeComplaint.receipt ? (
                  <ComplaintReceiptCard receipt={activeComplaint.receipt} />
                ) : (
                  <div className="text-xs text-[#607477]">Receipt data not generated.</div>
                )}
              </div>
            ) : (
              /* COMPLETE HISTORY TIMELINE & MEDICINE DETAILS */
              <div className="space-y-5 text-xs">
                {/* Medicine / Facility Details block */}
                <div className="p-4 bg-[#F5F8F7] rounded-2xl border border-[#E2EBE8] space-y-3">
                  {activeComplaint.isMedicineComplaint && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-900 uppercase flex items-center gap-1">
                          <Pill className="w-3.5 h-3.5 text-blue-700" />
                          <span>Medicine Name:</span>
                        </span>
                        <strong className="text-sm font-extrabold text-blue-900">
                          {activeComplaint.medicineName || "Prescribed Medicine"}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-blue-800 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-blue-700" />
                          <span>Citizen Mobile (for SMS Alert):</span>
                        </span>
                        <strong className="font-mono text-blue-950">
                          {activeComplaint.citizenPhone || activeComplaint.maskedCitizenPhone || "N/A"}
                        </strong>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[#607477] block">Hospital:</span>
                      <strong className="text-[#12343B]">{activeComplaint.hospitalName}</strong>
                    </div>
                    <div>
                      <span className="text-[#607477] block">Location:</span>
                      <strong className="text-[#12343B]">{activeComplaint.wardOrLocation}</strong>
                    </div>
                    <div>
                      <span className="text-[#607477] block">Department:</span>
                      <strong className="text-[#147D78]">{activeComplaint.departmentName}</strong>
                    </div>
                    <div>
                      <span className="text-[#607477] block">Responsible Authority:</span>
                      <strong className="text-[#12343B]">
                        {activeComplaint.assignedOfficialName || "Department Supervisor"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#607477] block">Original Language:</span>
                      <strong className="text-[#12343B]">{activeComplaint.originalLanguage}</strong>
                    </div>
                    <div>
                      <span className="text-[#607477] block">Current Status:</span>
                      <span className="font-bold text-[#147D78]">{activeComplaint.status}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E2EBE8]">
                    <span className="text-[#607477] text-[10px] uppercase font-semibold block">
                      Original Transcript:
                    </span>
                    <p className="italic text-[#263238]">"{activeComplaint.originalTranscript}"</p>
                  </div>

                  <div>
                    <span className="text-[#607477] text-[10px] uppercase font-semibold block">
                      English Translation:
                    </span>
                    <p className="font-semibold text-[#12343B]">
                      "{activeComplaint.englishTranslation || activeComplaint.translatedText}"
                    </p>
                  </div>
                </div>

                {/* Quick Action: Mark Medicine Available */}
                {activeComplaint.isMedicineComplaint && activeComplaint.status !== "VERIFIED" && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <strong className="text-xs font-bold text-emerald-950 block">
                        Mark Medicine Available
                      </strong>
                      <span className="text-[11px] text-emerald-800">
                        Restock confirmed. Will immediately send SMS to {activeComplaint.citizenPhone || activeComplaint.maskedCitizenPhone}.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleMarkMedicineAvailable(activeComplaint)}
                      disabled={updatingId === activeComplaint.id}
                      className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      Mark Available & Send SMS
                    </button>
                  </div>
                )}

                {/* Event Audit Trail */}
                <div className="space-y-3">
                  <h4 className="font-bold text-[#12343B] uppercase text-[11px] tracking-wider">
                    Official Event Timeline
                  </h4>
                  <div className="space-y-2 border-l-2 border-[#147D78]/30 ml-2 pl-3">
                    {activeComplaint.events?.map((ev) => (
                      <div key={ev.id} className="relative space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#147D78] text-[11px]">
                            {ev.eventType}
                          </span>
                          <span className="text-[10px] text-[#607477]">
                            by {ev.performedBy}
                          </span>
                        </div>
                        <p className="text-[#263238] text-[11px]">{ev.description}</p>
                        <span className="text-[10px] text-[#607477] font-mono block">
                          {formatDateTime(ev.timestamp || ev.createdAt || new Date().toISOString())}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
