import {
  ComplaintCategory,
  ComplaintItem,
  ComplaintStatus,
  Language,
  SubmissionSource,
  Visibility,
} from "@/types";
import { DBService } from "./db.service";
import { AIService } from "./ai.service";
import { TranslationService } from "./translation.service";
import { routeComplaintDepartment } from "@/lib/config/routing";

export interface CreateComplaintDTO {
  idempotencyKey?: string;
  transcript: string;
  originalLanguage?: string;
  languageCode?: string;
  englishTranslation?: string;
  summary?: string;
  category?: string;
  department?: string;
  priority?: "Low" | "Medium" | "High" | "Critical";
  location?: string;
  floor?: string;
  visibility?: Visibility;
  source?: SubmissionSource;
  citizenPhone?: string;
  citizenName?: string;
  medicineName?: string;
  isMedicineComplaint?: boolean;
  language?: Language;
}

export class ComplaintService {
  /**
   * Retrieves complaints with optional department security filtering
   */
  static async getComplaints(filter?: {
    officialDepartment?: string;
    designation?: string;
    visibility?: Visibility;
    departmentId?: string;
    status?: ComplaintStatus;
    category?: ComplaintCategory;
    search?: string;
    onlyMedicine?: boolean;
    excludePrivateMedicine?: boolean;
  }): Promise<ComplaintItem[]> {
    return DBService.getComplaints({
      officialDepartment: filter?.officialDepartment,
      designation: filter?.designation,
      category: filter?.category,
      status: filter?.status,
      search: filter?.search,
      visibility: filter?.visibility,
      onlyMedicine: filter?.onlyMedicine,
      excludePrivateMedicine: filter?.excludePrivateMedicine,
    });
  }

  /**
   * Finds a single complaint by complaint number or UUID
   */
  static async getComplaintByTicketOrId(ticketOrId: string): Promise<ComplaintItem | null> {
    return DBService.getComplaintById(ticketOrId);
  }

  /**
   * Registers a new complaint permanently into the database with receipt generation
   */
  static async createComplaint(dto: CreateComplaintDTO): Promise<{
    complaint: ComplaintItem;
    isDuplicateDetected: boolean;
    duplicateInfo?: any;
  }> {
    let originalLanguage = dto.originalLanguage;
    let languageCode = dto.languageCode || dto.language;
    let englishTranslation = dto.englishTranslation;
    let summary = dto.summary;
    let category = dto.category;
    let department = dto.department;
    let priority = dto.priority || "Medium";

    // If translation or triage wasn't provided, process now
    if (!englishTranslation || !summary || !department) {
      const lang = (languageCode as Language) || TranslationService.detectLanguage(dto.transcript);
      languageCode = lang;
      originalLanguage = lang === "kn" ? "Kannada" : lang === "hi" ? "Hindi" : "English";

      const tr = await TranslationService.translateToEnglish(dto.transcript, lang);
      englishTranslation = tr.translatedText;

      const ai = await AIService.classifyComplaint(englishTranslation, dto.location || "Hospital");
      summary = ai.summary;
      category = ai.category;
      department = ai.departmentName;
      priority = (ai.suggestedPriority as any) || "Medium";
    }

    // Centrally resolve designated department and category based on keywords
    const routed = routeComplaintDepartment({
      category,
      department,
      transcript: dto.transcript,
      summary,
      text: englishTranslation,
    });

    category = dto.isMedicineComplaint ? "Pharmacy and Medicine Availability" : routed.category;
    department = dto.isMedicineComplaint ? "Pharmacy and Medicine Availability" : routed.name;

    const result = await DBService.createComplaintWithIdempotency({
      idempotencyKey: dto.idempotencyKey,
      originalLanguage: originalLanguage || "Kannada",
      languageCode: languageCode || "kn",
      originalTranscript: dto.transcript,
      englishTranslation: englishTranslation || dto.transcript,
      summary: summary || "Hospital grievance",
      category,
      department,
      priority: priority,
      location: dto.location || "Outpatient Department, Ballari - Kiosk #1",
      source: dto.source || "VOICE_KIOSK",
      medicineName: dto.medicineName,
      citizenPhone: dto.citizenPhone,
      citizenName: dto.citizenName,
      isMedicineComplaint: dto.isMedicineComplaint,
      visibility: dto.visibility,
    });

    return {
      complaint: result.complaint,
      isDuplicateDetected: result.isDuplicate,
    };
  }

  /**
   * Updates complaint status through the official & supervisor lifecycle
   */
  static async updateStatus(
    complaintId: string,
    newStatus: ComplaintStatus,
    actorName: string,
    actorRole: string,
    notes?: string,
    evidenceUrls?: { beforeUrl?: string; afterUrl?: string }
  ): Promise<ComplaintItem | null> {
    return DBService.updateComplaintStatus(complaintId, {
      status: newStatus,
      actorName,
      actorRole,
      notes,
      beforePhotoUrl: evidenceUrls?.beforeUrl,
      afterPhotoUrl: evidenceUrls?.afterUrl,
    });
  }

  /**
   * Increases recurrence count when another citizen confirms an existing issue
   */
  static async upvoteRecurrence(ticketNumber: string): Promise<ComplaintItem | null> {
    const complaint = await DBService.getComplaintById(ticketNumber);
    if (!complaint) return null;
    complaint.recurrenceCount = (complaint.recurrenceCount || 1) + 1;
    return complaint;
  }

  /**
   * Adds citizen satisfaction feedback
   */
  static async addFeedback(
    complaintId: string,
    rating: number,
    comment?: string,
    isResolved: boolean = true
  ): Promise<ComplaintItem | null> {
    const complaint = await DBService.getComplaintById(complaintId);
    if (!complaint) return null;
    if (!complaint.feedbacks) complaint.feedbacks = [];
    complaint.feedbacks.push({
      id: `fb-${Date.now()}`,
      rating,
      comment,
      isResolved,
      createdAt: new Date().toISOString(),
    });
    return complaint;
  }
}
