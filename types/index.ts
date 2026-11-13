export type Language = "en" | "kn" | "hi" | "te" | "ta" | "ml" | string;

export interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "kn", label: "Kannada", nativeLabel: "ಕನ್ನಡ" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்" },
  { code: "ml", label: "Malayalam", nativeLabel: "മലയാളം" },
];

export const HOSPITAL_DEPARTMENTS = [
  "Hygiene and Sanitation",
  "Water and Facilities",
  "Pharmacy and Medicine Availability",
  "Bed Management",
  "Infrastructure Maintenance",
  "Hospital Services",
] as const;

export type HospitalDepartment = (typeof HOSPITAL_DEPARTMENTS)[number];

export const OFFICIAL_DESIGNATIONS = [
  "Department Officer",
  "Department Supervisor",
  "Hospital Administrator",
] as const;

export type OfficialDesignation = (typeof OFFICIAL_DESIGNATIONS)[number] | string;

export type ComplaintCategory =
  | "Hygiene and Sanitation"
  | "Water and Facilities"
  | "Pharmacy and Medicine Availability"
  | "Bed Management"
  | "Infrastructure Maintenance"
  | "Hospital Services"
  | "HYGIENE_SANITATION"
  | "WATER_FACILITIES"
  | "MEDICINE_AVAILABILITY"
  | "BED_AVAILABILITY"
  | "STAFF_SERVICE"
  | "INFRASTRUCTURE"
  | "OTHER"
  | "Other";

export type ComplaintStatus =
  | "PENDING"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLUTION_SUBMITTED"
  | "VERIFIED"
  | "REOPENED"
  | "ESCALATED"
  | "CLOSED";

export type Priority = "Low" | "Medium" | "High" | "Critical" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type DeliveryState =
  | "CREATED"
  | "QUEUED"
  | "DELIVERED"
  | "ACKNOWLEDGED"
  | "FAILED"
  | "RETRYING"
  | "NOT_CONFIGURED";

export interface DestinationDelivery {
  status: DeliveryState;
  updatedAt: string;
  attempts?: number;
  lastError?: string;
  deliveredAt?: string;
}

export interface ComplaintDeliveryTracking {
  adminPortal: DestinationDelivery;
  departmentPortal: DestinationDelivery;
  externalGovPortal: DestinationDelivery;
}

export type Visibility = "PUBLIC" | "PRIVATE";

export type SubmissionSource =
  | "VOICE_KIOSK"
  | "QR_PORTAL"
  | "CITIZEN_WEB"
  | "PHONE_IVR"
  | "kiosk"
  | "ivr";

