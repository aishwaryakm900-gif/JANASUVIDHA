"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Send,
  MapPin,
  RefreshCw,
  X,
  AlertTriangle,
  Receipt,
  Printer,
  Users,
  Flame,
  History,
  Pill,
  Phone,
  Building2,
} from "lucide-react";
import { ComplaintItem } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { ComplaintReceiptCard } from "@/components/ComplaintReceiptCard";

export default function OfficialComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [complaint, setComplaint] = useState<ComplaintItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessError, setAccessError] = useState("");
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const [official, setOfficial] = useState<any>({
    name: "Demo Official",
    designation: "Department Officer",
    departmentName: "Hygiene and Sanitation",
  });

  // Form states for resolution
  const [actionNotes, setActionNotes] = useState("");
  const [beforePhotoUrl, setBeforePhotoUrl] = useState("");
  const [afterPhotoUrl, setAfterPhotoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const normalizeComplaintData = (c: any): ComplaintItem => {
    const isMed = Boolean(
      c?.isMedicineComplaint ||
      c?.medicineName ||
      c?.category === "Pharmacy and Medicine Availability" ||
      c?.departmentName === "Pharmacy and Medicine Availability"
    );

    const citizenPhone = c?.citizenPhone || c?.phone || c?.verifiedPhoneNumber || "";
    const maskedCitizenPhone =
      c?.maskedCitizenPhone ||
      (citizenPhone ? `XXXXXX${citizenPhone.slice(-4)}` : undefined);

    const medicineName =
      c?.medicineName ||
      c?.requestedResource ||
      c?.resourceName ||
      (isMed ? (c?.summary?.replace(/^Medicine Unavailable:\s*/i, "") || "Prescribed Medicine") : undefined);

    const originalTranscript =
      c?.originalTranscript ||
      c?.transcript ||
      c?.receipt?.complaintText ||
      c?.summary ||
      (isMed && medicineName ? `Prescribed medicine "${medicineName}" unavailable` : "Hospital grievance reported");

    const englishTranslation =
      c?.englishTranslation ||
      c?.translatedText ||
      c?.summary ||
      originalTranscript;

    const summary =
      isMed && medicineName
        ? `Medicine Unavailable: ${medicineName}`
        : (c?.summary && c?.summary !== "Hospital grievance reported"
            ? c.summary
            : (c?.receipt?.complaintText || englishTranslation || "Hospital Grievance"));

    const departmentName =
      c?.departmentName ||
      c?.department ||
      c?.receipt?.forwardedTo ||
      (isMed ? "Pharmacy and Medicine Availability" : "Hospital Services");

    const category =
      c?.category ||
      c?.receipt?.category ||
      (isMed ? "Pharmacy and Medicine Availability" : "Hospital Services");

    const assignedOfficialName =
      c?.assignedOfficialName ||
      c?.receipt?.responsibleAuthority?.split(" (")[0] ||
      (departmentName.includes("Pharmacy")
        ? "Kavitha Raman"
        : departmentName.includes("Water")
        ? "Rajesh Verma"
        : departmentName.includes("Bed")
        ? "Dr. Preethi Hegde"
        : departmentName.includes("Infra")
        ? "Suresh Nambiar"
        : "Demo Official");

    const assignedOfficialDesignation =
      c?.assignedOfficialDesignation ||
      (c?.receipt?.responsibleAuthority?.includes("(")
        ? c.receipt.responsibleAuthority.split("(")[1].replace(")", "")
        : undefined) ||
      (departmentName.includes("Pharmacy")
        ? "Chief Pharmacist"
        : departmentName.includes("Water")
        ? "Sanitation & Facilities Lead"
        : departmentName.includes("Bed")
        ? "Bed Manager & Casualty Officer"
        : departmentName.includes("Infra")
        ? "Civil Works Executive"
        : "Department Officer");

    return {
      ...c,
      id: c?.id || `comp-${ticketId}`,
      complaintNumber: c?.complaintNumber || c?.ticketNumber || ticketId,
      ticketNumber: c?.ticketNumber || c?.complaintNumber || ticketId,
      status: c?.status || "ASSIGNED",
      priority: c?.priority || (isMed ? "High" : "Medium"),
      summary,
      originalTranscript,
      englishTranslation,
      medicineName,
      citizenPhone,
      maskedCitizenPhone,
      isMedicineComplaint: isMed,
      departmentName,
      category,
      assignedOfficialName,
      assignedOfficialDesignation,
      wardOrLocation: c?.wardOrLocation || c?.location || c?.receipt?.location || "Outpatient Department, Ballari - Kiosk #1",
      originalLanguage: c?.originalLanguage || c?.receipt?.originalLanguage || "English",
      receipt: c?.receipt || {
        complaintNumber: c?.complaintNumber || c?.ticketNumber || ticketId,
        complaintText: summary,
        originalLanguage: c?.originalLanguage || "English",
        hospitalName: c?.hospitalName || "Outpatient Department, Ballari",
        location: c?.wardOrLocation || "Outpatient Department, Ballari - Kiosk #1",
        submissionDate: new Date(c?.submittedAt || c?.createdAt || Date.now()).toLocaleDateString("en-IN"),
        submissionTime: new Date(c?.submittedAt || c?.createdAt || Date.now()).toLocaleTimeString("en-IN"),
        timeZone: "Asia/Kolkata (IST, UTC+05:30)",
        category,
        forwardedTo: departmentName,
        responsibleAuthority: `${assignedOfficialName} (${assignedOfficialDesignation})`,
        status: c?.status || "Submitted",
      },
    };
  };

  const fetchComplaint = async () => {
    setLoading(true);
    setAccessDenied(false);
    try {
      const res = await fetch(`/api/complaints/${ticketId}`);
      if (res.status === 403) {
        const data = await res.json();
        setAccessDenied(true);
        setAccessError(data.error || "Access Denied: You cannot view complaints from another department.");
        return;
      }
      const data = await res.json();
      if (data.success && data.complaint) {
        setComplaint(normalizeComplaintData(data.complaint));
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("janasuvidha_official");
      if (saved) {
        try {
          setOfficial(JSON.parse(saved));
        } catch (e) {}
      }
    }
    fetchComplaint();
  }, [ticketId]);

  // Step 1: Accept Complaint & Mark In Progress
  const handleMarkInProgress = async () => {
    setSubmitting(true);
    try {
      const isMed = complaint?.isMedicineComplaint || complaint?.medicineName;
      const notes = isMed
        ? `${official.name || "Chief Pharmacist"} accepted medicine request. Initiated hospital pharmacy stock verification.`
        : `${official.name} (${official.designation}) accepted task and dispatched maintenance team.`;

      const res = await fetch(`/api/complaints/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "IN_PROGRESS",
          actorName: official.name || "Department Officer",
          actorRole: "OFFICIAL",
          notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setComplaint(normalizeComplaintData(data.complaint));
        setNotice(isMed ? "Medicine request accepted. Stock procurement in progress." : "Complaint accepted and marked as In Progress.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2 (Medicine): Mark Medicine Available & Dispatch SMS
  const handleMarkMedicineAvailable = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const restockNote =
        actionNotes.trim() ||
        `Fresh stock of "${complaint?.medicineName || 'prescribed medicine'}" received at ${complaint?.hospitalName || 'Outpatient Department, Ballari'} Pharmacy Counter. Available for collection.`;

      const res = await fetch(`/api/complaints/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "VERIFIED",
          actorName: official.name || "Chief Pharmacist",
          actorRole: "OFFICIAL",
          notes: restockNote,
        }),
      });
      const data = await res.json();
      if (data.success && data.complaint) {
        setComplaint(normalizeComplaintData(data.complaint));
        setNotice(
          `✓ Medicine marked AVAILABLE! SMS alert successfully dispatched to ${complaint?.citizenPhone || complaint?.maskedCitizenPhone || "citizen"}.`
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Submit Resolution with Before & After photo evidence
  const handleSubmitResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionNotes.trim()) {
      alert("Please provide resolution action description notes.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/complaints/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "RESOLUTION_SUBMITTED",
          actorName: official.name,
          actorRole: "OFFICIAL",
          notes: actionNotes,
          beforeUrl: beforePhotoUrl,
          afterUrl: afterPhotoUrl,
        }),
      });
      const data = await res.json();
      if (data.success && data.complaint) {
        setComplaint(normalizeComplaintData(data.complaint));
        setNotice("Resolution and Before/After photos submitted for supervisor verification.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // Supervisor Approval / Rejection
  const handleSupervisorApproval = async (approved: boolean) => {
    setSubmitting(true);
    try {
      const newStatus = approved ? "VERIFIED" : "REOPENED";
      const notes = approved
        ? `Inspection verified by Supervisor ${official.name}. Resolution approved and signed off.`
        : `Resolution rejected by Supervisor ${official.name}. Insufficient evidence or ongoing issue.`;

      const res = await fetch(`/api/complaints/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          actorName: official.name,
          actorRole: "SUPERVISOR",
          notes,
        }),
      });
      const data = await res.json();
      if (data.success && data.complaint) {
        setComplaint(normalizeComplaintData(data.complaint));
        setNotice(approved ? "Resolution verified and closed!" : "Ticket reopened for additional action.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F8F7] flex items-center justify-center p-6 text-xs text-[#607477]">
        <RefreshCw className="w-5 h-5 animate-spin text-[#147D78] mr-2" />
        <span>Loading complaint...</span>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-[#F5F8F7] p-12 flex flex-col items-center justify-center space-y-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#12343B]">Department Access Denied</h2>
        <p className="text-xs text-[#607477] max-w-md">
          {accessError}
        </p>
        <Link
          href="/official/dashboard"
          className="text-xs text-white bg-[#147D78] px-4 py-2.5 rounded-xl font-bold transition-colors"
        >
          Return to Your Department Dashboard
        </Link>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen bg-[#F5F8F7] p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#12343B]">Complaint Not Found</h2>
        <Link href="/official/dashboard" className="text-xs text-[#147D78] underline font-bold">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F8F7] p-6 sm:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href="/official/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#147D78] hover:text-[#0e5e5a] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          {complaint.receipt && (
            <button
              type="button"
              onClick={() => setShowReceiptModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#147D78] bg-[#E8F4F1] hover:bg-[#d5ece7] px-3.5 py-1.5 rounded-full border border-[#147D78]/20 transition-colors"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>View Citizen Receipt</span>
            </button>
          )}
        </div>

        {notice && (
          <div className="bg-[#E8F4F1] border border-[#147D78]/20 text-[#12343B] p-4 rounded-2xl flex items-center justify-between text-xs font-semibold">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-[#607477] hover:text-[#12343B]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* COMPLAINT DETAILS */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EBE8] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2EBE8] gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-mono text-xs font-bold text-[#147D78] bg-[#E8F4F1] px-2.5 py-1 rounded-md">
                  {complaint.complaintNumber || complaint.ticketNumber}
                </span>
                {(complaint.isMedicineComplaint || complaint.medicineName) ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    <Pill className="w-3.5 h-3.5" />
                    <span>Medicine Availability Request</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Public Facility Grievance</span>
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                  {complaint.priority || "Medium"} Priority
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-[#12343B]">
                {complaint.summary}
              </h1>
            </div>

            <div className="sm:text-right">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#E8F4F1] text-[#147D78] border border-[#147D78]/20">
                {String(complaint.status ?? "pending").replace(/_/g, " ")}
              </span>
              <span className="text-[11px] text-[#607477] block mt-1">
                {formatDateTime(complaint.submittedAt || complaint.createdAt)}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-[#F5F8F7] rounded-xl border border-[#E2EBE8]">
              <span className="text-[#607477] block text-[11px]">Original Language</span>
              <strong className="text-[#12343B] uppercase">{complaint.originalLanguage}</strong>
            </div>
            <div className="p-3 bg-[#F5F8F7] rounded-xl border border-[#E2EBE8]">
              <span className="text-[#607477] block text-[11px]">Category</span>
              <strong className="text-[#12343B]">{complaint.category}</strong>
            </div>
            <div className="p-3 bg-[#F5F8F7] rounded-xl border border-[#E2EBE8]">
              <span className="text-[#607477] block text-[11px]">Department</span>
              <strong className="text-[#12343B]">{complaint.departmentName || "General Services"}</strong>
            </div>
            <div className="p-3 bg-[#F5F8F7] rounded-xl border border-[#E2EBE8]">
              <span className="text-[#607477] block text-[11px]">Location</span>
              <strong className="text-[#12343B]">{complaint.wardOrLocation}</strong>
            </div>
          </div>

          {/* Dedicated Medicine Shortage Card */}
          {(complaint.isMedicineComplaint || complaint.medicineName) && (
            <div className="p-5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                      Prescribed Medicine Shortage Record
                    </span>
                    <h3 className="text-sm font-extrabold text-[#12343B]">
                      {complaint.medicineName || complaint.summary}
                    </h3>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300 w-fit">
                  Confidential • Internal Only
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div className="p-3 bg-white rounded-xl border border-blue-100">
                  <span className="text-[#607477] block text-[10px] uppercase font-semibold">
                    Prescribed Medicine Name
                  </span>
                  <strong className="text-[#12343B] text-sm">
                    {complaint.medicineName || "Prescribed Medicine"}
                  </strong>
                </div>

                <div className="p-3 bg-white rounded-xl border border-blue-100">
                  <span className="text-[#607477] block text-[10px] uppercase font-semibold">
                    Citizen Mobile Number
                  </span>
                  <strong className="text-[#12343B] font-mono text-sm">
                    {complaint.citizenPhone || complaint.maskedCitizenPhone || "N/A"}
                  </strong>
                  <span className="text-[10px] text-emerald-700 block mt-0.5 font-medium">
                    ✓ SMS Notification Enabled
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-blue-100">
                  <span className="text-[#607477] block text-[10px] uppercase font-semibold">
                    Assigned Pharmacist / Authority
                  </span>
                  <strong className="text-[#12343B]">
                    {complaint.assignedOfficialName || "Chief Pharmacist"}
                  </strong>
                  <span className="text-[10px] text-[#607477] block mt-0.5">
                    {complaint.assignedOfficialDesignation || "Medical Officer"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Spoken vs Translated Complaint */}
          <div className="space-y-3">
            <div className="p-4 bg-[#F5F8F7] rounded-2xl border border-[#E2EBE8] space-y-1 text-xs">
              <span className="text-[#607477] font-semibold text-[11px] uppercase">
                Citizen Spoken Grievance ({complaint.originalLanguage || "Native Voice"}):
              </span>
              <p className="text-[#263238] italic font-medium leading-relaxed">
                "{complaint.originalTranscript || complaint.summary}"
              </p>
            </div>

            {(complaint.englishTranslation || (complaint.originalLanguage && complaint.originalLanguage.toLowerCase() !== "english" && complaint.originalLanguage.toLowerCase() !== "en")) && (
              <div className="p-4 bg-[#E8F4F1] rounded-2xl border border-[#147D78]/20 space-y-1 text-xs">
                <span className="text-[#147D78] font-semibold text-[11px] uppercase">
                  Verified English Translation:
                </span>
                <p className="text-[#12343B] font-bold leading-relaxed">
                  "{complaint.englishTranslation || complaint.translatedText || complaint.summary}"
                </p>
              </div>
            )}
          </div>

          {/* Photographic Evidence on Record (Public Facility Grievances) */}
          {!complaint.isMedicineComplaint && complaint.evidence && complaint.evidence.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#12343B]">
                Photographic Evidence on Record
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {complaint.evidence.map((ev) => (
                  <div key={ev.id} className="rounded-2xl border border-[#E2EBE8] overflow-hidden bg-[#F5F8F7]">
                    <div className="relative h-44 w-full">
                      <img src={ev.fileUrl} alt={ev.type} className="w-full h-full object-cover" />
                      <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded bg-black/70 text-white">
                        {ev.type}
                      </span>
                    </div>
                    <div className="p-3 text-[11px] text-[#607477]">
                      {ev.caption} • {formatDateTime(ev.uploadedAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Citizen Observations & Repeat Confirmations (Public Facility Only) */}
          {!complaint.isMedicineComplaint &&
            ((complaint.recurrenceCount && complaint.recurrenceCount > 1) ||
              (complaint.observations && complaint.observations.length > 0)) && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#12343B] flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#147D78]" />
                  <span>Citizen Confirmations & Facility Feedback</span>
                </h3>
                <span className="text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-700" />
                  <span>{complaint.recurrenceCount || (complaint.observations ? complaint.observations.length + 1 : 1)} Total Citizens Reported</span>
                </span>
              </div>

              {/* Summary highlight */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-[#263238] space-y-1">
                <p className="font-semibold text-amber-900">
                  ⚠️ High-Priority Recurring Facility Grievance
                </p>
                <p className="text-[#607477]">
                  Multiple citizens have verified that this issue remains unresolved on the ground.
                  {complaint.observationSummary && ` Latest feedback: "${complaint.observationSummary}"`}
                </p>
              </div>

              {/* Timeline of observations */}
              {complaint.observations && complaint.observations.length > 0 && (
                <div className="rounded-2xl border border-[#E2EBE8] overflow-hidden bg-white">
                  <div className="p-3 bg-[#F5F8F7] border-b border-[#E2EBE8] text-[11px] font-bold text-[#607477] uppercase flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    <span>Logged Citizen Ground Observations</span>
                  </div>
                  <div className="divide-y divide-[#E2EBE8]">
                    {complaint.observations.map((obs, idx) => (
                      <div key={obs.id || idx} className="p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#F5F8F7]/40 transition-colors">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                obs.observationType === "CLEAN_REPORTED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {obs.observationType === "CLEAN_REPORTED"
                                ? "✓ Reported Clean / Resolved"
                                : "⚠️ Confirmed Still Unclean / Issue Persists"}
                            </span>
                            {(obs.reportedDuration || obs.durationSinceLastCleaning) && (
                              <span className="text-[11px] text-[#607477] bg-[#F5F8F7] px-2 py-0.5 rounded border border-[#E2EBE8]">
                                Duration: <strong>{obs.reportedDuration || obs.durationSinceLastCleaning}</strong>
                              </span>
                            )}
                          </div>
                          {(obs.transcript || obs.originalTranscript) && (
                            <p className="text-[11px] text-[#263238] italic mt-1">
                              "{obs.transcript || obs.originalTranscript}"
                            </p>
                          )}
                        </div>
                        <span className="text-[11px] text-[#607477] shrink-0 font-mono">
                          {formatDateTime(obs.observedAt || obs.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* RESOLUTION WORKFLOW */}
          <div className="pt-6 border-t border-[#E2EBE8] space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#12343B]">
              Resolution Process
            </h2>

            {/* A. MEDICINE COMPLAINT WORKFLOW */}
            {(complaint.isMedicineComplaint || complaint.medicineName) ? (
              <div className="space-y-4">
                {/* Step 1: Accept Request */}
                {(complaint.status === "ASSIGNED" ||
                  complaint.status === "PENDING" ||
                  complaint.status === "REOPENED") && (
                  <div className="p-5 rounded-2xl bg-[#F5F8F7] border border-[#E2EBE8] space-y-3">
                    <p className="text-xs text-[#263238]">
                      Step 1: Accept this medicine availability request to confirm receipt by the hospital pharmacy.
                    </p>
                    <button
                      type="button"
                      onClick={handleMarkInProgress}
                      disabled={submitting}
                      className="bg-[#147D78] hover:bg-[#0e5e5a] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors"
                    >
                      {submitting ? "Updating..." : "Accept Request & Verify Inventory"}
                    </button>
                  </div>
                )}

                {/* Step 2: Mark Medicine Available & Trigger Citizen SMS Alert */}
                {complaint.status === "IN_PROGRESS" && (
                  <form
                    onSubmit={handleMarkMedicineAvailable}
                    className="p-6 rounded-2xl bg-[#E8F4F1] border border-[#147D78]/30 space-y-4"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-[#12343B] uppercase">
                        Confirm Stock Restocked & Dispatch Citizen SMS Alert
                      </h4>
                      <p className="text-xs text-[#607477] mt-1">
                        When fresh stock of <strong>{complaint.medicineName}</strong> arrives at the pharmacy counter, submit the restock notification below to trigger an automated SMS alert to <strong>{complaint.citizenPhone || complaint.maskedCitizenPhone}</strong>.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#607477] uppercase block">
                        Restocking Notes / Pharmacy Counter
                      </label>
                      <textarea
                        rows={2}
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        placeholder={`Fresh stock of ${complaint.medicineName || 'medicine'} received at Outpatient Department, Ballari Pharmacy Counter #2. Available for collection.`}
                        className="w-full text-xs p-3 rounded-xl border border-[#E2EBE8] bg-white focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-[#147D78] hover:bg-[#0e5e5a] text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submitting ? "Dispatching SMS..." : "Mark Medicine Available & Send SMS Alert"}</span>
                    </button>
                  </form>
                )}

                {/* Resolved / Available confirmation */}
                {(complaint.status === "VERIFIED" || complaint.status === "RESOLUTION_SUBMITTED" || (complaint.status as string) === "AVAILABLE") && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>
                      ✓ Prescribed medicine "{complaint.medicineName || complaint.summary}" is marked AVAILABLE in hospital inventory. Citizen SMS alert has been dispatched to {complaint.citizenPhone || complaint.maskedCitizenPhone}.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* B. PUBLIC FACILITY COMPLAINT WORKFLOW */
              <div className="space-y-4">
                {/* Step 1: Accept & Mark In Progress */}
                {(complaint.status === "ASSIGNED" ||
                  complaint.status === "PENDING" ||
                  complaint.status === "REOPENED") && (
                  <div className="p-5 rounded-2xl bg-[#F5F8F7] border border-[#E2EBE8] space-y-3">
                    <p className="text-xs text-[#263238]">
                      Step 1: Accept this complaint to notify the hospital that your department is taking action.
                    </p>
                    <button
                      type="button"
                      onClick={handleMarkInProgress}
                      disabled={submitting}
                      className="bg-[#147D78] hover:bg-[#0e5e5a] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors"
                    >
                      {submitting ? "Updating..." : "Accept & Mark In Progress"}
                    </button>
                  </div>
                )}

                {/* Step 2: Upload Before/After Photos & Resolution Notes */}
                {complaint.status === "IN_PROGRESS" && (
                  <form
                    onSubmit={handleSubmitResolution}
                    className="p-6 rounded-2xl bg-[#F5F8F7] border border-[#E2EBE8] space-y-4"
                  >
                    <p className="text-xs font-bold text-[#12343B]">
                      Step 2: Add resolution notes and Before / After photographic proof
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#607477] uppercase block">
                          BEFORE Photo URL
                        </label>
                        <input
                          type="url"
                          value={beforePhotoUrl}
                          onChange={(e) => setBeforePhotoUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full text-xs p-2.5 rounded-xl border border-[#E2EBE8] bg-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#607477] uppercase block">
                          AFTER Photo URL
                        </label>
                        <input
                          type="url"
                          value={afterPhotoUrl}
                          onChange={(e) => setAfterPhotoUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full text-xs p-2.5 rounded-xl border border-[#E2EBE8] bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#607477] uppercase block">
                        Action Description
                      </label>
                      <textarea
                        rows={2}
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        placeholder="Describe how the problem was resolved..."
                        className="w-full text-xs p-3 rounded-xl border border-[#E2EBE8] bg-white focus:outline-none"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-[#147D78] hover:bg-[#0e5e5a] text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-colors"
                    >
                      Submit for Supervisor Verification
                    </button>
                  </form>
                )}

                {/* Step 3: Supervisor Sign-off */}
                {complaint.status === "RESOLUTION_SUBMITTED" && (
                  <div className="p-6 rounded-2xl bg-[#E8F4F1] border border-[#147D78]/20 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-[#12343B] uppercase">
                        Supervisor Verification Gate
                      </h4>
                      <p className="text-xs text-[#607477] mt-0.5">
                        Review ground truth and photo evidence before approving resolution.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleSupervisorApproval(true)}
                        disabled={submitting}
                        className="bg-[#147D78] hover:bg-[#0e5e5a] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors"
                      >
                        Approve & Verify Resolution
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSupervisorApproval(false)}
                        disabled={submitting}
                        className="bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold px-5 py-2.5 rounded-xl transition-colors"
                      >
                        Reject & Reopen
                      </button>
                    </div>
                  </div>
                )}

                {complaint.status === "VERIFIED" && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
                    ✓ This resolution has been verified and closed by the supervisor.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CITIZEN RECEIPT MODAL */}
      {showReceiptModal && complaint.receipt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl relative animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-[#E2EBE8]">
              <span className="text-xs font-bold text-[#12343B]">Citizen Receipt</span>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="text-[#607477] hover:text-[#12343B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-center">
              <ComplaintReceiptCard receipt={complaint.receipt} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
