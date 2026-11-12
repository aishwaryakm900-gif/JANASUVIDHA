import { ComplaintCategory, DeliveryState } from "@/types";

export interface DepartmentConfig {
  id: string;
  name: string;
  code: string;
  category: string;
  officialName: string;
  officialDesignation: string;
  officialEmail: string;
  slaHours: number;
  keywords: string[];
}

export const CENTRAL_DEPARTMENTS: Record<string, DepartmentConfig> = {
  PHARMACY: {
    id: "dept-pharmacy",
    name: "Pharmacy and Medicine Availability",
    code: "MED",
    category: "Pharmacy and Medicine Availability",
    officialName: "Kavitha Raman",
    officialDesignation: "Chief Pharmacist",
    officialEmail: "pharmacy.ballari@janasuvidha.gov.in",
    slaHours: 2,
    keywords: [
      "medicine", "tablet", "drug", "injection", "syrup", "paracetamol",
      "antibiotic", "insulin", "shortage", "unavailable", "stock", "pharmacy",
      "dispensary", "prescription", "chemist", "expired", "expiry",
      "ಔಷಧಿ", "ಮಾತ್ರೆ", "ಔಷಧಾಲಯ", "ಇಂಜೆಕ್ಷನ್", "ಮದ್ದು", "ಅಲಭ್ಯ", "ಸ್ಟಾಕ್", "ದವಾ",
      "दवा", "गोली", "इंजेक्शन", "फार्मेसी", "उपलब्ध", "औषध", "एक्सपायरी",
      "మందు", "టాబ్లెట్", "ఔషధ", "மருந்து", "மாத்திரை", "മരുന്ന്", "കുത്തിവയ്പ്പ്"
    ],
  },
  SANITATION: {
    id: "dept-hygiene",
    name: "Hygiene and Sanitation",
    code: "HYG",
    category: "Hygiene and Sanitation",
    officialName: "Manjunath Patil",
    officialDesignation: "Sanitary Superintendent",
    officialEmail: "sanitation.ballari@janasuvidha.gov.in",
    slaHours: 4,
    keywords: [
      "clean", "dirty", "smell", "odor", "toilet", "washroom", "bathroom",
      "garbage", "waste", "trash", "dustbin", "blood", "vomit", "stain",
      "unhygienic", "pest", "cockroach", "mosquito", "dog", "sanitation",
      "ಸ್ವಚ್ಛತೆ", "ಗಲೀಜು", "ಶೌಚಾಲಯ", "ವಾಸನೆ", "ಕಸ", "ತಿಪ್ಪೆ", "ಹುಳು", "ಸೊಳ್ಳೆ", "ನಾಯಿ",
      "गंदगी", "सफाई", "शौचालय", "बदबू", "कचरा", "धूल", "मच्छर", "कीड़े", "टॉयलेट",
      "పరిశుభ్రత", "మురికి", "టాయిలెట్", "துப்புரவு", "அழுக்கு", "கழிப்பறை", "ശുചിത്വം", "അഴുക്ക്"
    ],
  },
  WATER_FACILITIES: {
    id: "dept-water",
    name: "Water and Facilities",
    code: "WAT",
    category: "Water and Facilities",
    officialName: "Er. Ramesh Naik",
    officialDesignation: "Assistant Executive Engineer (Water & Facilities)",
    officialEmail: "water.ballari@janasuvidha.gov.in",
    slaHours: 4,
    keywords: [
      "water", "drinking water", "tap", "leakage", "pipe", "overflow",
      "tank", "filter", "ro plant", "cooler", "plumbing", "washbasin", "drainage",
      "ನೀರು", "ಕುಡಿಯುವ ನೀರು", "ನಲ್ಲಿ", "ಸೋರಿಕೆ", "ಪೈಪ್", "ಟ್ಯಾಂಕ್", "ಫಿಲ್ಟರ್", "ಚರಂಡಿ",
      "पानी", "पीने का पानी", "नल", "रिसाव", "पाइप", "टंकी", "कूलर", "नाली",
      "నీరు", "మంచినీరు", "నల్లా", "లీకేజీ", "தண்ணீர்", "குடிநீர்", "குழாய்", "വെള്ളം", "ടാപ്പ്"
    ],
  },
  EQUIPMENT_MAINTENANCE: {
    id: "dept-equipment",
    name: "Medical Equipment / Maintenance",
    code: "EQP",
    category: "Infrastructure Maintenance",
    officialName: "Dr. Prabhakar Rao",
    officialDesignation: "Biomedical Engineer & Facilities In-charge",
    officialEmail: "equipment.ballari@janasuvidha.gov.in",
    slaHours: 6,
    keywords: [
      "equipment", "machine", "ventilator", "monitor", "ecg", "xray", "x-ray",
      "scan", "mri", "wheelchair", "stretcher", "trolley", "bed", "lift", "elevator",
      "generator", "power", "electricity", "fan", "light", "socket", "broken",
      "ಯಂತ್ರ", "ಉಪಕರಣ", "ಗಾಲಿಕುರ್ಚಿ", "ಸ್ಟ್ರೆಚರ್", "ಲಿಫ್ಟ್", "ವಿದ್ಯುತ್", "ಫ್ಯಾನ್", "ಮುರಿದ",
      "उपकरण", "मशीन", "वेंटिलेटर", "व्हीलचेयर", "स्ट्रेचर", "लिफ्ट", "बिजली", "पंखा", "खराब",
      "పరికరాలు", "మిషన్", "சாதனம்", "இயந்திரம்", "ഉപകരണം", "സ്ട്രെച്ചർ"
    ],
  },
  ADMINISTRATION: {
    id: "dept-admin",
    name: "Hospital Administration",
    code: "ADM",
    category: "Hospital Services",
    officialName: "Dr. B. K. Shivakumar",
    officialDesignation: "Deputy Medical Superintendent",
    officialEmail: "admin.ballari@janasuvidha.gov.in",
    slaHours: 8,
    keywords: [
      "negligence", "doctor", "nurse", "staff", "attendant", "security",
      "rude", "misbehavior", "absent", "delayed", "bribe", "money", "corruption",
      "queue", "crowd", "counter", "token", "billing", "reception", "complaint",
      "ಅಲಕ್ಷ್ಯ", "ವೈದ್ಯ", "ಡಾಕ್ಟರ್", "ನರ್ಸ್", "ಸಿಬ್ಬಂದಿ", "ಲಂಚ", "ವರ್ತನೆ", "ವಿಳಂಬ", "ಸರತಿ",
      "लापरवाही", "डॉक्टर", "नर्स", "स्टाफ", "रिश्वत", "दुर्व्यवहार", "अनुपस्थित", "कतार",
      "నిర్లక్ష్యం", "డాక్టర్", "ஊழல்", "மருத்துவர்", "അനാസ്ഥ", "ഡോക്ടർ"
    ],
  },
};

