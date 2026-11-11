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
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [updatingReqId, setUpdatingReqId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [official, setOfficial] = useState<any>({
    name: "Demo Official",
    designation: "Department Officer",
    departmentName: "Hygiene and Sanitation",
    hospitalName: "Outpatient Department, Ballari",
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
      wardOrLocation: c?.wardOrLocation || c?.location || "Outpatient Department, Ballari - Kiosk #1",
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
      hospitalName: c?.hospitalName || "Outpatient Department, Ballari",
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
      hospitalName: req?.hospitalName || "Outpatient Department, Ballari",
      status,
      createdAt: req?.createdAt || new Date().toISOString(),
      updatedAt: req?.updatedAt || new Date().toISOString(),
      verifiedPhoneNumber: req?.verifiedPhoneNumber || req?.phone || "",
      maskedPhone: req?.maskedPhone || (req?.verifiedPhoneNumber ? `XXXXXX${req.verifiedPhoneNumber.slice(-4)}` : ""),
    };
  };

  const loadData = async (currentOfficial = official, showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentOfficial.departmentName && currentOfficial.designation !== "Hospital Administrator") {
        params.append("department", currentOfficial.departmentName);
        params.append("designation", currentOfficial.designation);
      }

      const notifUrl = currentOfficial.departmentName && currentOfficial.designation !== "Hospital Administrator"
        ? `/api/notifications?department=${encodeURIComponent(currentOfficial.departmentName)}`
        : `/api/notifications`;

      const [res, reqRes, notifRes] = await Promise.all([
        fetch(`/api/complaints?${params.toString()}`, { cache: "no-store" }),
        fetch(`/api/availability-requests?department=${encodeURIComponent(currentOfficial.departmentName || "")}`, { cache: "no-store" }),
        fetch(notifUrl, { cache: "no-store" }),
      ]);
      const [data, reqData, notifData] = await Promise.all([res.json(), reqRes.json(), notifRes.json()]);
      if (data.success && Array.isArray(data.complaints)) {
        setComplaints(data.complaints.map(normalizeComplaint));
      }

      if (reqData.success && Array.isArray(reqData.requests)) {
        setAvailabilityRequests(reqData.requests.map(normalizeAvailabilityRequest));
      }

      if (notifData.success && typeof notifData.count === "number") {
        setNotificationCount(notifData.count);
      }

      if (data.success || reqData.success) setLastUpdatedAt(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleDepartmentChange = (dept: string) => {
    let officerName = official.name;
    let designation = official.designation;
    if (dept.includes("Pharmacy") || dept.includes("Medicine")) {
      officerName = "Kavitha Raman";
      designation = "Chief Pharmacist";
    } else if (dept.includes("Water") || dept.includes("Facilities")) {
      officerName = "Dr. Ananya Sharma";
      designation = "Department Officer";
    } else if (dept.includes("Bed")) {
      officerName = "Dr. Preethi Hegde";
      designation = "Bed Manager & Casualty Officer";
    } else if (dept.includes("Infra")) {
      officerName = "Suresh Nambiar";
      designation = "Civil Works Executive";
    } else if (dept === "All Departments") {
      officerName = "Dr. R. Narayana";
      designation = "Hospital Administrator";
    } else {
      officerName = "Demo Official";
      designation = "Department Officer";
    }

    const updated = {
      ...official,
      name: officerName,
      designation,
      departmentName: dept === "All Departments" ? "" : dept,
      hospitalName: "Outpatient Department, Ballari",
    };
    setOfficial(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("janasuvidha_official", JSON.stringify(updated));
        document.cookie = `official_session=${encodeURIComponent(JSON.stringify(updated))}; path=/; max-age=86400`;
      } catch (e) {}
    }
    loadData(updated, true);
  };

  useEffect(() => {
    let current = official;
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlDept = urlParams.get("department");
      const urlHighlight = urlParams.get("highlight");

      const saved = localStorage.getItem("janasuvidha_official");
      if (saved) {
        try {
          current = JSON.parse(saved);
        } catch (e) {}
      }

      if (urlDept) {
        const d = urlDept.toLowerCase();
        let canonicalDept = "Hospital Services";
        let officerName = current.name || "Department Officer";
        let designation = "Department Officer";

        if (urlDept === "All Departments" || urlDept === "ALL") {
          canonicalDept = "";
          officerName = "Dr. R. Narayana";
          designation = "Hospital Administrator";
        } else if (
          d.includes("water") ||
          d.includes("drink") ||
          d.includes("cooler") ||
          d.includes("plumb") ||
          d.includes("tap") ||
          d.includes("leak") ||
          d.includes("pipe") ||
          d.includes("neeru") ||
          d.includes("paani") ||
          d.includes("pani") ||
          d.includes("tank")
        ) {
          canonicalDept = "Water and Facilities";
          officerName = "Dr. Ananya Sharma";
          designation = "Department Officer";
        } else if (
          d.includes("pharm") ||
          d.includes("med") ||
          d.includes("drug") ||
          d.includes("tablet") ||
          d.includes("dawa") ||
          d.includes("aushadh")
        ) {
          canonicalDept = "Pharmacy and Medicine Availability";
          officerName = "Kavitha Raman";
          designation = "Chief Pharmacist";
        } else if (d.includes("bed") || d.includes("icu") || d.includes("admiss") || d.includes("stretcher")) {
          canonicalDept = "Bed Management";
          officerName = "Dr. Preethi Hegde";
          designation = "Bed Manager & Casualty Officer";
        } else if (d.includes("infra") || d.includes("electric") || d.includes("light") || d.includes("fan") || d.includes("lift")) {
          canonicalDept = "Infrastructure Maintenance";
          officerName = "Suresh Nambiar";
          designation = "Civil Works Executive";
        } else if (
          d.includes("hygiene") ||
          d.includes("sanitat") ||
          d.includes("clean") ||
          d.includes("toilet") ||
          d.includes("washroom")
        ) {
          canonicalDept = "Hygiene and Sanitation";
          officerName = "Demo Official";
          designation = "Department Officer";
        }

        current = {
          ...current,
          name: officerName,
          designation,
          departmentName: canonicalDept,
          hospitalName: "Outpatient Department, Ballari",
        };
        try {
          localStorage.setItem("janasuvidha_official", JSON.stringify(current));
          document.cookie = `official_session=${encodeURIComponent(JSON.stringify(current))}; path=/; max-age=86400`;
        } catch (e) {}
      }

      setOfficial(current);

      if (urlHighlight) {
        setHighlightId(urlHighlight);
        setActionNotice(`Redirected to ${current.departmentName || "Department Portal"}: Dispatched ticket ${urlHighlight} is highlighted below.`);
      }
    }

    void loadData(current, true);

    let polling = false;
    const refreshInBackground = async () => {
      if (polling || document.visibilityState !== "visible") return;
      polling = true;
      try {
        await loadData(current, false);
      } finally {
        polling = false;
      }
    };
    const interval = window.setInterval(() => void refreshInBackground(), 3000);
    const refreshOnFocus = () => void refreshInBackground();
    window.addEventListener("focus", refreshOnFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshOnFocus);
    };
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
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] font-bold text-[#147D78] uppercase tracking-wider bg-[#E8F4F1] px-2.5 py-0.5 rounded-full border border-[#147D78]/20">
                {official.designation || "Department Officer"}
              </span>
              <span className="text-xs text-[#607477]">•</span>
              <span className="text-xs font-semibold text-[#12343B]">
                {official.hospitalName || "Outpatient Department, Ballari"}
              </span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                <BellRing className="w-3 h-3 text-amber-700" />
                <span>{notificationCount} Dispatched Alert(s)</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12343B]">
              {official.name}
            </h1>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-xs text-[#607477]">Switch Department:</span>
              <select
                value={official.departmentName || "All Departments"}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="text-xs font-bold text-[#12343B] bg-white border border-[#E2EBE8] rounded-xl px-2.5 py-1 shadow-xs cursor-pointer focus:outline-none focus:border-[#147D78]"
              >
                <option value="Hygiene and Sanitation">Hygiene and Sanitation</option>
                <option value="Water and Facilities">Water and Facilities</option>
                <option value="Pharmacy and Medicine Availability">Pharmacy and Medicine Availability</option>
                <option value="Bed Management">Bed Management</option>
                <option value="Infrastructure Maintenance">Infrastructure Maintenance</option>
                <option value="Hospital Services">Hospital Services</option>
                <option value="All Departments">All Departments (Executive View)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right" aria-live="polite">
              <p className="text-[11px] font-semibold text-emerald-700">Live updates every 3 seconds</p>
              {lastUpdatedAt && (
                <p className="text-[10px] text-[#607477]">
                  Updated {lastUpdatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => loadData()}
              className="p-2.5 rounded-xl border border-[#E2EBE8] bg-white text-[#607477] hover:text-[#12343B] shadow-xs cursor-pointer"
              title="Refresh complaints"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#607477] hover:text-[#12343B] bg-white border border-[#E2EBE8] px-3.5 py-2.5 rounded-xl transition-colors shadow-xs cursor-pointer"
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
                      {filtered.map((c) => {
                        const isMatch = Boolean(highlightId && (c.complaintNumber === highlightId || c.ticketNumber === highlightId || c.id === highlightId));
                        return (
                          <tr
                            key={c.id}
                            className={`transition-colors ${
                              isMatch
                                ? "bg-emerald-50/80 border-l-4 border-l-[#147D78] shadow-xs"
                                : "hover:bg-[#F5F8F7]/50"
                            }`}
                          >
                            <td className="py-3.5 px-5 font-mono font-bold text-[#12343B]">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{c.complaintNumber || c.ticketNumber}</span>
                                {isMatch && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#147D78] text-white">
                                    ★ DIRECTED
                                  </span>
                                )}
                                {c.isMedicineComplaint && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                    💊 Medicine
                                  </span>
                                )}
                              </div>
                              {c.medicineName && (
                                <div className="text-[10px] text-blue-800 font-sans font-semibold mt-0.5">
                                  Ref: {c.medicineName}
                                </div>
                              )}
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
                        );
                      })}
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

                      const isReqMatch = Boolean(highlightId && (reqIdStr === highlightId || req.id === highlightId));

                      return (
                        <tr
                          key={req.id}
                          className={`transition-colors ${
                            isReqMatch
                              ? "bg-emerald-50/80 border-l-4 border-l-[#147D78] shadow-xs"
                              : "hover:bg-[#F5F8F7]/50"
                          }`}
                        >
                          <td className="py-3.5 px-5 font-mono font-bold text-[#12343B]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>{reqIdStr}</span>
                              {isReqMatch && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#147D78] text-white">
                                  ★ DIRECTED
                                </span>
                              )}
                            </div>
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
