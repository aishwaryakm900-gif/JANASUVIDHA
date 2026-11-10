"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, RefreshCw, LogOut, CheckCircle, ShieldCheck, Building2, BellRing, PackageCheck, AlertCircle } from "lucide-react";
import { ComplaintItem, PrivateAvailabilityRequest } from "@/types";
import { formatDateTime } from "@/lib/utils";

export default function OfficialDashboardPage() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [availabilityRequests, setAvailabilityRequests] = useState<PrivateAvailabilityRequest[]>([]);
  const [mainView, setMainView] = useState<"GRIEVANCES" | "AVAILABILITY">("GRIEVANCES");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [updatingReqId, setUpdatingReqId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [official, setOfficial] = useState<any>({
    name: "Demo Official",
    designation: "Department Officer",
    departmentName: "Hygiene and Sanitation",
    hospitalName: "Victoria District Hospital",
  });

  const normalizeComplaint = (c: any): ComplaintItem => {
    const status = c?.status || "ASSIGNED";
    return {
      ...c,
      id: c?.id || `comp-${Math.random().toString(36).slice(2, 7)}`,
      complaintNumber: c?.complaintNumber || c?.ticketNumber || "JNS-2026-UNKNOWN",
      ticketNumber: c?.ticketNumber || c?.complaintNumber || "JNS-2026-UNKNOWN",
      status,
      priority: c?.priority || "Medium",
      category: c?.category || "Hospital Services",
      departmentName: c?.departmentName || "Hospital Services",
      wardOrLocation: c?.wardOrLocation || c?.location || "Victoria District Hospital - Kiosk #1",
      summary: c?.summary || c?.originalTranscript || "Hospital grievance reported",
      originalTranscript: c?.originalTranscript || "",
      englishTranslation: c?.englishTranslation || c?.originalTranscript || "",
      submittedAt: c?.submittedAt || c?.createdAt || new Date().toISOString(),
      createdAt: c?.createdAt || c?.submittedAt || new Date().toISOString(),
      citizenName: c?.citizenName || "Citizen",
      citizenPhone: c?.citizenPhone || "",
      maskedCitizenPhone: c?.maskedCitizenPhone || (c?.citizenPhone ? `XXXXXX${c.citizenPhone.slice(-4)}` : undefined),
      medicineName: c?.medicineName,
      isMedicineComplaint: Boolean(c?.isMedicineComplaint),
      hospitalName: c?.hospitalName || "Victoria District Hospital",
    };
  };

  const normalizeAvailabilityRequest = (req: any): PrivateAvailabilityRequest => {
    const status = req?.status || "Pending";
    return {
      ...req,
      id: req?.id || `req-${Math.random().toString(36).slice(2, 7)}`,
      requestNumber: req?.requestNumber || req?.requestId || req?.id || "JNS-2026-AV-UNKNOWN",
      requestedResource: req?.requestedResource || req?.resourceName || "Prescribed Medicine",
      resourceType: req?.resourceType || "MEDICINE",
      departmentName: req?.departmentName || "Pharmacy and Medicine Availability",
      hospitalName: req?.hospitalName || "Victoria District Hospital",
      status,
      createdAt: req?.createdAt || new Date().toISOString(),
      updatedAt: req?.updatedAt || new Date().toISOString(),
      verifiedPhoneNumber: req?.verifiedPhoneNumber || req?.phone || "",
      maskedPhone: req?.maskedPhone || (req?.verifiedPhoneNumber ? `XXXXXX${req.verifiedPhoneNumber.slice(-4)}` : ""),
    };
  };

  const loadData = async (currentOfficial = official) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentOfficial.departmentName && currentOfficial.designation !== "Hospital Administrator") {
        params.append("department", currentOfficial.departmentName);
        params.append("designation", currentOfficial.designation);
      }

      // 1. Load public complaints
      const res = await fetch(`/api/complaints?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.complaints)) {
        setComplaints(data.complaints.map(normalizeComplaint));
      } else {
        setComplaints([]);
      }

      // 2. Load private availability requests for this department/hospital
      const reqRes = await fetch(`/api/availability-requests?department=${encodeURIComponent(currentOfficial.departmentName || "")}`);
      const reqData = await reqRes.json();
      if (reqData.success && Array.isArray(reqData.requests)) {
        setAvailabilityRequests(reqData.requests.map(normalizeAvailabilityRequest));
      } else {
        setAvailabilityRequests([]);
      }
    } catch (e) {
      console.error(e);
      setComplaints([]);
      setAvailabilityRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let current = official;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("janasuvidha_official");
      if (saved) {
        try {
          current = JSON.parse(saved);
          setOfficial(current);
        } catch (e) {}
      }
    }
    loadData(current);
  }, []);

  const handleLogout = () => {
    document.cookie = "official_session=; path=/; max-age=0";
    if (typeof window !== "undefined") {
      localStorage.removeItem("janasuvidha_official");
    }
    router.push("/official/login");
  };

  const handleMarkAvailable = async (reqId: string, resourceName: string) => {
    setUpdatingReqId(reqId);
    setActionNotice(null);
    try {
      const res = await fetch(`/api/availability-requests/${reqId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "AVAILABLE",
          notes: `Marked available by ${official.name} (${official.departmentName}). Citizen alert dispatched.`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice(`Resource marked AVAILABLE. SMS notification successfully sent to citizen for ${resourceName}.`);
        await loadData();
      } else {
        alert(data.error || "Failed to update status");
      }
    } catch (e) {
      console.error(e);
      alert("Error sending update");
    } finally {
      setUpdatingReqId(null);
    }
  };

  const safeComplaints = Array.isArray(complaints) ? complaints : [];
  const safeRequests = Array.isArray(availabilityRequests) ? availabilityRequests : [];

  const assignedCount = safeComplaints.filter((c) => String(c?.status ?? "").toUpperCase() === "ASSIGNED").length;
  const inProgressCount = safeComplaints.filter((c) => String(c?.status ?? "").toUpperCase() === "IN_PROGRESS").length;
  const resolutionSubmittedCount = safeComplaints.filter((c) => String(c?.status ?? "").toUpperCase() === "RESOLUTION_SUBMITTED").length;
  const resolvedCount = safeComplaints.filter((c) => String(c?.status ?? "").toUpperCase() === "VERIFIED").length;

  const filtered = safeComplaints.filter((c) => {
    const st = String(c?.status ?? "").toUpperCase();
    if (activeTab === "ASSIGNED") return st === "ASSIGNED";
    if (activeTab === "IN_PROGRESS") return st === "IN_PROGRESS";
    if (activeTab === "RESOLUTION_SUBMITTED") return st === "RESOLUTION_SUBMITTED";
    if (activeTab === "RESOLVED") return st === "VERIFIED";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F5F8F7] p-6 sm:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Header with Required Official Designation & Department details */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E2EBE8] gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-[#147D78] uppercase tracking-wider bg-[#E8F4F1] px-2.5 py-0.5 rounded-full border border-[#147D78]/20">
                {official.designation || "Department Officer"}
              </span>
              <span className="text-xs text-[#607477]">•</span>
              <span className="text-xs font-semibold text-[#12343B]">
                {official.hospitalName || "Victoria District Hospital"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12343B]">
              {official.name}
            </h1>

            <p className="text-xs text-[#607477] mt-0.5">
              Assigned Department:{" "}
              <strong className="text-[#12343B] font-semibold">
                {official.departmentName || "Hygiene and Sanitation"}
              </strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => loadData()}
              className="p-2.5 rounded-xl border border-[#E2EBE8] bg-white text-[#607477] hover:text-[#12343B] shadow-xs"
              title="Refresh complaints"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#607477] hover:text-[#12343B] bg-white border border-[#E2EBE8] px-3.5 py-2.5 rounded-xl transition-colors shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </header>

        {/* Action Notice Banner */}
        {actionNotice && (
          <div className="bg-[#E8F4F1] border border-[#147D78]/30 text-[#12343B] p-4 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-xs">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-[#147D78]" />
              <span>{actionNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              className="text-[#607477] hover:text-[#12343B] text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* View Switcher: Public Grievances vs Private Availability Requests */}
        <div className="flex border-b border-[#E2EBE8] gap-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => setMainView("GRIEVANCES")}
            className={`pb-3 transition-colors flex items-center gap-2 ${
              mainView === "GRIEVANCES"
                ? "text-[#147D78] border-b-2 border-[#147D78]"
                : "text-[#607477] hover:text-[#12343B]"
            }`}
          >
            <span>Public Grievances</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#E8F4F1] text-[#147D78]">
              {complaints.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMainView("AVAILABILITY")}
            className={`pb-3 transition-colors flex items-center gap-2 ${
              mainView === "AVAILABILITY"
                ? "text-[#147D78] border-b-2 border-[#147D78]"
                : "text-[#607477] hover:text-[#12343B]"
            }`}
          >
            <span>Private Availability Requests</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800">
              {availabilityRequests.length}
            </span>
          </button>
        </div>

        {mainView === "GRIEVANCES" ? (
          <>
            {/* 4 Clean Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                onClick={() => setActiveTab("ASSIGNED")}
                className={`p-6 rounded-3xl border transition-all cursor-pointer ${
                  activeTab === "ASSIGNED"
                    ? "bg-white border-[#147D78] shadow-xs"
                    : "bg-white border-[#E2EBE8] hover:border-[#147D78]/40"
                }`}
              >
                <span className="text-xs font-bold text-[#607477] uppercase block">Assigned</span>
                <div className="text-3xl font-extrabold text-[#12343B] mt-1">{assignedCount}</div>
                <span className="text-[11px] text-[#607477]">Awaiting acceptance</span>
              </div>

              <div
                onClick={() => setActiveTab("IN_PROGRESS")}
                className={`p-6 rounded-3xl border transition-all cursor-pointer ${
                  activeTab === "IN_PROGRESS"
                    ? "bg-white border-[#147D78] shadow-xs"
                    : "bg-white border-[#E2EBE8] hover:border-[#147D78]/40"
                }`}
              >
                <span className="text-xs font-bold text-amber-700 uppercase block">In Progress</span>
                <div className="text-3xl font-extrabold text-amber-600 mt-1">{inProgressCount}</div>
                <span className="text-[11px] text-[#607477]">Squad on ground</span>
              </div>

              <div
                onClick={() => setActiveTab("RESOLUTION_SUBMITTED")}
                className={`p-6 rounded-3xl border transition-all cursor-pointer ${
                  activeTab === "RESOLUTION_SUBMITTED"
                    ? "bg-white border-[#147D78] shadow-xs"
                    : "bg-white border-[#E2EBE8] hover:border-[#147D78]/40"
                }`}
              >
                <span className="text-xs font-bold text-blue-700 uppercase block">Under Review</span>
                <div className="text-3xl font-extrabold text-blue-600 mt-1">{resolutionSubmittedCount}</div>
                <span className="text-[11px] text-[#607477]">Supervisor sign-off</span>
              </div>

              <div
                onClick={() => setActiveTab("RESOLVED")}
                className={`p-6 rounded-3xl border transition-all cursor-pointer ${
                  activeTab === "RESOLVED"
                    ? "bg-white border-[#147D78] shadow-xs"
                    : "bg-white border-[#E2EBE8] hover:border-[#147D78]/40"
                }`}
              >
                <span className="text-xs font-bold text-emerald-700 uppercase block">Resolved</span>
                <div className="text-3xl font-extrabold text-emerald-600 mt-1">{resolvedCount}</div>
                <span className="text-[11px] text-[#607477]">Verified & closed</span>
              </div>
            </div>

            {/* Complaints Queue Filtered by Official's Department */}
            <div className="bg-white rounded-3xl border border-[#E2EBE8] shadow-xs overflow-hidden">
              <div className="p-5 border-b border-[#E2EBE8] flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#12343B]">
                    {official.departmentName || "Department"} Complaints Queue ({filtered.length})
                  </h2>
                  <span className="text-[11px] text-[#607477]">
                    Only complaints authorized for {official.departmentName || "your department"} are shown.
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("ALL")}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                      activeTab === "ALL" ? "bg-[#147D78] text-white" : "text-[#607477] hover:bg-[#F5F8F7]"
                    }`}
                  >
                    All
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                {filtered.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#607477]">
                    No grievances currently found for {official.departmentName}.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F5F8F7] text-[#607477] uppercase font-semibold border-b border-[#E2EBE8]">
                      <tr>
                        <th className="py-3 px-5">Complaint ID</th>
                        <th className="py-3 px-5">Summary</th>
                        <th className="py-3 px-5">Location</th>
                        <th className="py-3 px-5">Status</th>
                        <th className="py-3 px-5">Date</th>
                        <th className="py-3 px-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2EBE8]">
                      {filtered.map((c) => (
                        <tr key={c.id} className="hover:bg-[#F5F8F7]/50 transition-colors">
                          <td className="py-3.5 px-5 font-mono font-bold text-[#12343B]">
                            <div>{c.complaintNumber || c.ticketNumber}</div>
                            {c.recurrenceCount && c.recurrenceCount > 1 && (
                              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                ⚡ {c.recurrenceCount} Confirmations
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-5 font-medium text-[#263238] max-w-xs">
                            <div className="truncate">{c.summary}</div>
                            {c.latestObservationAt && (
                              <span className="text-[10px] text-amber-700 block mt-0.5">
                                Latest observation: {formatDateTime(c.latestObservationAt)}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-[#607477]">
                            {c.wardOrLocation}
                          </td>
                          <td className="py-3.5 px-5">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                c.status === "VERIFIED"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : c.status === "IN_PROGRESS"
                                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                                  : c.status === "RESOLUTION_SUBMITTED"
                                  ? "bg-blue-50 text-blue-800 border border-blue-200"
                                  : "bg-sky-50 text-sky-800 border border-sky-200"
                              }`}
                            >
                              {String(c.status ?? "pending").replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-[#607477]">
                            {formatDateTime(c.submittedAt || c.createdAt)}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <Link
                              href={`/official/complaints/${c.complaintNumber || c.ticketNumber || c.id}`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#147D78] hover:underline"
                            >
                              <span>Open</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Private Availability Requests Tab */
          <div className="bg-white rounded-3xl border border-[#E2EBE8] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#E2EBE8] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#12343B]">
                  Private Resource & Medicine Requests ({availabilityRequests.length})
                </h2>
                <span className="text-[11px] text-[#607477]">
                  Confidential citizen availability requests. When restocked, mark Available to trigger SMS alerts.
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              {availabilityRequests.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#607477]">
                  No private availability requests logged for this hospital/department.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5F8F7] text-[#607477] uppercase font-semibold border-b border-[#E2EBE8]">
                    <tr>
                      <th className="py-3 px-5">Request ID</th>
                      <th className="py-3 px-5">Requested Resource</th>
                      <th className="py-3 px-5">Citizen Contact</th>
                      <th className="py-3 px-5">Status</th>
                      <th className="py-3 px-5">Date</th>
                      <th className="py-3 px-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2EBE8]">
                    {availabilityRequests.map((req) => {
                      const reqIdStr = req.requestNumber || req.requestId || req.id;
                      const resNameStr = req.requestedResource || req.resourceName || "Resource";
                      const phoneStr = req.maskedPhone || req.phone || req.verifiedPhoneNumber || "";
                      const isAvail = req.status === "AVAILABLE" || req.status === "Available" || req.status === "NOTIFICATION_SENT" || req.status === "Notification Sent";
                      const isClosed = req.status === "CLOSED" || req.status === "Closed";

                      return (
                        <tr key={req.id} className="hover:bg-[#F5F8F7]/50 transition-colors">
                          <td className="py-3.5 px-5 font-mono font-bold text-[#12343B]">
                            {reqIdStr}
                          </td>
                          <td className="py-3.5 px-5">
                            <strong className="text-[#12343B] font-semibold block">{resNameStr}</strong>
                            <span className="text-[10px] text-[#607477] uppercase">{req.resourceType} • {req.departmentName}</span>
                          </td>
                          <td className="py-3.5 px-5 text-[#263238] font-mono text-[11px]">
                            {phoneStr}
                          </td>
                          <td className="py-3.5 px-5">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                isAvail
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : req.status === "IN_PROGRESS" || req.status === "In Progress"
                                  ? "bg-blue-50 text-blue-800 border border-blue-200"
                                  : "bg-amber-50 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {isAvail ? "Available • SMS Sent" : String(req.status ?? "pending").replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-[#607477]">
                            {formatDateTime(req.createdAt)}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            {!isAvail && !isClosed ? (
                              <button
                                type="button"
                                onClick={() => handleMarkAvailable(reqIdStr, resNameStr)}
                                disabled={updatingReqId === reqIdStr}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#147D78] hover:bg-[#0e5e5a] px-3 py-1.5 rounded-xl transition-all shadow-xs"
                              >
                                <BellRing className="w-3.5 h-3.5" />
                                <span>{updatingReqId === reqIdStr ? "Notifying..." : "Mark Available & Alert"}</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-emerald-700 font-semibold flex items-center justify-end gap-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Notified</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