/**
 * Centrally route any grievance to its designated hospital department.
 * Inspects category, explicit department, and text/transcript/summary keywords.
 */
export function routeComplaintDepartment(input: {
  category?: string;
  department?: string;
  text?: string;
  transcript?: string;
  summary?: string;
}): DepartmentConfig {
  const combinedText = [
    input.department || "",
    input.category || "",
    input.summary || "",
    input.transcript || "",
    input.text || "",
  ]
    .join(" ")
    .toLowerCase();

  // 1. Check Medicine / Pharmacy
  if (
    combinedText.includes("pharmacy") ||
    combinedText.includes("medicine") ||
    CENTRAL_DEPARTMENTS.PHARMACY.keywords.some((kw) => combinedText.includes(kw.toLowerCase()))
  ) {
    return CENTRAL_DEPARTMENTS.PHARMACY;
  }

  // 2. Check Water & Facilities
  if (
    combinedText.includes("water") ||
    combinedText.includes("drinking water") ||
    CENTRAL_DEPARTMENTS.WATER_FACILITIES.keywords.some((kw) => combinedText.includes(kw.toLowerCase()))
  ) {
    return CENTRAL_DEPARTMENTS.WATER_FACILITIES;
  }

  // 3. Check Hygiene & Sanitation
  if (
    combinedText.includes("hygiene") ||
    combinedText.includes("sanitat") ||
    combinedText.includes("clean") ||
    combinedText.includes("toilet") ||
    combinedText.includes("washroom") ||
    CENTRAL_DEPARTMENTS.SANITATION.keywords.some((kw) => combinedText.includes(kw.toLowerCase()))
  ) {
    return CENTRAL_DEPARTMENTS.SANITATION;
  }

  // 4. Check Medical Equipment / Maintenance
  if (
    combinedText.includes("equipment") ||
    combinedText.includes("maintenance") ||
    combinedText.includes("ventilator") ||
    combinedText.includes("wheelchair") ||
    combinedText.includes("stretcher") ||
    CENTRAL_DEPARTMENTS.EQUIPMENT_MAINTENANCE.keywords.some((kw) => combinedText.includes(kw.toLowerCase()))
  ) {
    return CENTRAL_DEPARTMENTS.EQUIPMENT_MAINTENANCE;
  }

  // 5. Check Staff Negligence / Administration
  if (
    combinedText.includes("negligence") ||
    combinedText.includes("administration") ||
    combinedText.includes("misbehavior") ||
    combinedText.includes("bribe") ||
    CENTRAL_DEPARTMENTS.ADMINISTRATION.keywords.some((kw) => combinedText.includes(kw.toLowerCase()))
  ) {
    return CENTRAL_DEPARTMENTS.ADMINISTRATION;
  }

  // Default to Hospital Administration for general grievances
  return CENTRAL_DEPARTMENTS.ADMINISTRATION;
}

/**
 * External government portal integration adapter (CPGRAMS / State Health Portal).
 * If official credentials or API endpoints are not configured, returns NOT_CONFIGURED.
 * NEVER fabricates or mocks a successful external delivery.
 */
export async function forwardToExternalGovernmentPortal(complaint: {
  id: string;
  complaintNumber?: string;
  category: string;
  summary: string;
}): Promise<{ status: DeliveryState; message: string; timestamp: string }> {
  const govApiUrl = process.env.EXTERNAL_GOV_PORTAL_URL;
  const govApiKey = process.env.EXTERNAL_GOV_PORTAL_API_KEY;

  if (!govApiUrl || !govApiKey) {
    return {
      status: "NOT_CONFIGURED",
      message: "External government integration endpoint or API credentials not configured in environment.",
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const res = await fetch(govApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${govApiKey}`,
      },
      body: JSON.stringify({
        sourceSystem: "JANASUVIDHA",
        externalId: complaint.complaintNumber || complaint.id,
        category: complaint.category,
        description: complaint.summary,
      }),
    });

    if (!res.ok) {
      return {
        status: "FAILED",
        message: `Government portal responded with HTTP ${res.status}`,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      status: "DELIVERED",
      message: "Successfully synchronized with external government grievance repository.",
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      status: "FAILED",
      message: `Network transmission failure to external portal: ${err.message}`,
      timestamp: new Date().toISOString(),
    };
  }
}

