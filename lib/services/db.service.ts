import fs from "fs";
import path from "path";
import {
  AvailabilityStatus,
  ComplaintDeliveryTracking,
  ComplaintItem,
  ComplaintObservation,
  ComplaintReceipt,
  DeliveryState,
  HospitalDepartment,
  NotificationItem,
  ObservationType,
  OfficialDesignation,
  OfficialUser,
  PrivateAvailabilityRequest,
  SubmissionSource,
} from "@/types";
import { normalizeDepartmentName } from "@/lib/utils";
import {
  CENTRAL_DEPARTMENTS,
  routeComplaintDepartment,
  forwardToExternalGovernmentPortal,
} from "@/lib/config/routing";
import { SupabaseSyncService } from "./supabase-sync.service";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "janasuvidha-db.json");

interface DatabaseSchema {
  hospitals: any[];
  departments: any[];
  officials: OfficialUser[];
  complaints: ComplaintItem[];
  privateRequests: PrivateAvailabilityRequest[];
  observations: ComplaintObservation[];
  notifications: NotificationItem[];
  submissions: { idempotencyKey: string; complaintId: string; createdAt: string }[];
  counter: number;
  counterAv: number;
}

const SEED_OFFICIALS: OfficialUser[] = [
  {
    id: "off-demo-officer",
    name: "Demo Official",
    officialId: "HYG-OFF-01",
    email: "officer.hygiene@janasuvidha.gov.in",
    departmentId: "dept-hygiene",
    departmentName: "Hygiene and Sanitation",
    designation: "Department Officer",
    hospitalId: "hosp-001",
    hospitalName: "Outpatient Department, Ballari",
    role: "OFFICIAL",
    createdAt: "2026-11-01T00:00:00.000Z",
  },
  {
    id: "off-demo-supervisor",
    name: "Demo Supervisor",
    officialId: "HYG-SUP-01",
    email: "supervisor.hygiene@janasuvidha.gov.in",
    departmentId: "dept-hygiene",
    departmentName: "Hygiene and Sanitation",
    designation: "Department Supervisor",
    hospitalId: "hosp-001",
    hospitalName: "Outpatient Department, Ballari",
    role: "SUPERVISOR",
    createdAt: "2026-11-01T00:00:00.000Z",
  },
  {
    id: "off-hospital-admin",
    name: "Hospital Admin",
    officialId: "ADM-BLR-01",
    email: "admin@janasuvidha.gov.in",
    departmentId: "dept-all",
    departmentName: "All Departments",
    designation: "Hospital Administrator",
    hospitalId: "hosp-001",
    hospitalName: "Outpatient Department, Ballari",
    role: "ADMIN",
    createdAt: "2026-11-01T00:00:00.000Z",
  },
  {
    id: "off-water-officer",
    name: "Water & Facilities Officer",
    officialId: "WAT-OFF-02",
    email: "officer.water@janasuvidha.gov.in",
    departmentId: "dept-water",
    departmentName: "Water and Facilities",
    designation: "Department Officer",
    hospitalId: "hosp-001",
    hospitalName: "Outpatient Department, Ballari",
    role: "OFFICIAL",
    createdAt: "2026-11-01T00:00:00.000Z",
  },
  {
    id: "off-pharmacy-officer",
    name: "Chief Pharmacist",
    officialId: "PHR-OFF-03",
    email: "officer.pharmacy@janasuvidha.gov.in",
    departmentId: "dept-pharmacy",
    departmentName: "Pharmacy and Medicine Availability",
    designation: "Department Officer",
    hospitalId: "hosp-001",
    hospitalName: "Outpatient Department, Ballari",
    role: "OFFICIAL",
    createdAt: "2026-11-01T00:00:00.000Z",
  },
];

const SEED_COMPLAINTS: ComplaintItem[] = [
  {
    id: "comp-seed-1",
    complaintNumber: "JNS-2026-000101",
    ticketNumber: "JNS-2026-000101",
    hospitalId: "hosp-001",
    hospitalName: "Outpatient Department, Ballari",
    departmentId: "dept-hygiene",
    departmentName: "Hygiene and Sanitation",
    category: "Hygiene and Sanitation",
    visibility: "PUBLIC",
    source: "VOICE_KIOSK",
    originalLanguage: "Kannada",
    languageCode: "kn",
    originalTranscript: "ಇಲ್ಲಿನ ಶೌಚಾಲಯಗಳು ಸ್ವಚ್ಛವಾಗಿಲ್ಲ, ನೀರು ಹರಿಯುತ್ತಿಲ್ಲ ಮತ್ತು ದುರ್ವಾಸನೆ ಬರುತ್ತಿದೆ.",
    englishTranslation: "The hospital washrooms here are not clean, water is not flushing and there is a bad odour.",
    summary: "Hospital washrooms are not clean",
    wardOrLocation: "OPD Block B, Ground Floor",
    floorOrBlock: "Ground Floor",
    status: "VERIFIED",
    priority: "High",
    assignedOfficialId: "off-demo-officer",
    assignedOfficialName: "Demo Official",
    assignedOfficialDesignation: "Department Officer",
    resolutionNotes: "Sanitized floors with medical-grade disinfectant and repaired flush pipe.",
    resolvedAt: "2026-11-10T14:30:00.000Z",
    verifiedAt: "2026-11-10T15:10:00.000Z",
    submittedAt: "2026-11-10T11:45:00.000Z",
    createdAt: "2026-11-10T11:45:00.000Z",
    updatedAt: "2026-11-10T15:10:00.000Z",
    events: [
      {
        id: "ev-1",
        eventType: "CREATED",
        description: "Complaint reported at Citizen Voice Kiosk in Kannada.",
        performedBy: "Citizen Kiosk",
        timestamp: "2026-11-10T11:45:00.000Z",
      },
      {
        id: "ev-2",
        eventType: "ASSIGNED",
        description: "Assigned to Demo Official (Department Officer, Hygiene and Sanitation).",
        performedBy: "System Auto-Dispatcher",
        timestamp: "2026-11-10T11:46:00.000Z",
      },
      {
        id: "ev-3",
        eventType: "VERIFIED",
        description: "Verified by Demo Supervisor. Sanitation standards confirmed.",
        performedBy: "Demo Supervisor",
        timestamp: "2026-11-10T15:10:00.000Z",
      },
    ],
    evidence: [
      {
        id: "evid-1",
        type: "BEFORE",
        fileUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
        caption: "Washroom floor prior to cleaning",
        uploadedBy: "Demo Official",
        uploadedAt: "2026-11-10T12:00:00.000Z",
      },
      {
        id: "evid-2",
        type: "AFTER",
        fileUrl: "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=600&q=80",
        caption: "Fully sanitized and cleaned washroom",
        uploadedBy: "Demo Official",
        uploadedAt: "2026-11-10T14:30:00.000Z",
      },
    ],
    receipt: {
      complaintNumber: "JNS-2026-000101",
      complaintText: "Hospital washrooms are not clean",
      originalLanguage: "Kannada",
      hospitalName: "Outpatient Department, Ballari",
      location: "Outpatient Department, Ballari - Kiosk #1",
      submissionDate: "10 Nov 2026",
      submissionTime: "05:15 PM IST",
      timeZone: "Asia/Kolkata (IST, UTC+05:30)",
      category: "Hygiene and Sanitation",
      forwardedTo: "Hygiene and Sanitation Department",
      responsibleAuthority: "Demo Official (Department Officer)",
      status: "Submitted",
    },
  },
  {
    id: "comp-seed-2",
    complaintNumber: "JNS-2026-000102",
    ticketNumber: "JNS-2026-000102",
    hospitalId: "hosp-001",
    hospitalName: "Outpatient Department, Ballari",
    departmentId: "dept-water",
    departmentName: "Water and Facilities",
    category: "Water and Facilities",
    visibility: "PUBLIC",
    source: "VOICE_KIOSK",
    originalLanguage: "Hindi",
    languageCode: "hi",
    originalTranscript: "दूसरी मंजिल पर प्रसूति वार्ड के पास पीने के पानी का कूलर खराब है, ठंडा पानी नहीं आ रहा है।",
    englishTranslation: "The drinking water cooler near the maternity ward on the second floor is broken, cold water is not coming.",
    summary: "Drinking water dispenser malfunctioning near 2nd Floor Maternity Ward",
    wardOrLocation: "Maternity Ward Corridor, 2nd Floor",
    floorOrBlock: "2nd Floor",
    status: "IN_PROGRESS",
    priority: "High",
    assignedOfficialId: "off-water-officer",
    assignedOfficialName: "Water & Facilities Officer",
    assignedOfficialDesignation: "Department Officer",
    submittedAt: "2026-11-10T13:20:00.000Z",
    createdAt: "2026-11-10T13:20:00.000Z",
    updatedAt: "2026-11-10T14:00:00.000Z",
    events: [
      {
        id: "ev-4",
        eventType: "CREATED",
        description: "Complaint reported at Citizen Voice Kiosk in Hindi.",
        performedBy: "Citizen Kiosk",
        timestamp: "2026-11-10T13:20:00.000Z",
      },
      {
        id: "ev-5",
        eventType: "IN_PROGRESS",
        description: "Maintenance squad dispatched with spare thermostat.",
        performedBy: "Water & Facilities Officer",
        timestamp: "2026-11-10T14:00:00.000Z",
      },
    ],
    evidence: [],
    receipt: {
      complaintNumber: "JNS-2026-000102",
      complaintText: "Drinking water dispenser malfunctioning near 2nd Floor Maternity Ward",
      originalLanguage: "Hindi",
      hospitalName: "Outpatient Department, Ballari",
      location: "Outpatient Department, Ballari - Kiosk #1",
      submissionDate: "10 Nov 2026",
      submissionTime: "06:50 PM IST",
      timeZone: "Asia/Kolkata (IST, UTC+05:30)",
      category: "Water and Facilities",
      forwardedTo: "Water and Facilities Department",
      responsibleAuthority: "Water & Facilities Officer (Department Officer)",
      status: "Submitted",
    },
  },
];