export interface CallLogItem {
  id?: string;
  callSid?: string;
  conversationId?: string;
  callerNumber?: string;
  toNumber?: string;
  agentId?: string;
  complaintId?: string | null;
  transcript?: string;
  recordingUrl?: string;
  duration?: number;
  status?: "in_progress" | "completed" | "failed" | "cancelled" | string;
  callMetadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface EvidenceItem {
  id: string;
  type: "BEFORE" | "AFTER" | "VERIFICATION_INSPECTION" | string;
  fileUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ComplaintEventItem {
  id: string;
  eventType: string;
  description: string;
  performedBy?: string;
  actorName?: string;
  actorRole?: string;
  timestamp?: string;
  createdAt?: string;
}

export interface FeedbackItem {
  id: string;
  rating: number;
  comment?: string;
  isResolved: boolean;
  createdAt: string;
}

export interface ComplaintReceipt {
  complaintNumber: string; // JNS-2026-000124
  complaintText: string;
  originalLanguage: string;
  hospitalName: string;
  location: string;
  submissionDate: string; // Asia/Kolkata formatted date
  submissionTime: string; // Asia/Kolkata formatted time
  timeZone: string; // Asia/Kolkata (IST, UTC+05:30)
  category: string;
  forwardedTo: string;
  responsibleAuthority: string;
  status: string;
}

export interface ComplaintItem {
  id: string;
  complaintNumber?: string; // JNS-2026-000124
  ticketNumber?: string;
  hospitalId: string;
  hospitalName: string;
  departmentId?: string;
  departmentName?: string;
  category: ComplaintCategory;
  visibility: Visibility;
  source: SubmissionSource;
  
  originalLanguage: string;
  languageCode?: string;
  originalTranscript: string;
  englishTranslation?: string;
  translatedText?: string;
  summary: string;
  
  wardOrLocation: string;
  location?: string;
  floorOrBlock?: string;
  
  status: ComplaintStatus;
  priority: Priority;
  maskedCitizenPhone?: string;
  citizenPhone?: string;
  customerPhone?: string;
  citizenName?: string;
  customerName?: string;
  description?: string;
  medicineName?: string;
  isMedicineComplaint?: boolean;
  
  assignedOfficialId?: string;
  assignedOfficialName?: string;
  assignedOfficialDesignation?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  verifiedAt?: string;
  
  recurrenceCount?: number;
  observations?: ComplaintObservation[];
  idempotencyKey?: string;
  latestObservationAt?: string;
  observationSummary?: string;

  events: ComplaintEventItem[];
  evidence: EvidenceItem[];
  feedbacks?: FeedbackItem[];
  receipt?: ComplaintReceipt;
  deliveryTracking?: ComplaintDeliveryTracking;
  
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type AvailabilityStatus =
  | "Pending"
  | "In Progress"
  | "Available"
  | "Notification Sent"
  | "Closed"
  | "PENDING"
  | "IN_PROGRESS"
  | "AVAILABLE"
  | "NOTIFICATION_SENT"
  | "CLOSED";

export interface PrivateAvailabilityRequest {
  id: string;
  requestNumber: string; // e.g. JNS-2026-AV-000124
  requestId?: string; // alias
  verifiedPhoneNumber: string;
  phone?: string; // alias
  maskedPhone?: string;
  requestedResource: string;
  resourceName?: string; // alias
  resourceType: "MEDICINE" | "BED" | "EQUIPMENT" | "SERVICE" | "FACILITY" | string;
  originalTranscript: string;
  englishTranslation: string;
  languageCode: string;
  hospitalId: string;
  hospitalName: string;
  departmentId?: string;
  departmentName: string;
  status: AvailabilityStatus;
  otpVerified: boolean;
  notifiedAt?: string;
  notifications?: NotificationItem[];
  createdAt: string;
  updatedAt: string;
}

export type ObservationType =
  | "UNCLEAN_CONFIRMED"
  | "CLEAN_REPORTED"
  | "WORSENED"
  | "RETURNED"
  | "UNSURE";

export interface ComplaintObservation {
  id: string;
  complaintId: string;
  complaintNumber?: string;
  observationType: ObservationType;
  response: string;
  durationSinceLastCleaning?: string; // e.g. "Less than an hour", "A few hours", "Since morning"
  reportedDuration?: string;
  languageCode: string;
  originalTranscript?: string;
  transcript?: string;
  location: string;
  observedAt?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  availabilityRequestId?: string;
  recipient: string;
  message: string;
  provider: "mock" | "twilio";
  deliveryStatus: "SIMULATED" | "DELIVERED" | "SENT" | "FAILED";
  sentAt: string;
  departmentName?: string;
  recipientType?: "OFFICIAL" | "ADMIN" | "CITIZEN" | string;
}

export interface GeminiProcessResult {
  unclear: boolean;
  unclearReason?: string;
  isGrievance?: boolean;
  isOffTopic?: boolean;
  requestType?: "PUBLIC_GRIEVANCE" | "PRIVATE_AVAILABILITY" | "LANGUAGE_SWITCH" | "OFF_TOPIC" | "GENERAL_QUERY" | string;
  requestedResource?: string;
  detectedLanguage: string;
  languageCode: string;
  originalTranscript: string;
  englishTranslation: string;
  complaintSummary: string;
  category: string;
  department: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  confidence: number;
  spokenConfirmation: string;
}

export interface DepartmentInfo {
  id: string;
  code: string;
  name: string;
  category: ComplaintCategory;
  description: string;
  headName: string;
  activeOfficialsCount: number;
  openComplaintsCount: number;
  resolvedCount: number;
  avgResolutionHours: number;
}

export interface OfficialUser {
  id: string;
  name: string;
  officialId?: string;
  email: string;
  phone?: string;
  badgeNumber?: string;
  password?: string;
  departmentId: string;
  departmentName: string;
  designation: OfficialDesignation;
  hospitalId?: string;
  hospitalName?: string;
  role?: "OFFICIAL" | "SUPERVISOR" | "ADMIN";
  isSupervisor?: boolean;
  avatarUrl?: string;
  createdAt?: string;
}

