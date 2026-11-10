import { env, isDemoMode } from "@/lib/config/env";
import { ComplaintCategory, Priority } from "@/types";

export interface AIClassificationResult {
  category: ComplaintCategory;
  departmentCode: string;
  departmentName: string;
  suggestedPriority: Priority;
  summary: string;
  isUrgent: boolean;
  confidenceScore: number;
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  confidence: number;
  existingComplaintId?: string;
  existingTicketNumber?: string;
  existingSummary?: string;
  matchingLocation?: string;
  currentStatus?: string;
}

export class AIService {
  /**
   * Classifies a complaint text (in English or translated) into appropriate category,
   * department, priority, and generates a concise executive summary.
   */
  static async classifyComplaint(text: string, location?: string): Promise<AIClassificationResult> {
    // If live API key is configured, we can call external model
    if (!isDemoMode && env.AI_API_KEY) {
      try {
        const response = await fetch(`${env.AI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai"}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.AI_API_KEY}`,
          },
          body: JSON.stringify({
            model: env.AI_MODEL,
            messages: [
              {
                role: "system",
                content: `You are an AI triaging assistant for Indian Government Hospital Grievances (JANASUVIDHA). 
Analyze the complaint and return valid JSON with:
{
  "category": "HYGIENE_SANITATION" | "WATER_FACILITIES" | "MEDICINE_AVAILABILITY" | "BED_AVAILABILITY" | "STAFF_SERVICE" | "INFRASTRUCTURE" | "OTHER",
  "departmentCode": "HYG" | "WAT" | "MED" | "BED" | "INF" | "STF",
  "departmentName": string,
  "suggestedPriority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "summary": string (max 80 chars),
  "isUrgent": boolean,
  "confidenceScore": number (0.0 - 1.0)
}`,
              },
              { role: "user", content: `Complaint: "${text}". Location: "${location || 'Not specified'}"` },
            ],
            response_format: { type: "json_object" },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const parsed = JSON.parse(data.choices[0].message.content);
          return {
            category: parsed.category,
            departmentCode: parsed.departmentCode,
            departmentName: parsed.departmentName,
            suggestedPriority: parsed.suggestedPriority,
            summary: parsed.summary,
            isUrgent: Boolean(parsed.isUrgent),
            confidenceScore: parsed.confidenceScore || 0.95,
          };
        }
      } catch (err) {
        console.warn("AI API live call failed, falling back to intelligent rule-based engine:", err);
      }
    }

    // High accuracy fallback engine tuned for Indian hospital complaints
    const lower = text.toLowerCase();
    
    // Hygiene & Sanitation
    if (
      lower.includes("toilet") ||
      lower.includes("washroom") ||
      lower.includes("bathroom") ||
      lower.includes("clean") ||
      lower.includes("dirty") ||
      lower.includes("smell") ||
      lower.includes("odour") ||
      lower.includes("garbage") ||
      lower.includes("waste") ||
      lower.includes("flush") ||
      lower.includes("urine") ||
      lower.includes("mosquito")
    ) {
      return {
        category: "HYGIENE_SANITATION",
        departmentCode: "HYG",
        departmentName: "Hygiene & Sanitation",
        suggestedPriority: lower.includes("overflow") || lower.includes("stagnant") ? "HIGH" : "MEDIUM",
        summary: "Sanitation and cleanliness issue reported in hospital facility",
        isUrgent: false,
        confidenceScore: 0.94,
      };
    }

    // Water & Facilities
    if (
      lower.includes("water") ||
      lower.includes("drinking") ||
      lower.includes("cooler") ||
      lower.includes("tap") ||
      lower.includes("leak") ||
      lower.includes("filter") ||
      lower.includes("pipeline")
    ) {
      return {
        category: "WATER_FACILITIES",
        departmentCode: "WAT",
        departmentName: "Water & Facilities",
        suggestedPriority: lower.includes("drinking") ? "HIGH" : "MEDIUM",
        summary: "Drinking water or plumbing system failure",
        isUrgent: false,
        confidenceScore: 0.92,
      };
    }

    // Medicine Availability
    if (
      lower.includes("medicine") ||
      lower.includes("tablet") ||
      lower.includes("injection") ||
      lower.includes("pharmacy") ||
      lower.includes("drug") ||
      lower.includes("insulin") ||
      lower.includes("metformin") ||
      lower.includes("out of stock") ||
      lower.includes("chemist")
    ) {
      return {
        category: "MEDICINE_AVAILABILITY",
        departmentCode: "MED",
        departmentName: "Pharmacy & Medicine Availability",
        suggestedPriority: lower.includes("insulin") || lower.includes("emergency") || lower.includes("injection") ? "CRITICAL" : "HIGH",
        summary: "Crucial medicine or pharmacy supply stock unavailability",
        isUrgent: true,
        confidenceScore: 0.96,
      };
    }

    // Bed Availability
    if (
      lower.includes("bed") ||
      lower.includes("icu") ||
      lower.includes("ward") ||
      lower.includes("stretcher") ||
      lower.includes("wheelchair") ||
      lower.includes("admission") ||
      lower.includes("ventilator")
    ) {
      return {
        category: "BED_AVAILABILITY",
        departmentCode: "BED",
        departmentName: "Bed Management & Admissions",
        suggestedPriority: lower.includes("icu") || lower.includes("ventilator") ? "CRITICAL" : "HIGH",
        summary: "Patient bed or mobility equipment shortage",
        isUrgent: true,
        confidenceScore: 0.91,
      };
    }

    // Infrastructure
    if (
      lower.includes("light") ||
      lower.includes("fan") ||
      lower.includes("lift") ||
      lower.includes("elevator") ||
      lower.includes("switch") ||
      lower.includes("ramp") ||
      lower.includes("broken") ||
      lower.includes("generator")
    ) {
      return {
        category: "INFRASTRUCTURE",
        departmentCode: "INF",
        departmentName: "Infrastructure Maintenance",
        suggestedPriority: lower.includes("lift") ? "HIGH" : "MEDIUM",
        summary: "Electrical or structural facility defect",
        isUrgent: false,
        confidenceScore: 0.89,
      };
    }

    // Staff & Service
    if (
      lower.includes("staff") ||
      lower.includes("nurse") ||
      lower.includes("doctor") ||
      lower.includes("counter") ||
      lower.includes("queue") ||
      lower.includes("behavior") ||
      lower.includes("delay") ||
      lower.includes("rude")
    ) {
      return {
        category: "STAFF_SERVICE",
        departmentCode: "STF",
        departmentName: "Staff & Service Quality",
        suggestedPriority: "MEDIUM",
        summary: "Staff assistance or counter service delay",
        isUrgent: false,
        confidenceScore: 0.88,
      };
    }

    return {
      category: "OTHER",
      departmentCode: "INF",
      departmentName: "Hospital Service Coordinator",
      suggestedPriority: "MEDIUM",
      summary: text.slice(0, 60) + "...",
      isUrgent: false,
      confidenceScore: 0.75,
    };
  }

  /**
   * Scans existing complaints in the area and category to detect duplicates.
   */
  static detectDuplicate(
    newText: string,
    newLocation: string,
    existingComplaints: Array<{ id: string; ticketNumber: string; summary: string; wardOrLocation: string; status: string }>
  ): DuplicateDetectionResult {
    const normLocation = newLocation.toLowerCase().trim();
    const normText = newText.toLowerCase().trim();

    for (const comp of existingComplaints) {
      if (comp.status === "VERIFIED" || comp.status === "CLOSED") continue;

      const compLoc = comp.wardOrLocation.toLowerCase();
      const compSum = comp.summary.toLowerCase();

      // Check if location overlaps significantly
      const locationMatch =
        (normLocation && compLoc.includes(normLocation)) ||
        (compLoc && normLocation.includes(compLoc)) ||
        (normLocation.includes("opd") && compLoc.includes("opd")) ||
        (normLocation.includes("washroom") && compLoc.includes("washroom")) ||
        (normLocation.includes("maternity") && compLoc.includes("maternity"));

      // Check if topic keywords overlap
      const words = normText.split(/\s+/).filter((w) => w.length > 3);
      const matchedWords = words.filter((w) => compSum.includes(w));
      const wordSimilarity = words.length > 0 ? matchedWords.length / words.length : 0;

      if (locationMatch && (wordSimilarity > 0.25 || normText.includes("toilet") || normText.includes("water"))) {
        return {
          isDuplicate: true,
          confidence: 0.88,
          existingComplaintId: comp.id,
          existingTicketNumber: comp.ticketNumber,
          existingSummary: comp.summary,
          matchingLocation: comp.wardOrLocation,
          currentStatus: comp.status,
        };
      }
    }

    return {
      isDuplicate: false,
      confidence: 0.95,
    };
  }
}