export class DBService {
  private static fileMutex: Promise<any> = Promise.resolve();

  /**
   * Concurrency-safe exclusive transaction wrapper.
   * Serializes file reads and writes across concurrent requests to eliminate race conditions.
   */
  static async runInTransaction<T>(work: (db: DatabaseSchema) => Promise<T> | T): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      DBService.fileMutex = DBService.fileMutex.then(async () => {
        try {
          const db = DBService.ensureInitialized();
          const result = await work(db);
          DBService.writeData(db);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  /**
   * Generates a globally unique complaint ID:
   * Format: JAN-${year}-${String(seq).padStart(6, "0")} (e.g. JAN-2026-000128)
   * Dynamic year, atomic increment, collision-free, uniqueness enforced.
   */
  static allocateNextComplaintNumber(db: DatabaseSchema): string {
    const currentYear = new Date().getFullYear();
    let maxSeq = 127;

    // Scan all existing complaint numbers
    for (const c of db.complaints || []) {
      const num = c.complaintNumber || c.ticketNumber || "";
      const m = num.match(/^(?:JAN|JNS)-\d{4}-(\d+)$/);
      if (m) {
        const parsed = parseInt(m[1], 10);
        if (!isNaN(parsed) && parsed > maxSeq) {
          maxSeq = parsed;
        }
      }
    }

    // Also compare against database counter
    if (typeof db.counter === "number" && db.counter > maxSeq) {
      maxSeq = db.counter;
    }

    let nextSeq = maxSeq + 1;
    let candidate = `JAN-${currentYear}-${String(nextSeq).padStart(6, "0")}`;

    // Guarantee database unique constraint
    const existing = new Set((db.complaints || []).map((c) => c.complaintNumber || c.ticketNumber));
    while (existing.has(candidate)) {
      nextSeq += 1;
      candidate = `JAN-${currentYear}-${String(nextSeq).padStart(6, "0")}`;
    }

    db.counter = nextSeq;
    return candidate;
  }

  private static ensureInitialized(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (dirErr: any) {
      console.warn("[DBService] Could not create DATA_DIR in read-only environment:", dirErr?.message);
    }

    if (!fs.existsSync(DB_FILE)) {
      const initialData: DatabaseSchema = {
        hospitals: [
          {
            id: "hosp-001",
            code: "OPD-BAL-01",
            name: "Outpatient Department, Ballari",
            district: "Ballari",
            state: "Karnataka",
            pincode: "560002",
            type: "Tertiary Government Teaching Hospital",
          },
        ],
        departments: [
          { id: "dept-hygiene", name: "Hygiene and Sanitation" },
          { id: "dept-water", name: "Water and Facilities" },
          { id: "dept-pharmacy", name: "Pharmacy and Medicine Availability" },
          { id: "dept-bed", name: "Bed Management" },
          { id: "dept-infra", name: "Infrastructure Maintenance" },
          { id: "dept-services", name: "Hospital Services" },
        ],
        officials: SEED_OFFICIALS,
        complaints: SEED_COMPLAINTS,
        privateRequests: [
          {
            id: "req-av-seed-1",
            requestNumber: "JNS-2026-AV-000101",
            verifiedPhoneNumber: "9876543210",
            requestedResource: "Paracetamol 500mg IV Infusion",
            resourceType: "MEDICINE",
            originalTranscript: "ನನ್ನ ವೈದ್ಯರು ಬರೆದಿರುವ ಪ್ಯಾರಸಿಟಮಾಲ್ ಇಂಜೆಕ್ಷನ್ ಇಲ್ಲಿ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಅದು ಬಂದಾಗ ನನಗೆ ತಿಳಿಸಿ.",
            englishTranslation: "The prescribed Paracetamol IV infusion is currently unavailable. Please inform me when it arrives.",
            languageCode: "kn",
            hospitalId: "hosp-001",
            hospitalName: "Outpatient Department, Ballari",
            departmentId: "dept-pharmacy",
            departmentName: "Pharmacy and Medicine Availability",
            status: "Pending",
            otpVerified: true,
            createdAt: "2026-11-10T10:00:00.000Z",
            updatedAt: "2026-11-10T10:00:00.000Z",
          },
        ],
        observations: [],
        notifications: [],
        submissions: [],
        counter: 124,
        counterAv: 101,
      };
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf8");
      } catch (writeErr: any) {
        console.warn("[DBService] Could not write seed file in read-only environment; returning in-memory schema.");
      }
      return initialData;
    }

    try {
      const raw = fs.readFileSync(DB_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (!parsed.hospitals || !Array.isArray(parsed.hospitals) || parsed.hospitals.length === 0) {
        parsed.hospitals = [
          {
            id: "hosp-001",
            code: "OPD-BAL-01",
            name: "Outpatient Department, Ballari",
            district: "Ballari",
            state: "Karnataka",
            pincode: "560002",
            type: "Tertiary Government Teaching Hospital",
          },
        ];
      }
      if (!parsed.departments || !Array.isArray(parsed.departments) || parsed.departments.length === 0) {
        parsed.departments = [
          { id: "dept-hygiene", name: "Hygiene and Sanitation" },
          { id: "dept-water", name: "Water and Facilities" },
          { id: "dept-pharmacy", name: "Pharmacy and Medicine Availability" },
          { id: "dept-bed", name: "Bed Management" },
          { id: "dept-infra", name: "Infrastructure Maintenance" },
          { id: "dept-services", name: "Hospital Services" },
        ];
      }
      if (!parsed.officials || !Array.isArray(parsed.officials) || parsed.officials.length === 0) {
        parsed.officials = SEED_OFFICIALS;
      }
      if (!parsed.complaints || !Array.isArray(parsed.complaints)) {
        parsed.complaints = SEED_COMPLAINTS;
      }
      if (!parsed.privateRequests || !Array.isArray(parsed.privateRequests)) parsed.privateRequests = [];
      if (!parsed.observations || !Array.isArray(parsed.observations)) parsed.observations = [];
      if (!parsed.notifications || !Array.isArray(parsed.notifications)) parsed.notifications = [];
      if (!parsed.submissions || !Array.isArray(parsed.submissions)) parsed.submissions = [];
      if (typeof parsed.counter !== "number" || isNaN(parsed.counter) || parsed.counter < 100) {
        parsed.counter = Math.max(124, (parsed.complaints?.length || 0) + 100);
      }
      if (typeof parsed.counterAv !== "number" || isNaN(parsed.counterAv) || parsed.counterAv < 100) {
        parsed.counterAv = 101;
      }
      return parsed;
    } catch (e) {
      console.error("[DBService] Failed to read database file, restoring defaults:", e);
      const initialData: DatabaseSchema = {
        hospitals: [
          {
            id: "hosp-001",
            code: "OPD-BAL-01",
            name: "Outpatient Department, Ballari",
            district: "Ballari",
            state: "Karnataka",
            pincode: "560002",
            type: "Tertiary Government Teaching Hospital",
          },
        ],
        departments: [
          { id: "dept-hygiene", name: "Hygiene and Sanitation" },
          { id: "dept-water", name: "Water and Facilities" },
          { id: "dept-pharmacy", name: "Pharmacy and Medicine Availability" },
          { id: "dept-bed", name: "Bed Management" },
          { id: "dept-infra", name: "Infrastructure Maintenance" },
          { id: "dept-services", name: "Hospital Services" },
        ],
        officials: SEED_OFFICIALS,
        complaints: SEED_COMPLAINTS,
        privateRequests: [],
        observations: [],
        notifications: [],
        submissions: [],
        counter: 124,
        counterAv: 101,
      };
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf8");
      } catch (writeErr: any) {
        console.warn("[DBService] Read-only environment: cannot write defaults to file.");
      }
      return initialData;
    }
  }

  private static writeData(data: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
    } catch (fsErr: any) {
      if (
        fsErr?.code === "EROFS" ||
        fsErr?.message?.includes("read-only") ||
        process.env.VERCEL ||
        process.env.AWS_LAMBDA_FUNCTION_NAME
      ) {
        console.warn("[DBService] Read-only filesystem detected (Vercel). Local JSON write bypassed safely; Supabase PostgreSQL is the authoritative store.");
        return;
      }
      throw fsErr;
    }
  }

  /**
   * Helper to format current time in Asia/Kolkata (IST, UTC+05:30)
   */
  static getKolkataDateTime(date: Date = new Date()): {
    formattedDate: string;
    formattedTime: string;
    timeZone: string;
  } {
    const timeZone = "Asia/Kolkata";
    const formattedDate = new Intl.DateTimeFormat("en-IN", {
      timeZone,
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);

    const formattedTime = new Intl.DateTimeFormat("en-IN", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date) + " IST";

    return {
      formattedDate,
      formattedTime,
      timeZone: "Asia/Kolkata (IST, UTC+05:30)",
    };
  }

  /**
   * Get all complaints, with security filtering based on official's department
   */
  static async getComplaints(filter?: {
    officialDepartment?: string;
    designation?: string;
    category?: string;
    status?: string;
    search?: string;
    visibility?: "PUBLIC" | "PRIVATE";
    onlyMedicine?: boolean;
    excludePrivateMedicine?: boolean;
  }): Promise<ComplaintItem[]> {
    const db = this.ensureInitialized();
    let list = (db.complaints || []).map((c) => ({
      ...c,
      id: c.id || `comp-${Math.random()}`,
      complaintNumber: c.complaintNumber || c.ticketNumber || "JNS-2026-UNKNOWN",
      ticketNumber: c.ticketNumber || c.complaintNumber || "JNS-2026-UNKNOWN",
      status: c.status || "ASSIGNED",
      priority: c.priority || "Medium",
      category: c.category || "Hospital Services",
      departmentName: c.departmentName || (c.category as any) || "Hospital Services",
      wardOrLocation: c.wardOrLocation || (c as any).location || "Outpatient Department, Ballari - Kiosk #1",
      summary: c.summary || c.originalTranscript || "Hospital grievance reported",
      originalTranscript: c.originalTranscript || "",
      englishTranslation: c.englishTranslation || c.originalTranscript || "",
      submittedAt: c.submittedAt || c.createdAt || new Date().toISOString(),
      createdAt: c.createdAt || c.submittedAt || new Date().toISOString(),
      citizenName: c.citizenName || "Citizen",
      citizenPhone: c.citizenPhone || "",
      maskedCitizenPhone: c.maskedCitizenPhone || (c.citizenPhone ? `XXXXXX${c.citizenPhone.slice(-4)}` : undefined),
      medicineName: c.medicineName,
      isMedicineComplaint: Boolean(c.isMedicineComplaint),
      hospitalName: c.hospitalName || "Outpatient Department, Ballari",
    }));

    // Exclude private medicine complaints from public reviews
    if (filter?.visibility === "PUBLIC" || filter?.excludePrivateMedicine) {
      list = list.filter(
        (c) =>
          c.visibility !== "PRIVATE" &&
          !c.isMedicineComplaint &&
          c.category !== "Pharmacy and Medicine Availability"
      );
    }

    if (filter?.onlyMedicine) {
      list = list.filter(
        (c) =>
          c.isMedicineComplaint === true ||
          c.category === "Pharmacy and Medicine Availability"
      );
    }

    // Security Filter:
    // Hospital Administrator sees ALL complaints.
    // Department Officer and Supervisor see ONLY complaints for their department.
    if (
      filter?.officialDepartment &&
      filter.designation !== "Hospital Administrator" &&
      filter.officialDepartment !== "ALL" &&
      filter.officialDepartment !== "All Departments"
    ) {
      const deptNormalized = normalizeDepartmentName(filter.officialDepartment);
      list = list.filter(
        (c) =>
          normalizeDepartmentName(c.departmentName) === deptNormalized ||
          normalizeDepartmentName(c.category) === deptNormalized
      );
    }

    if (filter?.status) {
      list = list.filter((c) => (c.status || "").toLowerCase() === filter.status!.toLowerCase());
    }

    if (filter?.category) {
      list = list.filter((c) => (c.category || "").toLowerCase() === filter.category!.toLowerCase());
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          (c.complaintNumber && c.complaintNumber.toLowerCase().includes(q)) ||
          (c.ticketNumber && c.ticketNumber.toLowerCase().includes(q)) ||
          (c.summary && c.summary.toLowerCase().includes(q)) ||
          (c.wardOrLocation && c.wardOrLocation.toLowerCase().includes(q)) ||
          (c.medicineName && c.medicineName.toLowerCase().includes(q)) ||
          (c.citizenPhone && c.citizenPhone.includes(q)) ||
          (c.originalTranscript && c.originalTranscript.toLowerCase().includes(q)) ||
          (c.englishTranslation && c.englishTranslation.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    return list.sort((a, b) => new Date(b.submittedAt || b.createdAt || 0).getTime() - new Date(a.submittedAt || a.createdAt || 0).getTime());
  }

  /**
   * Find single complaint by complaintNumber or ID
   */
  static async getComplaintById(idOrNumber: string): Promise<ComplaintItem | null> {
    const db = this.ensureInitialized();
    const query = (idOrNumber || "").trim().toUpperCase();
    let c = db.complaints.find(
      (c) =>
        (c.complaintNumber && c.complaintNumber.toUpperCase() === query) ||
        (c.ticketNumber && c.ticketNumber.toUpperCase() === query) ||
        c.id === idOrNumber
    );

    // If not found directly in complaints, search privateRequests (or requests with -AV- or digits matching)
    if (!c && db.privateRequests) {
      const av = db.privateRequests.find(
        (r) =>
          (r.requestNumber && r.requestNumber.toUpperCase() === query) ||
          (r.requestNumber && r.requestNumber.toUpperCase().replace("-AV-", "-") === query.replace("-AV-", "-")) ||
          (r.requestNumber && query.replace("-AV-", "-") === r.requestNumber.toUpperCase().replace("-AV-", "-")) ||
          r.id === idOrNumber
      );
      if (av) {
        c = {
          id: av.id,
          complaintNumber: av.requestNumber,
          ticketNumber: av.requestNumber,
          hospitalId: av.hospitalId || "hosp-001",
          hospitalName: av.hospitalName || "Outpatient Department, Ballari",
          departmentName: av.departmentName || "Pharmacy and Medicine Availability",
          category: "Pharmacy and Medicine Availability",
          status: av.status === "Available" || av.status === "AVAILABLE" ? "VERIFIED" : (av.status === "Notification Sent" ? "RESOLUTION_SUBMITTED" : "ASSIGNED"),
          priority: "High",
          visibility: "PRIVATE",
          isMedicineComplaint: true,
          medicineName: av.requestedResource,
          citizenPhone: av.verifiedPhoneNumber || "",
          maskedCitizenPhone: av.maskedPhone || (av.verifiedPhoneNumber ? `XXXXXX${av.verifiedPhoneNumber.slice(-4)}` : undefined),
          citizenName: "Citizen",
          originalTranscript: av.originalTranscript || `Prescribed medicine "${av.requestedResource}" unavailable`,
          englishTranslation: av.englishTranslation || `The prescribed medicine "${av.requestedResource}" is unavailable at the pharmacy.`,
          summary: `Medicine Unavailable: ${av.requestedResource}`,
          wardOrLocation: "Outpatient Department, Ballari - Pharmacy Counter",
          assignedOfficialName: "Kavitha Raman",
          assignedOfficialDesignation: "Chief Pharmacist",
          submittedAt: av.createdAt,
          createdAt: av.createdAt,
          updatedAt: av.updatedAt || av.createdAt,
          source: "VOICE_KIOSK",
          originalLanguage: av.languageCode === "kn" ? "Kannada" : av.languageCode === "hi" ? "Hindi" : "English",
          languageCode: av.languageCode || "en",
          events: [],
          evidence: [],
          receipt: {
            complaintNumber: av.requestNumber,
            complaintText: `Medicine Unavailable: ${av.requestedResource}`,
            originalLanguage: av.languageCode === "kn" ? "Kannada" : av.languageCode === "hi" ? "Hindi" : "English",
            hospitalName: av.hospitalName || "Outpatient Department, Ballari",
            location: "Outpatient Department, Ballari - Pharmacy Counter",
            submissionDate: new Date(av.createdAt).toLocaleDateString("en-IN"),
            submissionTime: new Date(av.createdAt).toLocaleTimeString("en-IN"),
            timeZone: "Asia/Kolkata (IST, UTC+05:30)",
            category: "Pharmacy and Medicine Availability",
            forwardedTo: "Pharmacy and Medicine Availability Department",
            responsibleAuthority: "Kavitha Raman (Chief Pharmacist)",
            status: av.status,
          },
        };
      }
    }

    if (!c) return null;

    const isMed = Boolean(
      c.isMedicineComplaint ||
      c.medicineName ||
      c.category === "Pharmacy and Medicine Availability" ||
      c.departmentName === "Pharmacy and Medicine Availability"
    );

    const medName =
      c.medicineName ||
      (isMed ? c.summary?.replace(/^Medicine Unavailable:\s*/i, "") : undefined);

    const summaryText =
      isMed && medName
        ? `Medicine Unavailable: ${medName}`
        : (c.summary && c.summary !== "Hospital grievance reported"
            ? c.summary
            : (c.englishTranslation || c.originalTranscript || "Hospital grievance"));

    const dept = this.getCanonicalDepartmentName(c.departmentName || (c.category as any));

    return {
      ...c,
      id: c.id || `comp-${Math.random()}`,
      complaintNumber: c.complaintNumber || c.ticketNumber || "JNS-2026-UNKNOWN",
      ticketNumber: c.ticketNumber || c.complaintNumber || "JNS-2026-UNKNOWN",
      status: c.status || "ASSIGNED",
      priority: c.priority || (isMed ? "High" : "Medium"),
      category: isMed ? "Pharmacy and Medicine Availability" : (c.category || dept),
      departmentName: dept,
      wardOrLocation: c.wardOrLocation || (c as any).location || "Outpatient Department, Ballari - Kiosk #1",
      summary: summaryText,
      originalTranscript: c.originalTranscript || c.summary || "Hospital grievance reported",
      englishTranslation: c.englishTranslation || c.summary || c.originalTranscript || "Hospital grievance reported",
      submittedAt: c.submittedAt || c.createdAt || new Date().toISOString(),
      createdAt: c.createdAt || c.submittedAt || new Date().toISOString(),
      citizenName: c.citizenName || "Citizen",
      citizenPhone: c.citizenPhone || "",
      maskedCitizenPhone: c.maskedCitizenPhone || (c.citizenPhone ? `XXXXXX${c.citizenPhone.slice(-4)}` : undefined),
      medicineName: medName,
      isMedicineComplaint: isMed,
      hospitalName: c.hospitalName || "Outpatient Department, Ballari",
      assignedOfficialName:
        c.assignedOfficialName ||
        (dept.includes("Pharmacy")
          ? "Kavitha Raman"
          : dept.includes("Water")
          ? "Rajesh Verma"
          : dept.includes("Bed")
          ? "Dr. Preethi Hegde"
          : dept.includes("Infra")
          ? "Suresh Nambiar"
          : "Demo Official"),
      assignedOfficialDesignation:
        c.assignedOfficialDesignation ||
        (dept.includes("Pharmacy")
          ? "Chief Pharmacist"
          : dept.includes("Water")
          ? "Sanitation & Facilities Lead"
          : dept.includes("Bed")
          ? "Bed Manager & Casualty Officer"
          : dept.includes("Infra")
          ? "Civil Works Executive"
          : "Department Officer"),
    };
  }

  static getCanonicalDepartmentName(dept?: string): string {
    if (!dept) return "Hospital Services";
    const d = dept.trim().toLowerCase();

    // 1. Water and Facilities (high priority check)
    if (
      d.includes("water") ||
      d.includes("drink") ||
      d.includes("cooler") ||
      d.includes("plumb") ||
      d.includes("neeru") ||
      d.includes("paani") ||
      d.includes("pani") ||
      d.includes("neellu") ||
      d.includes("tap") ||
      d.includes("leak") ||
      d.includes("pipe") ||
      d.includes("filter") ||
      d.includes("tank") ||
      d.includes("drain") ||
      d.includes("flushing") ||
      d.includes("ನಲ್ಲಿ") ||
      d.includes("ನೀರು") ||
      d.includes("ಕುಡಿಯುವ") ||
      d.includes("ತಣ್ಣೀರು") ||
      d.includes("नल") ||
      d.includes("पानी") ||
      d.includes("जल") ||
      d.includes("నీరు") ||
      d.includes("நீர") ||
      d.includes("தண்ணீர்") ||
      d.includes("വെള്ളം")
    ) {
      return "Water and Facilities";
    }

    // 2. Pharmacy & Medicines
    if (
      d.includes("pharm") ||
      d.includes("med") ||
      d.includes("drug") ||
      d.includes("tablet") ||
      d.includes("dawa") ||
      d.includes("aushadh") ||
      d.includes("insulin") ||
      d.includes("prescri") ||
      d.includes("capsule") ||
      d.includes("syrup") ||
      d.includes("drops") ||
      d.includes("injection") ||
      d.includes("dolo") ||
      d.includes("paracetamol") ||
      d.includes("ಮಾತ್ರೆ") ||
      d.includes("ಔಷಧಿ") ||
      d.includes("ದವಾ") ||
      d.includes("दवा") ||
      d.includes("दवाई") ||
      d.includes("మందు")
    ) {
      return "Pharmacy and Medicine Availability";
    }

    // 3. Bed Management
    if (
      d.includes("bed") ||
      d.includes("icu") ||
      d.includes("admiss") ||
      d.includes("stretcher") ||
      d.includes("wheelchair") ||
      d.includes("ventilator") ||
      d.includes("hasige") ||
      d.includes("bistar") ||
      d.includes("ಹಾಸಿಗೆ") ||
      d.includes("ಬೆಡ್") ||
      d.includes("बिस्तर") ||
      d.includes("पलंग")
    ) {
      return "Bed Management";
    }

    // 4. Infrastructure Maintenance
    if (
      d.includes("infra") ||
      d.includes("electric") ||
      d.includes("light") ||
      d.includes("fan") ||
      d.includes("lift") ||
      d.includes("repair") ||
      d.includes("maint") ||
      d.includes("pankha") ||
      d.includes("power") ||
      d.includes("switch") ||
      d.includes("wire") ||
      d.includes("generator") ||
      d.includes("ac") ||
      d.includes("door") ||
      d.includes("window") ||
      d.includes("ಬೆಳಕು") ||
      d.includes("ಫ್ಯಾನ್") ||
      d.includes("ವಿದ್ಯುತ್") ||
      d.includes("ಲಿಫ್ಟ್") ||
      d.includes("बिजली") ||
      d.includes("पंखा") ||
      d.includes("लाइट")
    ) {
      return "Infrastructure Maintenance";
    }

    // 5. Hygiene and Sanitation
    if (
      d.includes("hygiene") ||
      d.includes("sanitat") ||
      d.includes("clean") ||
      d.includes("shauchalay") ||
      d.includes("swachh") ||
      d.includes("toilet") ||
      d.includes("washroom") ||
      d.includes("dirty") ||
      d.includes("waste") ||
      d.includes("garbage") ||
      d.includes("dustbin") ||
      d.includes("odour") ||
      d.includes("smell") ||
      d.includes("stink") ||
      d.includes("mosquito") ||
      d.includes("sweep") ||
      d.includes("broom") ||
      d.includes("ಸ್ವಚ್ಛ") ||
      d.includes("ಶೌಚಾಲಯ") ||
      d.includes("ಕಸ") ||
      d.includes("ಗಬ್ಬು") ||
      d.includes("गंदगी") ||
      d.includes("शौचालय") ||
      d.includes("सफाई")
    ) {
      return "Hygiene and Sanitation";
    }

    return "Hospital Services";
  }

  /**
   * Internal routine for complaint creation, called within runInTransaction.
   */
  private static async createComplaintInternal(
    db: DatabaseSchema,
    params: {
      originalLanguage: string;
      languageCode: string;
      originalTranscript: string;
      englishTranslation: string;
      summary: string;
      category: string;
      department: string;
      priority?: "Low" | "Medium" | "High" | "Critical";
      location?: string;
      source?: SubmissionSource;
      medicineName?: string;
      citizenPhone?: string;
      citizenName?: string;
      isMedicineComplaint?: boolean;
      visibility?: "PUBLIC" | "PRIVATE";
      simulateDeptFailure?: boolean;
    }
  ): Promise<ComplaintItem> {
    const complaintNumber = this.allocateNextComplaintNumber(db);
    const id = `comp-${Date.now()}-${db.counter}`;
    const nowIso = new Date().toISOString();
    const { formattedDate, formattedTime, timeZone } = this.getKolkataDateTime();

    const isMed =
      Boolean(params.isMedicineComplaint) ||
      params.category === "Pharmacy and Medicine Availability" ||
      (typeof params.department === "string" && params.department.toLowerCase().includes("pharmacy")) ||
      Boolean(params.medicineName);

    // Central category-based department routing
    const routedDept = routeComplaintDepartment({
      category: isMed ? "Pharmacy and Medicine Availability" : params.category,
      department: isMed ? "Pharmacy and Medicine Availability" : params.department,
      summary: params.summary,
      transcript: params.originalTranscript,
      text: params.englishTranslation,
    });

    const canonicalDepartment = isMed ? "Pharmacy and Medicine Availability" : routedDept.name;
    const category = isMed ? "Pharmacy and Medicine Availability" : routedDept.category;
    const department = canonicalDepartment;
    const visibility = isMed ? "PRIVATE" : (params.visibility || "PUBLIC");

    // Identify responsible official in the department
    const deptNormalized = normalizeDepartmentName(department);
    const departmentRecord = (db.departments || []).find(
      (item) => normalizeDepartmentName(item?.name) === deptNormalized
    );

    const fallbackOfficial = {
      id: routedDept.id,
      name: routedDept.officialName,
      officialId: `${routedDept.code}-01`,
      email: routedDept.officialEmail,
      departmentId: departmentRecord?.id || routedDept.id,
      departmentName: department,
      designation: routedDept.officialDesignation,
      hospitalId: "hosp-001",
      hospitalName: "Outpatient Department, Ballari",
      role: "OFFICIAL" as any,
      phone: "+91 80 2670 1150",
    };

    const official =
      (Array.isArray(db.officials) && db.officials.find(
        (o) =>
          normalizeDepartmentName(o.departmentName) === deptNormalized &&
          o.designation === "Department Officer"
      )) ||
      (Array.isArray(db.officials) && db.officials.find(
        (o) => normalizeDepartmentName(o.departmentName) === deptNormalized
      )) ||
      fallbackOfficial;

    const receipt: ComplaintReceipt = {
      complaintNumber,
      complaintText: params.summary || (isMed ? `Medicine request: ${params.medicineName || "Prescribed medicine"}` : "Hospital grievance reported"),
      originalLanguage: params.originalLanguage || "Kannada",
      hospitalName: "Outpatient Department, Ballari",
      location: params.location || "Outpatient Department, Ballari - Kiosk #1",
      submissionDate: formattedDate,
      submissionTime: formattedTime,
      timeZone,
      category: category as any,
      forwardedTo: department,
      responsibleAuthority: official
        ? `${official.name} (${official.designation})`
        : "Department Supervisor",
      status: "Submitted",
    };

    const maskedPhone = params.citizenPhone
      ? `XXXXXX${params.citizenPhone.slice(-4)}`
      : undefined;

    // Multi-destination delivery tracking
    const deptDeliveryStatus: DeliveryState = params.simulateDeptFailure ? "FAILED" : "DELIVERED";
    const deptLastError = params.simulateDeptFailure
      ? "Simulated connection timeout to department endpoint"
      : undefined;

    const deliveryTracking: ComplaintDeliveryTracking = {
      adminPortal: {
        status: "DELIVERED",
        updatedAt: nowIso,
        deliveredAt: nowIso,
        attempts: 1,
      },
      departmentPortal: {
        status: deptDeliveryStatus,
        updatedAt: nowIso,
        deliveredAt: params.simulateDeptFailure ? undefined : nowIso,
        lastError: deptLastError,
        attempts: 1,
      },
      externalGovPortal: {
        status: "NOT_CONFIGURED",
        updatedAt: nowIso,
        attempts: 0,
        lastError: "External government integration endpoint or credentials not configured in environment.",
      },
    };

    const newComplaint: ComplaintItem = {
      id,
      complaintNumber,
      ticketNumber: complaintNumber,
      hospitalId: "hosp-001",
      hospitalName: "Outpatient Department, Ballari",
      departmentId: official?.departmentId || routedDept.id,
      departmentName: department,
      category: category as any,
      visibility,
      isMedicineComplaint: isMed,
      medicineName: params.medicineName,
      citizenPhone: params.citizenPhone,
      customerPhone: params.citizenPhone,
      maskedCitizenPhone: maskedPhone,
      citizenName: params.citizenName || (isMed ? "Citizen" : undefined),
      customerName: params.citizenName || (isMed ? "Citizen" : undefined),
      source: (params.source as any) || "VOICE_KIOSK",
      originalLanguage: params.originalLanguage || "Kannada",
      languageCode: params.languageCode || "kn",
      originalTranscript: params.originalTranscript || "",
      englishTranslation: params.englishTranslation || params.originalTranscript || "",
      translatedText: params.englishTranslation || params.originalTranscript || "",
      summary: params.summary || "Hospital grievance",
      description: params.summary || params.englishTranslation || params.originalTranscript || "Hospital grievance",
      wardOrLocation: params.location || "Outpatient Department, Ballari - Kiosk #1",
      location: params.location || "Outpatient Department, Ballari - Kiosk #1",
      floorOrBlock: "Ground Floor",
      status: "ASSIGNED",
      priority: params.priority || "Medium",
      assignedOfficialId: official?.id || "off-demo-officer",
      assignedOfficialName: official?.name || "Department Officer",
      assignedOfficialDesignation: official?.designation || "Department Officer",
      submittedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
      deliveryTracking,
      events: [
        {
          id: `ev-${Date.now()}-1`,
          eventType: "CREATED",
          description: isMed
            ? `Medicine availability request logged for "${params.medicineName || params.summary || 'Prescribed medicine'}". Registered phone: ${maskedPhone || "N/A"}.`
            : `Grievance registered in ${params.originalLanguage || 'Kannada'} at Citizen Voice Kiosk.`,
          performedBy: "Citizen Voice Kiosk",
          timestamp: nowIso,
        },
        {
          id: `ev-${Date.now()}-2`,
          eventType: "ASSIGNED",
          description: `Automatically routed to ${department} Department. Assigned to ${official.name} (${official.designation}).`,
          performedBy: "AI Workflow Dispatcher",
          timestamp: nowIso,
        },
      ],
      evidence: [],
      receipt,
    };

    if (!Array.isArray(db.complaints)) {
      db.complaints = [];
    }
    db.complaints.unshift(newComplaint);

    // Save official and admin dispatch notifications
    if (!Array.isArray(db.notifications)) {
      db.notifications = [];
    }
    const deptNotif: NotificationItem = {
      id: `notif-${Date.now()}-dept`,
      availabilityRequestId: newComplaint.id,
      recipient: official.email || routedDept.officialEmail,
      message: `New grievance ${complaintNumber} dispatched to ${canonicalDepartment}: "${params.summary || params.originalTranscript}"`,
      provider: "mock",
      deliveryStatus: params.simulateDeptFailure ? "FAILED" : "DELIVERED",
      sentAt: nowIso,
      departmentName: canonicalDepartment,
      recipientType: "OFFICIAL",
    };
    const adminNotif: NotificationItem = {
      id: `notif-${Date.now()}-admin`,
      availabilityRequestId: newComplaint.id,
      recipient: "admin.ballari@janasuvidha.gov.in",
      message: `New grievance ${complaintNumber} registered for ${canonicalDepartment} (${isMed ? 'Medicine Shortage' : 'Facility'}).`,
      provider: "mock",
      deliveryStatus: "DELIVERED",
      sentAt: nowIso,
      departmentName: canonicalDepartment,
      recipientType: "ADMIN",
    };
    db.notifications.unshift(deptNotif, adminNotif);

    // If it's a medicine complaint with citizen phone, record private availability request and send SMS ack
    if (isMed && params.citizenPhone) {
      if (!Array.isArray(db.privateRequests)) {
        db.privateRequests = [];
      }
      const avReq: PrivateAvailabilityRequest = {
        id: `req-av-${newComplaint.id}`,
        requestNumber: `JNS-2026-AV-${complaintNumber.split("-").pop() || String(Date.now()).slice(-4)}`,
        verifiedPhoneNumber: params.citizenPhone,
        requestedResource: params.medicineName || params.summary || "Prescribed Medicine",
        resourceType: "MEDICINE",
        originalTranscript: params.originalTranscript || "",
        englishTranslation: params.englishTranslation || "",
        languageCode: params.languageCode || "kn",
        hospitalId: "hosp-001",
        hospitalName: "Outpatient Department, Ballari",
        departmentId: official.departmentId || "dept-pharmacy",
        departmentName: "Pharmacy and Medicine Availability",
        status: "Pending",
        otpVerified: true,
        notifications: [],
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      db.privateRequests.unshift(avReq);
    }

    // Realtime Supabase Sync (persists simultaneously to Supabase as authoritative store)
    try {
      await SupabaseSyncService.upsertComplaint(newComplaint);
      void SupabaseSyncService.insertNotification(deptNotif);
      void SupabaseSyncService.insertNotification(adminNotif);
    } catch (syncErr) {
      console.error("[DBService] Supabase persistence error in createComplaintInternal:", syncErr);
    }

    return newComplaint;
  }

  /**
   * Save a newly submitted complaint permanently to the database (atomic transaction)
   */
  static async createComplaint(params: {
    originalLanguage: string;
    languageCode: string;
    originalTranscript: string;
    englishTranslation: string;
    summary: string;
    category: string;
    department: string;
    priority?: "Low" | "Medium" | "High" | "Critical";
    location?: string;
    source?: SubmissionSource;
    medicineName?: string;
    citizenPhone?: string;
    citizenName?: string;
    isMedicineComplaint?: boolean;
    visibility?: "PUBLIC" | "PRIVATE";
    simulateDeptFailure?: boolean;
  }): Promise<ComplaintItem> {
    return this.runInTransaction(async (db) => {
      return this.createComplaintInternal(db, params);
    });
  }

  /**
   * Update complaint status, notes, or resolution evidence
   */
  static async updateComplaintStatus(
    complaintId: string,
    params: {
      status: any;
      actorName: string;
      actorRole: string;
      notes?: string;
      beforePhotoUrl?: string;
      afterPhotoUrl?: string;
    }
  ): Promise<ComplaintItem | null> {
    const db = this.ensureInitialized();
    const complaint = db.complaints.find(
      (c) => c.id === complaintId || c.complaintNumber === complaintId
    );

    if (!complaint) return null;

    const nowIso = new Date().toISOString();
    complaint.status = params.status;
    complaint.updatedAt = nowIso;

    if (params.notes) {
      complaint.resolutionNotes = params.notes;
    }

    if (params.status === "RESOLUTION_SUBMITTED") {
      complaint.resolvedAt = nowIso;
    } else if (params.status === "VERIFIED") {
      complaint.verifiedAt = nowIso;
    }

    if (params.beforePhotoUrl) {
      complaint.evidence.push({
        id: `evid-${Date.now()}-b`,
        type: "BEFORE",
        fileUrl: params.beforePhotoUrl,
        caption: "Site condition prior to corrective action",
        uploadedBy: params.actorName,
        uploadedAt: nowIso,
      });
    }

    if (params.afterPhotoUrl) {
      complaint.evidence.push({
        id: `evid-${Date.now()}-a`,
        type: "AFTER",
        fileUrl: params.afterPhotoUrl,
        caption: "Sanitized/repaired facility post-resolution",
        uploadedBy: params.actorName,
        uploadedAt: nowIso,
      });
    }

    complaint.events.push({
      id: `ev-${Date.now()}`,
      eventType: params.status,
      description:
        params.notes ||
        `Status updated to ${params.status.replace(/_/g, " ")} by ${params.actorName}`,
      performedBy: params.actorName,
      timestamp: nowIso,
    });

    // If medicine complaint is verified / resolved and has a citizen phone, dispatch SMS notification
    if (
      complaint.isMedicineComplaint &&
      complaint.citizenPhone &&
      (params.status === "VERIFIED" || params.status === "AVAILABLE" || params.status === "CLOSED" || params.status === "RESOLUTION_SUBMITTED")
    ) {
      try {
        const { NotificationService } = await import("./notification.service");
        await NotificationService.sendMedicineAvailabilityAlert({
          phone: complaint.citizenPhone,
          medicineName: complaint.medicineName || complaint.summary || "Prescribed Medicine",
          complaintId: complaint.complaintNumber || complaint.id,
          hospitalName: complaint.hospitalName,
        });
        complaint.events.push({
          id: `ev-${Date.now()}-sms`,
          eventType: "NOTIFICATION_SENT",
          description: `SMS availability notification sent to citizen at ${complaint.maskedCitizenPhone || complaint.citizenPhone}.`,
          performedBy: "Automated SMS Gateway",
          timestamp: nowIso,
        });
      } catch (smsErr) {
        console.warn("[updateComplaintStatus SMS trigger warning]", smsErr);
      }
    }

    this.writeData(db);

    // Sync status change to Supabase in real-time
    try {
      await SupabaseSyncService.upsertComplaint(complaint);
    } catch (syncErr) {
      console.warn("[DBService] Supabase update status sync warning:", syncErr);
    }

    return complaint;
  }

  /**
   * Get all registered officials
   */
  static async getOfficials(): Promise<OfficialUser[]> {
    const db = this.ensureInitialized();
    return db.officials;
  }

  /**
   * Find an official by email or ID
   */
  static async getOfficialByEmailOrId(query: string): Promise<OfficialUser | null> {
    const db = this.ensureInitialized();
    const q = query.trim().toLowerCase();
    return (
      db.officials.find(
        (o) =>
          o.email.toLowerCase() === q ||
          o.id === query ||
          (o.officialId && o.officialId.toLowerCase() === q)
      ) || null
    );
  }

  /**
   * Register a new official
   * Enforces security rule: Unauthorised user CANNOT register as Hospital Administrator!
   */
  static async registerOfficial(params: {
    name: string;
    officialId: string;
    email: string;
    password?: string;
    department: HospitalDepartment | string;
    designation: OfficialDesignation;
    hospital?: string;
    registeredByAdmin?: boolean;
  }): Promise<{ success: boolean; official?: OfficialUser; error?: string }> {
    const db = this.ensureInitialized();

    // Security Rule: Hospital Administrator accounts MUST NOT be self-registered
    if (params.designation === "Hospital Administrator" && !params.registeredByAdmin) {
      return {
        success: false,
        error:
          "Security Violation: Hospital Administrator accounts must be created or approved by an existing authorized administrator.",
      };
    }

    const emailNormalized = params.email.trim().toLowerCase();
    if (db.officials.some((o) => o.email.toLowerCase() === emailNormalized)) {
      return {
        success: false,
        error: "An official with this email address already exists.",
      };
    }

    const id = `off-${Date.now()}`;
    const newOfficial: OfficialUser = {
      id,
      name: params.name.trim(),
      officialId: params.officialId.trim().toUpperCase(),
      email: emailNormalized,
      password: params.password,
      departmentId: `dept-${params.department.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      departmentName: params.department,
      designation: params.designation,
      hospitalId: "hosp-001",
      hospitalName: params.hospital || "Outpatient Department, Ballari",
      role:
        params.designation === "Hospital Administrator"
          ? "ADMIN"
          : params.designation === "Department Supervisor"
          ? "SUPERVISOR"
          : "OFFICIAL",
      createdAt: new Date().toISOString(),
    };

    db.officials.push(newOfficial);
    this.writeData(db);

    return {
      success: true,
      official: newOfficial,
    };
  }

  // ========================================================
  // PILLAR 1: PRIVATE AVAILABILITY REQUESTS
  // ========================================================

  /**
   * Create a private availability request after phone OTP verification.
   * Strictly PRIVATE: Never exposed in public grievance listings!
   */
  static async createPrivateAvailabilityRequest(params: {
    verifiedPhoneNumber: string;
    requestedResource: string;
    resourceType?: "MEDICINE" | "BED" | "EQUIPMENT" | "SERVICE" | "FACILITY" | string;
    originalTranscript: string;
    englishTranslation: string;
    languageCode?: string;
    hospitalId?: string;
    hospitalName?: string;
    departmentId?: string;
    departmentName?: string;
  }): Promise<PrivateAvailabilityRequest> {
    const db = this.ensureInitialized();
    db.counterAv = (db.counterAv || 100) + 1;
    const year = new Date().getFullYear();
    const requestNumber = `JNS-${year}-AV-${String(db.counterAv).padStart(6, "0")}`;
    const id = `req-av-${Date.now()}-${db.counterAv}`;
    const nowIso = new Date().toISOString();

    const newRequest: PrivateAvailabilityRequest = {
      id,
      requestNumber,
      verifiedPhoneNumber: params.verifiedPhoneNumber.trim(),
      requestedResource: params.requestedResource.trim(),
      resourceType: params.resourceType || "MEDICINE",
      originalTranscript: params.originalTranscript,
      englishTranslation: params.englishTranslation,
      languageCode: params.languageCode || "kn",
      hospitalId: params.hospitalId || "hosp-001",
      hospitalName: params.hospitalName || "Outpatient Department, Ballari",
      departmentId: params.departmentId || "dept-pharmacy",
      departmentName: params.departmentName || "Pharmacy and Medicine Availability",
      status: "Pending",
      otpVerified: true,
      notifications: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.privateRequests.unshift(newRequest);
    this.writeData(db);

    // Sync private request to Supabase in real-time
    void SupabaseSyncService.upsertAvailabilityRequest(newRequest);

    return newRequest;
  }

  /**
   * Retrieve private availability requests (Internal official & admin access only)
   */
  static async getPrivateAvailabilityRequests(filter?: {
    departmentName?: string;
    status?: string;
    search?: string;
  }): Promise<PrivateAvailabilityRequest[]> {
    const db = this.ensureInitialized();
    let list = (db.privateRequests || []).map((r) => ({
      ...r,
      id: r.id || `req-${Math.random()}`,
      requestNumber: r.requestNumber || "JNS-2026-AV-UNKNOWN",
      requestedResource: r.requestedResource || "Requested Resource",
      resourceType: r.resourceType || "MEDICINE",
      departmentName: r.departmentName || "Pharmacy and Medicine Availability",
      hospitalName: r.hospitalName || "Outpatient Department, Ballari",
      status: r.status || "Pending",
      verifiedPhoneNumber: r.verifiedPhoneNumber || "",
      maskedPhone: r.maskedPhone || (r.verifiedPhoneNumber ? `XXXXXX${r.verifiedPhoneNumber.slice(-4)}` : ""),
      createdAt: r.createdAt || new Date().toISOString(),
      updatedAt: r.updatedAt || new Date().toISOString(),
    }));

    if (filter?.departmentName && filter.departmentName !== "All Departments") {
      const targetDept = normalizeDepartmentName(filter.departmentName);
      list = list.filter((r) => normalizeDepartmentName(r.departmentName) === targetDept);
    }

    if (filter?.status && filter.status !== "ALL") {
      list = list.filter((r) => (r.status || "").toLowerCase() === filter.status!.toLowerCase());
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (r) =>
          (r.requestNumber && r.requestNumber.toLowerCase().includes(q)) ||
          (r.requestedResource && r.requestedResource.toLowerCase().includes(q)) ||
          (r.verifiedPhoneNumber && r.verifiedPhoneNumber.includes(q)) ||
          (r.englishTranslation && r.englishTranslation.toLowerCase().includes(q))
      );
    }

    return list;
  }

  /**
   * Get a single private availability request by ID or requestNumber
   */
  static async getPrivateAvailabilityRequestById(id: string): Promise<PrivateAvailabilityRequest | null> {
    const db = this.ensureInitialized();
    return db.privateRequests?.find((r) => r.id === id || r.requestNumber === id) || null;
  }

  /**
   * Update availability status: Pending -> In Progress -> Available -> Notification Sent -> Closed
   * When updated to 'Available', dispatches notifications to verified citizen mobile numbers!
   */
  static async updatePrivateRequestStatus(
    requestId: string,
    params: {
      status: AvailabilityStatus;
      actorName: string;
    }
  ): Promise<{ request: PrivateAvailabilityRequest | null; notificationSent?: boolean }> {
    const db = this.ensureInitialized();
    const req = db.privateRequests?.find((r) => r.id === requestId || r.requestNumber === requestId);
    if (!req) return { request: null };

    const nowIso = new Date().toISOString();
    req.status = params.status;
    req.updatedAt = nowIso;

    let notificationSent = false;

    // When resource becomes AVAILABLE: trigger citizen notification alert
    if (params.status === "Available") {
      try {
        const { NotificationService } = await import("./notification.service");
        const notif = await NotificationService.sendResourceAvailabilityAlert({
          request: req,
          resourceName: req.requestedResource,
          hospitalName: req.hospitalName,
          departmentName: req.departmentName,
        });

        req.status = "Notification Sent";
        req.notifiedAt = nowIso;
        if (!req.notifications) req.notifications = [];
        req.notifications.push(notif);
        notificationSent = true;
      } catch (err) {
        console.error("[updatePrivateRequestStatus] Notification dispatch error:", err);
      }
    }

    this.writeData(db);
    return { request: req, notificationSent };
  }

  /**
   * Persist a notification log item
   */
  static async saveNotification(item: NotificationItem): Promise<void> {
    const db = this.ensureInitialized();
    if (!db.notifications) db.notifications = [];
    db.notifications.unshift(item);

    if (item.availabilityRequestId) {
      const req = db.privateRequests?.find((r) => r.id === item.availabilityRequestId);
      if (req) {
        if (!req.notifications) req.notifications = [];
        req.notifications.push(item);
      }
    }

    this.writeData(db);
  }

  /**
   * Retrieve notification logs filtered by department or recipient
   */
  static async getNotifications(filters?: { department?: string; recipientType?: string }): Promise<NotificationItem[]> {
    const db = this.ensureInitialized();
    let notifs = db.notifications || [];
    if (filters?.department && filters.department !== "ALL" && filters.department !== "All Departments") {
      const canonical = this.getCanonicalDepartmentName(filters.department);
      notifs = notifs.filter(
        (n) =>
          !n.departmentName ||
          n.departmentName === "ALL" ||
          n.departmentName === "All Departments" ||
          this.getCanonicalDepartmentName(n.departmentName) === canonical
      );
    }
    if (filters?.recipientType) {
      notifs = notifs.filter((n) => n.recipientType === filters.recipientType);
    }
    return notifs;
  }

  // ========================================================
  // PILLAR 2: REPEAT COMPLAINTS & FACILITY OBSERVATIONS
  // ========================================================

  /**
   * Detect if an active (unresolved) complaint exists for this facility / category
   */
  static async findActiveComplaintForCategory(params: {
    category: string;
    department?: string;
    hospitalId?: string;
    location?: string;
  }): Promise<ComplaintItem | null> {
    const db = this.ensureInitialized();
    const targetCat = params.category.trim().toLowerCase();
    const targetDept = normalizeDepartmentName(params.department);

    // Look for active complaints that are not CLOSED and not yet officially VERIFIED
    return (
      db.complaints.find((c) => {
        const isActive = c.status !== "CLOSED" && c.status !== "VERIFIED";
        const catMatch = c.category.toLowerCase() === targetCat;
        const deptMatch = targetDept ? normalizeDepartmentName(c.departmentName) === targetDept : false;
        return isActive && (catMatch || deptMatch);
      }) || null
    );
  }

  /**
   * Record a repeat citizen observation for an existing unresolved grievance
   */
  static async addComplaintObservation(params: {
    complaintId: string;
    observationType: ObservationType;
    response: string;
    durationSinceLastCleaning?: string;
    languageCode?: string;
    originalTranscript?: string;
    location?: string;
  }): Promise<{ complaint: ComplaintItem; observation: ComplaintObservation }> {
    const db = this.ensureInitialized();
    const complaint = db.complaints.find(
      (c) => c.id === params.complaintId || c.complaintNumber === params.complaintId
    );

    if (!complaint) {
      throw new Error(`Complaint ${params.complaintId} not found.`);
    }

    const nowIso = new Date().toISOString();
    const obsId = `obs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const observation: ComplaintObservation = {
      id: obsId,
      complaintId: complaint.id,
      complaintNumber: complaint.complaintNumber,
      observationType: params.observationType,
      response: params.response,
      durationSinceLastCleaning: params.durationSinceLastCleaning,
      languageCode: params.languageCode || "kn",
      originalTranscript: params.originalTranscript,
      location: params.location || complaint.wardOrLocation,
      createdAt: nowIso,
    };

    // Increment confirmation / recurrence counter
    complaint.recurrenceCount = (complaint.recurrenceCount || 1) + 1;
    complaint.latestObservationAt = nowIso;
    complaint.updatedAt = nowIso;

    if (!complaint.observations) complaint.observations = [];
    complaint.observations.unshift(observation);

    if (!db.observations) db.observations = [];
    db.observations.unshift(observation);

    // Record timeline audit event
    const eventDescription =
      params.observationType === "CLEAN_REPORTED"
        ? `Citizen reported facility is now clean. Status remains pending official supervisor verification.`
        : params.observationType === "WORSENED"
        ? `Citizen confirmation #${complaint.recurrenceCount}: Issue has worsened. Duration reported: ${params.durationSinceLastCleaning || "Unspecified"}.`
        : `Citizen confirmation #${complaint.recurrenceCount}: Issue still exists. Duration reported: ${params.durationSinceLastCleaning || "Unspecified"}.`;

    complaint.events.unshift({
      id: `ev-obs-${Date.now()}`,
      eventType: params.observationType === "CLEAN_REPORTED" ? "POSITIVE_OBSERVATION" : "REPEAT_CONFIRMATION",
      description: eventDescription,
      performedBy: "Citizen Voice Kiosk",
      timestamp: nowIso,
    });

    this.writeData(db);

    // Sync observation and updated complaint to Supabase in real-time
    try {
      void SupabaseSyncService.insertObservation(observation);
      await SupabaseSyncService.upsertComplaint(complaint);
    } catch (syncErr) {
      console.warn("[DBService] Supabase observation sync warning:", syncErr);
    }

    return { complaint, observation };
  }

  // ========================================================
  // PILLAR 3: FAST & IDEMPOTENT COMPLAINT SUBMISSION
  // ========================================================

  /**
   * Creates a complaint with idempotency protection and atomic transaction.
   * If the exact same idempotencyKey is submitted again, returns the existing record without generating a new ID.
   */
  static async createComplaintWithIdempotency(params: {
    idempotencyKey?: string;
    originalTranscript: string;
    originalLanguage: string;
    languageCode: string;
    englishTranslation: string;
    summary: string;
    category: string;
    department: string;
    priority?: "Low" | "Medium" | "High" | "Critical";
    location?: string;
    source?: SubmissionSource;
    medicineName?: string;
    citizenPhone?: string;
    citizenName?: string;
    isMedicineComplaint?: boolean;
    visibility?: "PUBLIC" | "PRIVATE";
    simulateDeptFailure?: boolean;
  }): Promise<{ complaint: ComplaintItem; isDuplicate: boolean }> {
    // 0. Check Supabase authoritative store for idempotency in serverless/distributed environments
    if (params.idempotencyKey) {
      try {
        const existingInSupabase = await SupabaseSyncService.getComplaintByIdempotencyKey(params.idempotencyKey);
        if (existingInSupabase) {
          return { complaint: existingInSupabase, isDuplicate: true };
        }
      } catch (err) {
        console.warn("[DBService] Supabase idempotency check fallback:", err);
      }
    }

    return this.runInTransaction(async (db) => {
      // 1. Check local db idempotency key if provided
      if (params.idempotencyKey) {
        if (!db.submissions) db.submissions = [];
        const existingSub = db.submissions.find((s) => s.idempotencyKey === params.idempotencyKey);
        if (existingSub) {
          const existingComp = (db.complaints || []).find(
            (c) => c.id === existingSub.complaintId || c.complaintNumber === existingSub.complaintId
          );
          if (existingComp) {
            return { complaint: existingComp, isDuplicate: true };
          }
        }
      }

      // 2. Create the complaint atomically
      const newComplaint = await this.createComplaintInternal(db, params);

      // 3. Record idempotency entry
      if (params.idempotencyKey) {
        db.submissions.push({
          idempotencyKey: params.idempotencyKey,
          complaintId: newComplaint.id,
          createdAt: newComplaint.createdAt,
        });
      }

      // 4. Send acknowledgment SMS if medicine complaint with registered mobile
      if (newComplaint.isMedicineComplaint && newComplaint.citizenPhone) {
        try {
          const { NotificationService } = await import("./notification.service");
          void NotificationService.sendMedicineRegistrationAck({
            phone: newComplaint.citizenPhone,
            medicineName: newComplaint.medicineName || newComplaint.summary || "Prescribed Medicine",
            complaintId: newComplaint.complaintNumber || newComplaint.id,
            hospitalName: newComplaint.hospitalName,
          });
        } catch (smsErr) {
          console.warn("[Registration Ack SMS warning]", smsErr);
        }
      }

      return { complaint: newComplaint, isDuplicate: false };
    });
  }

  /**
   * Retries a failed department notification and updates delivery tracking.
   */
  static async retryFailedNotification(complaintIdOrNumber: string): Promise<{ success: boolean; complaint?: ComplaintItem }> {
    return this.runInTransaction((db) => {
      const complaint = (db.complaints || []).find(
        (c) => c.id === complaintIdOrNumber || c.complaintNumber === complaintIdOrNumber || c.ticketNumber === complaintIdOrNumber
      );
      if (!complaint) return { success: false };

      const nowIso = new Date().toISOString();
      if (!complaint.deliveryTracking) {
        complaint.deliveryTracking = {
          adminPortal: { status: "DELIVERED", updatedAt: nowIso, deliveredAt: nowIso, attempts: 1 },
          departmentPortal: { status: "DELIVERED", updatedAt: nowIso, deliveredAt: nowIso, attempts: 2 },
          externalGovPortal: { status: "NOT_CONFIGURED", updatedAt: nowIso, attempts: 0 },
        };
      } else {
        complaint.deliveryTracking.departmentPortal = {
          status: "DELIVERED",
          updatedAt: nowIso,
          deliveredAt: nowIso,
          attempts: (complaint.deliveryTracking.departmentPortal.attempts || 1) + 1,
        };
      }

      // Update matching notification in db.notifications
      const notif = (db.notifications || []).find(
        (n) => (n.availabilityRequestId === complaint.id || n.message.includes(complaint.complaintNumber || "")) && n.recipientType === "OFFICIAL"
      );
      if (notif) {
        notif.deliveryStatus = "DELIVERED";
        notif.sentAt = nowIso;
        void SupabaseSyncService.insertNotification(notif);
      }

      void SupabaseSyncService.upsertComplaint(complaint);

      return { success: true, complaint };
    });
  }
}
