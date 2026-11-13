import fs from "fs";
import path from "path";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ComplaintItem, ComplaintObservation, NotificationItem, OfficialUser, PrivateAvailabilityRequest } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "janasuvidha-db.json");

export interface SupabaseSyncReport {
  success: boolean;
  configured: boolean;
  hospitalsSynced: number;
  departmentsSynced: number;
  officialsSynced: number;
  complaintsSynced: number;
  privateRequestsSynced: number;
  observationsSynced: number;
  notificationsSynced: number;
  submissionsSynced: number;
  counterSynced: number;
  errors: string[];
}

export class SupabaseSyncService {
  /**
   * Check if Supabase server client is ready
   */
  static isConfigured(): boolean {
    return Boolean(getSupabaseServerClient());
  }

  /**
   * Reads full database JSON file
   */
  private static readLocalDb(): any {
    if (!fs.existsSync(DB_FILE)) return null;
    try {
      const raw = fs.readFileSync(DB_FILE, "utf8");
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Synchronize all data from local repository to Supabase
   */
  static async syncAllDataToSupabase(): Promise<SupabaseSyncReport> {
    const report: SupabaseSyncReport = {
      success: false,
      configured: false,
      hospitalsSynced: 0,
      departmentsSynced: 0,
      officialsSynced: 0,
      complaintsSynced: 0,
      privateRequestsSynced: 0,
      observationsSynced: 0,
      notificationsSynced: 0,
      submissionsSynced: 0,
      counterSynced: 0,
      errors: [],
    };

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      report.errors.push("Supabase credentials not configured in environment (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or ANON_KEY required).");
      return report;
    }

    report.configured = true;
    const db = this.readLocalDb();
    if (!db) {
      report.errors.push("Local database file data/janasuvidha-db.json not found.");
      return report;
    }

    // 1. Sync Hospitals
    try {
      if (Array.isArray(db.hospitals) && db.hospitals.length > 0) {
        const rows = db.hospitals.map((h: any) => ({
          id: h.id || "hosp-001",
          code: h.code || "OPD-BAL-01",
          name: h.name || "Outpatient Department, Ballari",
          district: h.district || "Ballari",
          state: h.state || "Karnataka",
          pincode: h.pincode || "560002",
          type: h.type || "Tertiary Government Teaching Hospital",
        }));
        const { error } = await supabase.from("hospitals").upsert(rows, { onConflict: "id" });
        if (error) report.errors.push(`Hospitals sync: ${error.message}`);
        else report.hospitalsSynced = rows.length;
      }
    } catch (e: any) {
      report.errors.push(`Hospitals exception: ${e.message}`);
    }

    // 2. Sync Departments
    try {
      if (Array.isArray(db.departments) && db.departments.length > 0) {
        const rows = db.departments.map((d: any) => ({
          id: d.id,
          code: d.code || d.id?.replace("dept-", "").toUpperCase() || "GEN",
          name: d.name,
          category: d.category || d.name,
          description: d.description || `Hospital department for ${d.name}`,
          hospital_id: d.hospitalId || "hosp-001",
          official_name: d.headName || d.officialName || "Department Officer",
          official_designation: d.officialDesignation || "Department Officer",
          official_email: d.officialEmail || `dept.${d.id}@janasuvidha.gov.in`,
          sla_hours: d.avgResolutionHours || d.slaHours || 4,
        }));
        const { error } = await supabase.from("departments").upsert(rows, { onConflict: "id" });
        if (error) report.errors.push(`Departments sync: ${error.message}`);
        else report.departmentsSynced = rows.length;
      }
    } catch (e: any) {
      report.errors.push(`Departments exception: ${e.message}`);
    }

    // 3. Sync Officials
    try {
      if (Array.isArray(db.officials) && db.officials.length > 0) {
        const rows = db.officials.map((o: any) => ({
          id: o.id,
          name: o.name,
          official_id: o.officialId || o.id,
          email: o.email,
          password_hash: o.passwordHash || o.password || "demo_pass_hash",
          department_id: o.departmentId || "dept-services",
          department_name: o.departmentName || "Hospital Services",
          designation: o.designation || "Department Officer",
          hospital_id: o.hospitalId || "hosp-001",
          hospital_name: o.hospitalName || "Outpatient Department, Ballari",
          role: o.role || "OFFICIAL",
          phone: o.phone || "+91 80 2670 1150",
        }));
        const { error } = await supabase.from("officials").upsert(rows, { onConflict: "id" });
        if (error) report.errors.push(`Officials sync: ${error.message}`);
        else report.officialsSynced = rows.length;
      }
    } catch (e: any) {
      report.errors.push(`Officials exception: ${e.message}`);
    }

    // 4. Sync Complaints (Each and every complaint with canonical attributes)
    try {
      if (Array.isArray(db.complaints) && db.complaints.length > 0) {
        const rows = db.complaints.map((c: ComplaintItem) => ({
          id: c.id,
          complaint_number: c.complaintNumber || c.ticketNumber || `JAN-2026-${String(Date.now()).slice(-6)}`,
          ticket_number: c.ticketNumber || c.complaintNumber,
          hospital_id: c.hospitalId || "hosp-001",
          hospital_name: c.hospitalName || "Outpatient Department, Ballari",
          department_id: c.departmentId || null,
          department_name: c.departmentName || (c.category as string) || "Hospital Services",
          category: c.category || "Hospital Services",
          visibility: c.visibility || (c.isMedicineComplaint ? "PRIVATE" : "PUBLIC"),
          source: c.source || "VOICE_KIOSK",
          original_language: c.originalLanguage || "Kannada",
          language_code: c.languageCode || "kn",
          original_transcript: c.originalTranscript || c.summary || "",
          english_translation: c.englishTranslation || c.originalTranscript || "",
          translated_text: c.translatedText || c.englishTranslation || "",
          summary: c.summary || "Hospital grievance reported",
          ward_or_location: c.wardOrLocation || "Outpatient Department, Ballari - Kiosk #1",
          floor_or_block: c.floorOrBlock || "Ground Floor",
          status: c.status || "ASSIGNED",
          priority: c.priority || "Medium",
          citizen_name: c.citizenName || null,
          citizen_phone: c.citizenPhone || null,
          masked_citizen_phone: c.maskedCitizenPhone || (c.citizenPhone ? `XXXXXX${c.citizenPhone.slice(-4)}` : null),
          medicine_name: c.medicineName || null,
          is_medicine_complaint: Boolean(c.isMedicineComplaint),
          assigned_official_id: c.assignedOfficialId || null,
          assigned_official_name: c.assignedOfficialName || null,
          assigned_official_designation: c.assignedOfficialDesignation || null,
          resolution_notes: c.resolutionNotes || null,
          resolved_at: c.resolvedAt || null,
          verified_at: c.verifiedAt || null,
          recurrence_count: c.recurrenceCount || 1,
          idempotency_key: c.idempotencyKey || null,
          delivery_tracking: c.deliveryTracking || {
            adminPortal: { status: "DELIVERED", updatedAt: new Date().toISOString() },
            departmentPortal: { status: "DELIVERED", updatedAt: new Date().toISOString() },
            externalGovPortal: { status: "NOT_CONFIGURED", updatedAt: new Date().toISOString() },
          },
          events: c.events || [],
          evidence: c.evidence || [],
          receipt: c.receipt || null,
          submitted_at: c.submittedAt || c.createdAt || new Date().toISOString(),
          created_at: c.createdAt || new Date().toISOString(),
          updated_at: c.updatedAt || new Date().toISOString(),
        }));

        const { error } = await supabase.from("complaints").upsert(rows, { onConflict: "id" });
        if (error) report.errors.push(`Complaints sync: ${error.message}`);
        else report.complaintsSynced = rows.length;
      }
    } catch (e: any) {
      report.errors.push(`Complaints exception: ${e.message}`);
    }

    // 5. Sync Private Availability Requests
    try {
      if (Array.isArray(db.privateRequests) && db.privateRequests.length > 0) {
        const rows = db.privateRequests.map((r: PrivateAvailabilityRequest) => ({
          id: r.id,
          request_number: r.requestNumber || `JNS-2026-AV-${String(Date.now()).slice(-4)}`,
          verified_phone_number: r.verifiedPhoneNumber || r.phone || "9876543210",
          requested_resource: r.requestedResource || r.resourceName || "Prescribed Medicine",
          resource_type: r.resourceType || "MEDICINE",
          original_transcript: r.originalTranscript || "",
          english_translation: r.englishTranslation || "",
          language_code: r.languageCode || "kn",
          hospital_id: r.hospitalId || "hosp-001",
          hospital_name: r.hospitalName || "Outpatient Department, Ballari",
          department_id: r.departmentId || null,
          department_name: r.departmentName || "Pharmacy and Medicine Availability",
          status: r.status || "Pending",
          otp_verified: r.otpVerified !== false,
          created_at: r.createdAt || new Date().toISOString(),
          updated_at: r.updatedAt || new Date().toISOString(),
        }));
        const { error } = await supabase.from("private_availability_requests").upsert(rows, { onConflict: "id" });
        if (error) report.errors.push(`Private requests sync: ${error.message}`);
        else report.privateRequestsSynced = rows.length;
      }
    } catch (e: any) {
      report.errors.push(`Private requests exception: ${e.message}`);
    }

    // 6. Sync Observations
    try {
      if (Array.isArray(db.observations) && db.observations.length > 0) {
        const rows = db.observations.map((o: ComplaintObservation) => ({
          id: o.id,
          complaint_id: o.complaintId,
          complaint_number: o.complaintNumber || null,
          observation_type: o.observationType,
          response: o.response,
          duration_since_last_cleaning: o.durationSinceLastCleaning || o.reportedDuration || null,
          language_code: o.languageCode || "kn",
          original_transcript: o.originalTranscript || o.transcript || null,
          location: o.location || "Outpatient Department, Ballari",
          created_at: o.createdAt || new Date().toISOString(),
        }));
        const { error } = await supabase.from("complaint_observations").upsert(rows, { onConflict: "id" });
        if (error) report.errors.push(`Observations sync: ${error.message}`);
        else report.observationsSynced = rows.length;
      }
    } catch (e: any) {
      report.errors.push(`Observations exception: ${e.message}`);
    }

    // 7. Sync Notifications
    try {
      if (Array.isArray(db.notifications) && db.notifications.length > 0) {
        const rows = db.notifications.map((n: NotificationItem) => ({
          id: n.id,
          availability_request_id: n.availabilityRequestId || null,
          recipient: n.recipient,
          message: n.message,
          provider: n.provider || "mock",
          delivery_status: n.deliveryStatus || "DELIVERED",
          department_name: n.departmentName || null,
          recipient_type: n.recipientType || "OFFICIAL",
          sent_at: n.sentAt || new Date().toISOString(),
        }));
        const { error } = await supabase.from("notifications").upsert(rows, { onConflict: "id" });
        if (error) report.errors.push(`Notifications sync: ${error.message}`);
        else report.notificationsSynced = rows.length;
      }
    } catch (e: any) {
      report.errors.push(`Notifications exception: ${e.message}`);
    }

    // 8. Sync Submissions (Idempotency)
    try {
      if (Array.isArray(db.submissions) && db.submissions.length > 0) {
        const rows = db.submissions.map((s: any) => ({
          id: `sub-${s.idempotencyKey.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 50)}`,
          idempotency_key: s.idempotencyKey,
          complaint_id: s.complaintId || null,
          created_at: s.createdAt || new Date().toISOString(),
        }));
        const { error } = await supabase.from("submissions").upsert(rows, { onConflict: "idempotency_key" });
        if (error) report.errors.push(`Submissions sync: ${error.message}`);
        else report.submissionsSynced = rows.length;
      }
    } catch (e: any) {
      report.errors.push(`Submissions exception: ${e.message}`);
    }

    // 9. Sync Counter Metadata
    try {
      const counterVal = db.counter || 127;
      const { error } = await supabase.from("app_metadata").upsert({
        key: "complaint_counter",
        value: { counter: counterVal, lastSync: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });
      if (error) report.errors.push(`Metadata sync: ${error.message}`);
      else report.counterSynced = counterVal;
    } catch (e: any) {
      report.errors.push(`Metadata exception: ${e.message}`);
    }

    report.success = report.errors.length === 0;
    return report;
  }

  /**
   * Real-time upsert of a single complaint to Supabase
   */
  static async upsertComplaint(complaint: ComplaintItem): Promise<boolean> {
    const supabase = getSupabaseServerClient();
    if (!supabase) return false;

    try {
      const rawSource = String(complaint.source || "").toLowerCase();
      const normSource =
        rawSource.includes("ivr") ||
        rawSource.includes("phone") ||
        rawSource.includes("twilio") ||
        rawSource.includes("elevenlabs")
          ? "ivr"
          : "kiosk";

      const customerName = complaint.citizenName || complaint.customerName || null;
      const customerPhone = complaint.citizenPhone || complaint.customerPhone || null;
      const description = complaint.summary || complaint.englishTranslation || complaint.originalTranscript;
      const location = complaint.wardOrLocation || complaint.location || "Outpatient Department, Ballari";

      const baseRow: Record<string, any> = {
        id: complaint.id,
        complaint_number: complaint.complaintNumber || complaint.ticketNumber,
        ticket_number: complaint.ticketNumber || complaint.complaintNumber,
        hospital_id: complaint.hospitalId || "hosp-001",
        hospital_name: complaint.hospitalName || "Outpatient Department, Ballari",
        department_id: complaint.departmentId || null,
        department_name: complaint.departmentName,
        category: complaint.category,
        visibility: complaint.visibility || "PUBLIC",
        source: normSource,
        original_language: complaint.originalLanguage,
        language_code: complaint.languageCode,
        original_transcript: complaint.originalTranscript,
        english_translation: complaint.englishTranslation,
        translated_text: complaint.translatedText || complaint.englishTranslation,
        summary: complaint.summary,
        ward_or_location: location,
        floor_or_block: complaint.floorOrBlock || "Ground Floor",
        status: complaint.status || "ASSIGNED",
        priority: complaint.priority || "Medium",
        citizen_name: customerName,
        citizen_phone: customerPhone,
        masked_citizen_phone: complaint.maskedCitizenPhone || null,
        medicine_name: complaint.medicineName || null,
        is_medicine_complaint: Boolean(complaint.isMedicineComplaint),
        assigned_official_id: complaint.assignedOfficialId || null,
        assigned_official_name: complaint.assignedOfficialName || null,
        assigned_official_designation: complaint.assignedOfficialDesignation || null,
        resolution_notes: complaint.resolutionNotes || null,
        resolved_at: complaint.resolvedAt || null,
        verified_at: complaint.verifiedAt || null,
        recurrence_count: complaint.recurrenceCount || 1,
        idempotency_key: complaint.idempotencyKey || null,
        delivery_tracking: complaint.deliveryTracking || {},
        events: complaint.events || [],
        evidence: complaint.evidence || [],
        receipt: complaint.receipt || null,
        submitted_at: complaint.submittedAt || complaint.createdAt,
        created_at: complaint.createdAt,
        updated_at: complaint.updatedAt,
      };

      // Extended row with customer_name, customer_phone, description, location columns
      const fullRow: Record<string, any> = {
        ...baseRow,
        customer_name: customerName,
        customer_phone: customerPhone,
        description: description,
        location: location,
      };

      // Try upserting with extended columns first
      let { error } = await supabase.from("complaints").upsert(fullRow, { onConflict: "id" });

      // If schema doesn't yet have the extended alias columns, fall back to baseRow
      if (
        error &&
        error.message &&
        (error.message.includes("column") ||
          error.message.includes("schema cache") ||
          error.message.includes("does not exist"))
      ) {
        const retry = await supabase.from("complaints").upsert(baseRow, { onConflict: "id" });
        error = retry.error;
      }

      if (error) {
        console.warn("[Supabase Realtime] Complaint upsert warning:", error.message);
        return false;
      }
      return true;
    } catch (e: any) {
      console.warn("[Supabase Realtime] Exception:", e.message);
      return false;
    }
  }

  /**
   * Real-time upsert of a call log (IVR Twilio + ElevenLabs) to Supabase
   */
  static async upsertCallLog(log: import("@/types").CallLogItem): Promise<boolean> {
    const supabase = getSupabaseServerClient();
    if (!supabase) return false;

    try {
      let targetId = log.id;
      // If no ID is provided, check if a row with this conversation_id or call_sid already exists
      if (!targetId && log.conversationId) {
        const { data: existing } = await supabase
          .from("call_logs")
          .select("id, caller_number, call_sid")
          .eq("conversation_id", log.conversationId)
          .limit(1)
          .maybeSingle();
        if (existing?.id) {
          targetId = existing.id;
          if (!log.callerNumber && existing.caller_number) {
            log.callerNumber = existing.caller_number;
          }
          if (!log.callSid && existing.call_sid) {
            log.callSid = existing.call_sid;
          }
        }
      }
      if (!targetId && log.callSid) {
        const { data: existing } = await supabase
          .from("call_logs")
          .select("id, caller_number, conversation_id")
          .eq("call_sid", log.callSid)
          .limit(1)
          .maybeSingle();
        if (existing?.id) {
          targetId = existing.id;
          if (!log.callerNumber && existing.caller_number) {
            log.callerNumber = existing.caller_number;
          }
          if (!log.conversationId && existing.conversation_id) {
            log.conversationId = existing.conversation_id;
          }
        }
      }

      const row: Record<string, any> = {
        id: targetId || `call-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        call_sid: log.callSid || null,
        conversation_id: log.conversationId || null,
        caller_number: log.callerNumber || null,
        to_number: log.toNumber || null,
        agent_id: log.agentId || null,
        complaint_id: log.complaintId || null,
        transcript: log.transcript || null,
        recording_url: log.recordingUrl || null,
        duration: typeof log.duration === "number" ? log.duration : null,
        status: log.status || "completed",
        call_metadata: log.callMetadata || {},
        updated_at: new Date().toISOString(),
      };
      if (log.createdAt) {
        row.created_at = log.createdAt;
      }

      const { error } = await supabase.from("call_logs").upsert(row, {
        onConflict: "id",
      });

      if (error) {
        console.warn("[Supabase CallLog] Upsert warning:", error.message);
        return false;
      }
      return true;
    } catch (e: any) {
      console.warn("[Supabase CallLog] Exception:", e.message);
      return false;
    }
  }

  /**
   * Real-time upsert of a notification to Supabase
   */
  static async insertNotification(notif: NotificationItem): Promise<boolean> {
    const supabase = getSupabaseServerClient();
    if (!supabase) return false;

    try {
      const row = {
        id: notif.id,
        availability_request_id: notif.availabilityRequestId || null,
        recipient: notif.recipient,
        message: notif.message,
        provider: notif.provider || "mock",
        delivery_status: notif.deliveryStatus || "DELIVERED",
        department_name: notif.departmentName || null,
        recipient_type: notif.recipientType || "OFFICIAL",
        sent_at: notif.sentAt || new Date().toISOString(),
      };
      const { error } = await supabase.from("notifications").upsert(row, { onConflict: "id" });
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Real-time upsert of an observation to Supabase
   */
  static async insertObservation(obs: ComplaintObservation): Promise<boolean> {
    const supabase = getSupabaseServerClient();
    if (!supabase) return false;

    try {
      const row = {
        id: obs.id,
        complaint_id: obs.complaintId,
        complaint_number: obs.complaintNumber || null,
        observation_type: obs.observationType,
        response: obs.response,
        duration_since_last_cleaning: obs.durationSinceLastCleaning || obs.reportedDuration || null,
        language_code: obs.languageCode || "kn",
        original_transcript: obs.originalTranscript || obs.transcript || null,
        location: obs.location,
        created_at: obs.createdAt || new Date().toISOString(),
      };
      const { error } = await supabase.from("complaint_observations").upsert(row, { onConflict: "id" });
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Real-time upsert of a private availability request to Supabase
   */
  static async upsertAvailabilityRequest(req: PrivateAvailabilityRequest): Promise<boolean> {
    const supabase = getSupabaseServerClient();
    if (!supabase) return false;

    try {
      const row = {
        id: req.id,
        request_number: req.requestNumber,
        verified_phone_number: req.verifiedPhoneNumber,
        requested_resource: req.requestedResource,
        resource_type: req.resourceType || "MEDICINE",
        original_transcript: req.originalTranscript,
        english_translation: req.englishTranslation,
        language_code: req.languageCode || "kn",
        hospital_id: req.hospitalId || "hosp-001",
        hospital_name: req.hospitalName || "Outpatient Department, Ballari",
        department_id: req.departmentId || null,
        department_name: req.departmentName || "Pharmacy and Medicine Availability",
        status: req.status || "Pending",
        otp_verified: Boolean(req.otpVerified),
        notifications: req.notifications || [],
        created_at: req.createdAt,
        updated_at: req.updatedAt,
      };
      const { error } = await supabase.from("private_availability_requests").upsert(row, { onConflict: "id" });
      return !error;
    } catch {
      return false;
    }
  }
}
