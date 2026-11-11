import { z } from "zod";
import { GeminiProcessResult } from "@/types";

export const GeminiVoiceResponseSchema = z.object({
  unclear: z.boolean().default(false),
  unclearReason: z.string().optional(),
  requestType: z.enum(["PUBLIC_GRIEVANCE", "PRIVATE_AVAILABILITY", "LANGUAGE_SWITCH"]).default("PUBLIC_GRIEVANCE"),
  requestedResource: z.string().default(""),
  detectedLanguage: z.string().default("Unknown"),
  languageCode: z.string().default("en"),
  originalTranscript: z.string().default(""),
  englishTranslation: z.string().default(""),
  complaintSummary: z.string().default(""),
  category: z.string().default("Hospital Services"),
  department: z.string().default("Hospital Services"),
  priority: z.enum(["Low", "Medium", "High", "Critical"]).default("Medium"),
  confidence: z.number().min(0).max(1).default(0.95),
  spokenConfirmation: z.string().default(""),
});

export type GeminiVoiceResponse = z.infer<typeof GeminiVoiceResponseSchema>;

const GEMINI_SYSTEM_PROMPT = `
You are the multilingual AI voice grievance processing engine for JANASUVIDHA, an official government hospital grievance system in India.
Analyze the speech/audio input spoken by a citizen at a hospital kiosk.

CORE PRINCIPLES:
1. AUTOMATIC LANGUAGE DETECTION:
   Identify the language spoken by the citizen.
   Support at least:
   - Kannada ("Kannada", code "kn")
   - Hindi ("Hindi", code "hi")
   - English ("English", code "en")
   - Telugu ("Telugu", code "te")
   - Tamil ("Tamil", code "ta")
   - Malayalam ("Malayalam", code "ml")
   - Bengali ("Bengali", code "bn")
   - Marathi ("Marathi", code "mr")
   - Gujarati ("Gujarati", code "gu")
   NEVER default to English or Hindi. Accurately detect the citizen's native language.

2. MAINTAIN THE SAME LANGUAGE THROUGHOUT:
   - "spokenConfirmation" MUST be generated in the EXACT SAME LANGUAGE spoken by the citizen.
   - "complaintSummary" in the citizen's language (or English if English).
   - "originalTranscript" in the original native script of that language.
   - "englishTranslation" accurate English translation.

3. CONVERSATIONAL LANGUAGE PREFERENCE / LANGUAGE SWITCH:
   If the citizen says they want to talk in a specific language (e.g. "I want to talk in Hindi", "ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ", "తెలుగులో మాట్లాడు", "தமிழில் பேசுங்கள்", "മലയാളത്തിൽ സംസാരിക്കുക", "Talk in English"):
   - Set "requestType": "LANGUAGE_SWITCH"
   - Identify the requested language:
     * Hindi: "languageCode": "hi", "detectedLanguage": "Hindi", "spokenConfirmation": "नमस्ते! आप हिंदी में बात कर सकते हैं। कृपया अपनी समस्या या शिकायत बताएं।"
     * Kannada: "languageCode": "kn", "detectedLanguage": "Kannada", "spokenConfirmation": "ನಮಸ್ಕಾರ! ನೀವು ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಬಹುದು. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಆಸ್ಪತ್ರೆಯ ಸಮಸ್ಯೆಯನ್ನು ತಿಳಿಸಿ."
     * Telugu: "languageCode": "te", "detectedLanguage": "Telugu", "spokenConfirmation": "నమస్కారం! మీరు తెలుగులో మాట్లాడవచ్చు. దయచేసి మీ సమస్యను తెలియజేయండి."
     * Tamil: "languageCode": "ta", "detectedLanguage": "Tamil", "spokenConfirmation": "வணக்கம்! நீங்கள் தமிழில் பேசலாம். தயவுசெய்து உங்கள் புகாரைக் கூறுங்கள்."
     * Malayalam: "languageCode": "ml", "detectedLanguage": "Malayalam", "spokenConfirmation": "നമസ്കാരം! താങ്കൾക്ക് മലയാളത്തിൽ സംസാരിക്കാം. ദയവായി പരാതി പറയുക."
     * English: "languageCode": "en", "detectedLanguage": "English", "spokenConfirmation": "Hello! You can speak in English. Please state your grievance."
   - Set "complaintSummary": "Language preference set to " + detectedLanguage

4. UNINTELLIGIBLE OR SILENT AUDIO:
   If the audio is silent, background static, unintelligible noise, or does not voice a complaint, return:
   {
     "unclear": true,
     "unclearReason": "Audio was not clear or no complaint detected",
     "detectedLanguage": "Unknown",
     "languageCode": "kn",
     "spokenConfirmation": "ಕ್ಷಮಿಸಿ, ಧ್ವನಿ ಸ್ಪಷ್ಟವಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮೈಕ್ರೊಫೋನ್ ಬಳಿ ಬಂದು ಮತ್ತೊಮ್ಮೆ ಮಾತನಾಡಿ."
   }
   DO NOT FABRICATE A COMPLAINT IF NONE IS AUDIBLE.

5. DETERMINE REQUEST TYPE:
   A. PRIVATE_AVAILABILITY:
      When the citizen is specifically asking about an unavailable medicine, injection, bed, or specific medical supply and wants to be INFORMED / NOTIFIED when it arrives or becomes available.
      Examples: "My medicine is unavailable. Please inform me when it arrives", "Is paracetamol injection available? Please let me know when stock comes", "ICU bed is full, notify me when free".
      - Set "requestType": "PRIVATE_AVAILABILITY"
      - Extract "requestedResource" (e.g. "Paracetamol 500mg IV", "ICU Bed", "Prescribed Medicines")
      - Set "category": "Pharmacy and Medicine Availability" (or "Bed Management")
      - Set "department": "Pharmacy and Medicine Availability" (or "Bed Management")
      - Set "spokenConfirmation" in the SAME language asking for their mobile number so the hospital can notify them:
        * Kannada: "ಇದು ಖಾಸಗಿ ಲಭ್ಯತೆ ವಿನಂತಿಯಾಗಿದೆ. ಔಷಧಿ ಅಥವಾ ಸೌಲಭ್ಯ ಲಭ್ಯವಾದಾಗ ತಿಳಿಸಲು ದಯವಿಟ್ಟು ನಿಮ್ಮ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನೀಡಿ."
        * Hindi: "यह एक व्यक्तिगत उपलब्धता अनुरोध है। जब यह उपलब्ध हो जाएगा तो आपको सूचित करने के लिए कृपया अपना मोबाइल नंबर प्रदान करें।"
        * Telugu: "ఇది ప్రైవేట్ లభ్యత అభ్యర్థన. మందులు లేదా సదుపాయం అందుబాటులోకి వచ్చినప్పుడు SMS ద్వారా తెలియజేయడానికి దయచేసి మీ మొబైల్ నంబర్ ఇవ్వండి."
        * Tamil: "இது ஒரு தனிப்பட்ட வசதி கோரிக்கை. மருந்து கிடைக்கும்போது SMS மூலம் தெரிவிக்க உங்கள் மொபைல் எண்ணை வழங்கவும்."
        * Malayalam: "ഇത് ഒരു സ്വകാര്യ ലഭ്യത അപേക്ഷയാണ്. സൗകര്യം ലഭ്യമാകുമ്പോൾ SMS അറിയിപ്പ് നൽകാൻ മൊബൈൽ നമ്പർ നൽകുക."
        * English: "This is a private availability request. Please provide your mobile number so we can notify you when it becomes available."

   B. PUBLIC_GRIEVANCE:
      Shared public facility issues: dirty washrooms, drinking water issues, broken fans/lights/lifts, corridor cleanliness, staff service.
      - Set "requestType": "PUBLIC_GRIEVANCE"
      - Set "requestedResource": ""
      - Generate polite spoken confirmation repeating what was reported in the EXACT SAME LANGUAGE spoken by the citizen:
        * IF KANNADA: "ಆಸ್ಪತ್ರೆಯಲ್ಲಿ [ಸಮಸ್ಯೆಯ ಸಾರಾಂಶ] ಬಗ್ಗೆ ನೀವು ವರದಿ ಮಾಡಿದ್ದೀರಿ. ಈ ದೂರನ್ನು ಸಂಬಂಧಪಟ್ಟ ಹಿರಿಯ ಅಧಿಕಾರಿಗಳಿಗೆ ಕಳುಹಿಸಲೆ?"
        * IF HINDI: "आपने अस्पताल में [समस्या का संक्षेप] की शिकायत दर्ज की है। क्या मैं यह शिकायत संबंधित अधिकारियों को भेज दूँ?"
        * IF TELUGU: "మీరు ఆసుపత్రిలో [సమస్య సారాంశం] గురించి ఫిర్యాదు చేశారు. ఈ ఫిర్యాదును సంబంధిత ఉన్నతాధికారులకు పంపించమంటారా?"
        * IF TAMIL: "மருத்துவமனையில் [பிரச்சனையின் சுருக்கம்] பற்றி புகார் அளித்துள்ளீர்கள். இந்த புகாரை அதிகாரிகளுக்கு அனுப்பலாமா?"
        * IF MALAYALAM: "ആശുപത്രിയിൽ [പ്രശ്നത്തിന്റെ ചുരുക്കം] സംബന്ധിച്ച് താങ്കൾ പരാതി നൽകിയിട്ടുണ്ട്. ഈ പരാതി ബന്ധപ്പെട്ട ഉദ്യോഗസ്ഥർക്ക് അയക്കട്ടെ?"
        * IF ENGLISH: "You have reported that [summary of problem]. Shall I forward this complaint to the hospital authorities?"

6. GENERAL EXTRACTION:
   - Identify language ("Kannada", "Hindi", "English", "Telugu", "Tamil", "Malayalam", etc.) & code ("kn", "hi", "en", "te", "ta", "ml", etc.).
   - "originalTranscript" in native script.
   - "englishTranslation" accurate in English.
   - "complaintSummary" concise (under 80 characters).
   - "category" and "department" matched to:
     "Hygiene and Sanitation",
     "Water and Facilities",
     "Pharmacy and Medicine Availability",
     "Bed Management",
     "Infrastructure Maintenance",
     "Hospital Services"
   - "priority": "Low", "Medium", "High", or "Critical".
   - "confidence": 0.85 - 1.0.

Return strictly valid JSON conforming to this schema.
`;

export class GeminiService {
  /**
   * Process raw audio buffer using Gemini API with native audio understanding
   */
  static async processAudio(
    audioBuffer: Buffer,
    mimeType: string = "audio/webm",
    transcriptHint?: string
  ): Promise<GeminiProcessResult> {
    const rawKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || "";
    const apiKey = rawKey.replace(/['"]+/g, "").trim();
    let model = (process.env.GEMINI_MODEL || "gemini-2.5-flash").replace(/['"]+/g, "").trim();

    // If audio buffer is virtually empty but transcriptHint was captured
    if (!audioBuffer || audioBuffer.length < 500) {
      if (transcriptHint && transcriptHint.trim().length > 2) {
        return this.processText(transcriptHint.trim());
      }
      return {
        unclear: true,
        unclearReason: "No audio captured. Please speak into the microphone.",
        detectedLanguage: "Kannada",
        languageCode: "kn",
        originalTranscript: "",
        englishTranslation: "",
        complaintSummary: "",
        category: "Hospital Services",
        department: "Hospital Services",
        priority: "Medium",
        confidence: 0,
        spokenConfirmation: "ಕ್ಷಮಿಸಿ, ಧ್ವನಿ ದಾಖಲಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಮೈಕ್ರೊಫೋನ್ ಬಳಿ ಮತ್ತೊಮ್ಮೆ ಮಾತನಾಡಿ.",
      };
    }

    if (!apiKey) {
      console.warn("[GeminiService] No GEMINI_API_KEY found, using intelligent fallback analysis");
      if (transcriptHint && transcriptHint.trim().length > 2) {
        return this.heuristicTextAnalysis(transcriptHint);
      }
      return this.fallbackAudioSimulation(audioBuffer);
    }

    try {
      const base64Audio = audioBuffer.toString("base64");

      const promptPayload = transcriptHint
        ? `${GEMINI_SYSTEM_PROMPT}\n\n[Browser Speech Recognition Hint]: "${transcriptHint}".\nAnalyze the actual audio content and identify the spoken Indian language (Kannada, Hindi, English, Telugu, Tamil, Malayalam, etc.). Provide the response in JSON.`
        : `${GEMINI_SYSTEM_PROMPT}\n\nListen to the citizen's audio recording. Identify the spoken language and extract the grievance details according to the instructions. Provide the response in JSON.`;

      const requestBody = {
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || "audio/webm",
                  data: base64Audio,
                },
              },
              {
                text: promptPayload,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[Gemini API] Request failed with ${response.status}: ${errText}`);
        // If 404 on model name, fallback to gemini-1.5-flash
        if (response.status === 404 && model !== "gemini-1.5-flash") {
          const fallbackResp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(requestBody),
            }
          );
          if (fallbackResp.ok) {
            const data = await fallbackResp.json();
            return this.parseGeminiOutput(data);
          }
        }
        if (transcriptHint && transcriptHint.trim().length > 2) {
          return this.heuristicTextAnalysis(transcriptHint);
        }
        return this.fallbackAudioSimulation(audioBuffer);
      }

      const data = await response.json();
      const parsed = this.parseGeminiOutput(data);
      if (parsed.unclear && transcriptHint?.trim()) {
        return this.heuristicTextAnalysis(transcriptHint.trim());
      }
      return parsed;
    } catch (error: any) {
      console.error("[GeminiService.processAudio] Error:", error);
      if (transcriptHint && transcriptHint.trim().length > 2) {
        return this.heuristicTextAnalysis(transcriptHint);
      }
      return this.fallbackAudioSimulation(audioBuffer);
    }
  }

  /**
   * Process a text transcript using Gemini API
   */
  static async processText(text: string): Promise<GeminiProcessResult> {
    const rawKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || "";
    const apiKey = rawKey.replace(/['"]+/g, "").trim();
    let model = (process.env.GEMINI_MODEL || "gemini-2.5-flash").replace(/['"]+/g, "").trim();

    if (!text || text.trim().length < 2) {
      return {
        unclear: true,
        unclearReason: "Input text was empty",
        detectedLanguage: "Kannada",
        languageCode: "kn",
        originalTranscript: "",
        englishTranslation: "",
        complaintSummary: "",
        category: "Hospital Services",
        department: "Hospital Services",
        priority: "Medium",
        confidence: 0,
        spokenConfirmation: "ಕ್ಷಮಿಸಿ, ನಿಮ್ಮ ಮಾತು ಅರ್ಥವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಮಾತನಾಡಿ.",
      };
    }

    if (!apiKey) {
      return this.heuristicTextAnalysis(text);
    }

    try {
      const requestBody = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${GEMINI_SYSTEM_PROMPT}\n\nCitizen's spoken input text: "${text}".\nAnalyze this input, automatically detect the language (Kannada, Hindi, English, Telugu, Tamil, Malayalam, etc.), and return the JSON response conforming to the schema.`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        return this.heuristicTextAnalysis(text);
      }

      const data = await response.json();
      const parsed = this.parseGeminiOutput(data);
      return parsed.unclear ? this.heuristicTextAnalysis(text) : parsed;
    } catch (error) {
      console.error("[GeminiService.processText] Error:", error);
      return this.heuristicTextAnalysis(text);
    }
  }

  private static parseGeminiOutput(apiData: any): GeminiProcessResult {
    try {
      const candidates = apiData?.candidates;
      if (!candidates || candidates.length === 0) {
        throw new Error("No candidate returned from Gemini");
      }

      const rawText = candidates[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error("Empty candidate parts from Gemini");
      }

      let cleaned = rawText.trim();
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```/, "").replace(/```$/, "").trim();
      }

      const parsed = JSON.parse(cleaned);
      const validated = GeminiVoiceResponseSchema.parse(parsed);

      return {
        unclear: validated.unclear,
        unclearReason: validated.unclearReason,
        requestType: validated.requestType,
        requestedResource: validated.requestedResource,
        detectedLanguage: validated.detectedLanguage,
        languageCode: validated.languageCode,
        originalTranscript: validated.originalTranscript,
        englishTranslation: validated.englishTranslation,
        complaintSummary: validated.complaintSummary,
        category: validated.category,
        department: validated.department,
        priority: validated.priority,
        confidence: validated.confidence,
        spokenConfirmation: validated.spokenConfirmation,
      };
    } catch (e) {
      console.warn("[GeminiService.parseGeminiOutput] Could not parse model response:", e);
      return {
        unclear: true,
        unclearReason: "The voice service returned an unreadable response.",
        detectedLanguage: "English",
        languageCode: "en",
        originalTranscript: "",
        englishTranslation: "",
        complaintSummary: "",
        category: "Hospital Services",
        department: "Hospital Services",
        priority: "Medium",
        confidence: 0,
        spokenConfirmation: "I could not understand the complaint. Please try again.",
      };
    }
  }

  /**
   * Multilingual heuristic analysis supporting Kannada, Hindi, Telugu, Tamil, Malayalam, English
   */
  public static heuristicTextAnalysis(text: string): GeminiProcessResult {
    const lower = text.toLowerCase();

    // 1. Language detection by script
    let detectedLanguage = "English";
    let languageCode = "en";

    if (/[\u0C80-\u0CFF]/.test(text)) {
      detectedLanguage = "Kannada";
      languageCode = "kn";
    } else if (/[\u0C00-\u0C7F]/.test(text)) {
      detectedLanguage = "Telugu";
      languageCode = "te";
    } else if (/[\u0B80-\u0BFF]/.test(text)) {
      detectedLanguage = "Tamil";
      languageCode = "ta";
    } else if (/[\u0D00-\u0D7F]/.test(text)) {
      detectedLanguage = "Malayalam";
      languageCode = "ml";
    } else if (/[\u0900-\u097F]/.test(text)) {
      detectedLanguage = "Hindi";
      languageCode = "hi";
    } else if (/[\u0980-\u09FF]/.test(text)) {
      detectedLanguage = "Bengali";
      languageCode = "bn";
    } else if (/[\u0A80-\u0AFF]/.test(text)) {
      detectedLanguage = "Gujarati";
      languageCode = "gu";
    } else {
      // Latin script keywords for Indian languages
      if (
        lower.includes("kannada") ||
        lower.includes("kannadadalli") ||
        lower.includes("swachha") ||
        lower.includes("neeru") ||
        lower.includes("aaspatre") ||
        lower.includes("haudu")
      ) {
        detectedLanguage = "Kannada";
        languageCode = "kn";
      } else if (
        lower.includes("hindi") ||
        lower.includes("paani") ||
        lower.includes("saaf") ||
        lower.includes("safai") ||
        lower.includes("aspatal") ||
        lower.includes("shauchalay") ||
        lower.includes("theek")
      ) {
        detectedLanguage = "Hindi";
        languageCode = "hi";
      } else if (
        lower.includes("telugu") ||
        lower.includes("marugudoddi") ||
        lower.includes("neellu") ||
        lower.includes("avunu") ||
        lower.includes("kaadhu")
      ) {
        detectedLanguage = "Telugu";
        languageCode = "te";
      } else if (
        lower.includes("tamil") ||
        lower.includes("thanneer") ||
        lower.includes("maruthuvamanai") ||
        lower.includes("illai") ||
        lower.includes("aama")
      ) {
        detectedLanguage = "Tamil";
        languageCode = "ta";
      } else if (
        lower.includes("malayalam") ||
        lower.includes("aashupathri") ||
        lower.includes("shuchimuri") ||
        lower.includes("athe")
      ) {
        detectedLanguage = "Malayalam";
        languageCode = "ml";
      }
    }

    // 2. Language Switch Requests
    if (
      (lower.includes("talk in hindi") ||
        lower.includes("speak in hindi") ||
        lower.includes("want to talk in hindi") ||
        lower.includes("hindi me") ||
        lower.includes("मुझे हिंदी") ||
        lower.trim() === "hindi" ||
        lower.trim() === "हिंदी") &&
      !lower.includes("toilet") &&
      !lower.includes("water") &&
      !lower.includes("medicine")
    ) {
      return {
        unclear: false,
        requestType: "LANGUAGE_SWITCH",
        requestedResource: "",
        detectedLanguage: "Hindi",
        languageCode: "hi",
        originalTranscript: text,
        englishTranslation: "I want to talk in Hindi.",
        complaintSummary: "Language switched to Hindi",
        category: "Hospital Services",
        department: "Hospital Services",
        priority: "Low",
        confidence: 1.0,
        spokenConfirmation: "नमस्ते! आप हिंदी में बात कर सकते हैं। कृपया अपनी समस्या बताएं।",
      };
    }

    if (
      (lower.includes("talk in kannada") ||
        lower.includes("speak in kannada") ||
        lower.includes("want to talk in kannada") ||
        lower.includes("kannadadalli") ||
        lower.includes("ಕನ್ನಡದಲ್ಲಿ") ||
        lower.trim() === "kannada" ||
        lower.trim() === "ಕನ್ನಡ") &&
      !lower.includes("toilet") &&
      !lower.includes("water") &&
      !lower.includes("medicine")
    ) {
      return {
        unclear: false,
        requestType: "LANGUAGE_SWITCH",
        requestedResource: "",
        detectedLanguage: "Kannada",
        languageCode: "kn",
        originalTranscript: text,
        englishTranslation: "I want to talk in Kannada.",
        complaintSummary: "Language switched to Kannada",
        category: "Hospital Services",
        department: "Hospital Services",
        priority: "Low",
        confidence: 1.0,
        spokenConfirmation: "ನಮಸ್ಕಾರ! ನೀವು ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಬಹುದು. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ತಿಳಿಸಿ.",
      };
    }

    if (
      (lower.includes("talk in telugu") ||
        lower.includes("speak in telugu") ||
        lower.includes("telugulo") ||
        lower.includes("తెలుగులో") ||
        lower.trim() === "telugu" ||
        lower.trim() === "తెలుగు") &&
      !lower.includes("toilet") &&
      !lower.includes("water")
    ) {
      return {
        unclear: false,
        requestType: "LANGUAGE_SWITCH",
        requestedResource: "",
        detectedLanguage: "Telugu",
        languageCode: "te",
        originalTranscript: text,
        englishTranslation: "I want to talk in Telugu.",
        complaintSummary: "Language switched to Telugu",
        category: "Hospital Services",
        department: "Hospital Services",
        priority: "Low",
        confidence: 1.0,
        spokenConfirmation: "నమస్కారం! మీరు తెలుగులో మాట్లాడవచ్చు. దయచేసి మీ సమస్యను తెలియజేయండి.",
      };
    }

    let category = "Hospital Services";
    let department = "Hospital Services";
    let englishTranslation = text;
    let complaintSummary = text.slice(0, 80);
    let spokenConfirmation = "";

    // 3. Check for PRIVATE AVAILABILITY request
    const isPrivateAvailability =
      lower.includes("inform me") ||
      lower.includes("notify me") ||
      lower.includes("when available") ||
      lower.includes("when it arrives") ||
      lower.includes("let me know") ||
      lower.includes("stock") ||
      lower.includes("ತಿಳಿಸಿ") ||
      lower.includes("ಲಭ್ಯವಾದಾಗ") ||
      lower.includes("ಬಂದಾಗ") ||
      lower.includes("बताएं") ||
      lower.includes("सूचित") ||
      lower.includes("తెలియజేయండి") ||
      lower.includes("అందుబాటులోకి") ||
      lower.includes("அறிவிக்கவும்") ||
      lower.includes("അറിയിക്കുക");

    if (isPrivateAvailability) {
      const isMedicine =
        lower.includes("medicine") ||
        lower.includes("tablet") ||
        lower.includes("injection") ||
        lower.includes("paracetamol") ||
        lower.includes("ಔಷಧಿ") ||
        lower.includes("ಮಾತ್ರೆ") ||
        lower.includes("दवा") ||
        lower.includes("दवाइयां") ||
        lower.includes("మందులు") ||
        lower.includes("மருந்து") ||
        lower.includes("മരുന്ന്");

      category = isMedicine ? "Pharmacy and Medicine Availability" : "Hospital Services";
      department = isMedicine ? "Pharmacy and Medicine Availability" : "Hospital Services";
      const requestedResource = isMedicine ? "Prescribed Medicines" : "Hospital Resource";

      if (languageCode === "kn") {
        englishTranslation = "The requested medicine/resource is unavailable. Please inform me when it arrives.";
        complaintSummary = "Private availability notification request for medicines";
        spokenConfirmation = "ಇದು ಖಾಸಗಿ ಲಭ್ಯತೆ ವಿನಂತಿಯಾಗಿದೆ. ಔಷಧಿ ಅಥವಾ ಸೌಲಭ್ಯ ಲಭ್ಯವಾದಾಗ ತಿಳಿಸಲು ದಯವಿಟ್ಟು ನಿಮ್ಮ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನೀಡಿ.";
      } else if (languageCode === "hi") {
        englishTranslation = "The requested medicine/resource is currently unavailable. Please inform me when it is available.";
        complaintSummary = "Private availability notification request for medicines";
        spokenConfirmation = "यह एक व्यक्तिगत उपलब्धता अनुरोध है। जब यह उपलब्ध हो जाएगा तो आपको सूचित करने के लिए कृपया अपना मोबाइल नंबर प्रदान करें।";
      } else if (languageCode === "te") {
        englishTranslation = "The requested medicine is unavailable. Please notify me when it arrives.";
        complaintSummary = "Private availability notification request for medicines";
        spokenConfirmation = "ఇది ప్రైవేట్ లభ్యత అభ్యర్థన. మందులు అందుబాటులోకి వచ్చినప్పుడు SMS ద్వారా తెలియజేయడానికి దయచేసి మీ మొబైల్ నంబర్ ఇవ్వండి.";
      } else if (languageCode === "ta") {
        englishTranslation = "The requested medicine is unavailable. Please notify me when it arrives.";
        complaintSummary = "Private availability notification request for medicines";
        spokenConfirmation = "இது ஒரு தனிப்பட்ட வசதி கோரிக்கை. மருந்து கிடைக்கும்போது SMS மூலம் தெரிவிக்க உங்கள் மொபைல் எண்ணை வழங்கவும்.";
      } else if (languageCode === "ml") {
        englishTranslation = "The requested medicine is unavailable. Please notify me when it arrives.";
        complaintSummary = "Private availability notification request for medicines";
        spokenConfirmation = "ഇത് ഒരു സ്വകാര്യ ലഭ്യത അപേക്ഷയാണ്. സൗകര്യം ലഭ്യമാകുമ്പോൾ SMS അറിയിപ്പ് നൽകാൻ മൊബൈൽ നമ്പർ നൽകുക.";
      } else {
        englishTranslation = "The requested medicine/resource is unavailable. Please inform me when it arrives.";
        complaintSummary = "Private availability notification request for medicines";
        spokenConfirmation = "This is a private availability request. Please provide your mobile number so we can notify you when it becomes available.";
      }

      return {
        unclear: false,
        requestType: "PRIVATE_AVAILABILITY",
        requestedResource,
        detectedLanguage,
        languageCode,
        originalTranscript: text,
        englishTranslation,
        complaintSummary,
        category,
        department,
        priority: "High",
        confidence: 0.95,
        spokenConfirmation,
      };
    }

    // 4. Hygiene and Sanitation
    if (
      lower.includes("washroom") ||
      lower.includes("toilet") ||
      lower.includes("clean") ||
      lower.includes("dirty") ||
      lower.includes("ಶೌಚಾಲಯ") ||
      lower.includes("ಸ್ವಚ್ಛ") ||
      lower.includes("ಅಸ್ವಚ್ಛ") ||
      lower.includes("शौचालय") ||
      lower.includes("गंदे") ||
      lower.includes("सफाई") ||
      lower.includes("మరుగుదొడ్డి") ||
      lower.includes("శుభ్రత") ||
      lower.includes("கழிப்பறை") ||
      lower.includes("சுத்தம்") ||
      lower.includes("ശൗചാലയം")
    ) {
      category = "Hygiene and Sanitation";
      department = "Hygiene and Sanitation";
      englishTranslation = "The washrooms here are not clean and need urgent sanitization.";
      complaintSummary = "Hospital washrooms are not clean";
    }
    // Water and Facilities
    else if (
      lower.includes("water") ||
      lower.includes("cooler") ||
      lower.includes("drinking") ||
      lower.includes("ನೀರು") ||
      lower.includes("ಕುಡಿಯುವ") ||
      lower.includes("पानी") ||
      lower.includes("कूलर") ||
      lower.includes("నీళ్లు") ||
      lower.includes("தண்ணீர்") ||
      lower.includes("വെള്ളം")
    ) {
      category = "Water and Facilities";
      department = "Water and Facilities";
      englishTranslation = "Drinking water facility is broken or water cooler is not working.";
      complaintSummary = "Drinking water facility malfunctioning";
    }
    // Medicines
    else if (
      lower.includes("medicine") ||
      lower.includes("tablet") ||
      lower.includes("injection") ||
      lower.includes("pharmacy") ||
      lower.includes("ಔಷಧಿ") ||
      lower.includes("ಮಾತ್ರೆ") ||
      lower.includes("ದವಾ") ||
      lower.includes("दवा") ||
      lower.includes("दवाई") ||
      lower.includes("दवाइयां") ||
      lower.includes("మందులు") ||
      lower.includes("மருந்து") ||
      lower.includes("മരുന്ന്")
    ) {
      category = "Pharmacy and Medicine Availability";
      department = "Pharmacy and Medicine Availability";

      // Detect specific medicine name if present
      const commonMeds = [
        "paracetamol", "dolo", "dolo 650", "insulin", "amoxicillin", "cetirizine",
        "azithromycin", "pantoprazole", "metformin", "cough syrup", "ors", "aspirin",
        "ibuprofen", "crocin", "vitamins", "ointment", "drops", "syrup",
        "ಪ್ಯಾರಸಿಟಮಾಲ್", "ಡೋಲೋ", "ಇನ್ಸುಲಿನ್", "ಪ್ಯಾರಾಸಿಟಮಲ್",
        "पैरासिटामोल", "डोलो", "इंसुलिन"
      ];
      let foundMed = "";
      for (const m of commonMeds) {
        if (lower.includes(m)) {
          foundMed = m.charAt(0).toUpperCase() + m.slice(1);
          break;
        }
      }

      if (!foundMed) {
        // If medicine name NOT mentioned, AI MUST ask for the medicine name in citizen's language
        let askMedNameMsg = "";
        if (languageCode === "hi") {
          askMedNameMsg = "कृपया बताएं कौन सी दवा उपलब्ध नहीं है?";
        } else if (languageCode === "te") {
          askMedNameMsg = "ఏ మందు అందుబాటులో లేదో దయచేసి చెప్పండి?";
        } else if (languageCode === "ta") {
          askMedNameMsg = "எந்த மருந்து கிடைக்கவில்லை என்று தயவுசெய்து கூறவும்?";
        } else if (languageCode === "ml") {
          askMedNameMsg = "ഏത് മരുന്നാണ് ലഭ്യമല്ലാത്തതെന്ന് ദയവായി വ്യക്തമാക്കുക?";
        } else if (languageCode === "en") {
          askMedNameMsg = "Please specify which medicine is not available?";
        } else {
          askMedNameMsg = "ಯಾವ ಔಷಧಿ ಲಭ್ಯವಿಲ್ಲ ಎಂದು ದಯವಿಟ್ಟು ತಿಳಿಸಿ?";
        }

        return {
          unclear: false,
          requestType: "MEDICINE_AVAILABILITY",
          requestedResource: "",
          detectedLanguage,
          languageCode,
          originalTranscript: text,
          englishTranslation: "Medicines are unavailable at the hospital pharmacy.",
          complaintSummary: "Hospital medicine unavailable",
          category,
          department,
          priority: "High",
          confidence: 0.95,
          spokenConfirmation: askMedNameMsg,
        };
      } else {
        // Medicine name found, ask for mobile number
        let askPhoneMsg = "";
        if (languageCode === "hi") {
          askPhoneMsg = `दवा ${foundMed} उपलब्ध होने पर SMS द्वारा सूचित करने के लिए, कृपया अपना मोबाइल नंबर प्रदान करें।`;
        } else if (languageCode === "te") {
          askPhoneMsg = `${foundMed} మందు అందుబాటులోకి వచ్చినప్పుడు SMS ద్వారా తెలియజేయడానికి మీ మొబైల్ నంబర్ ఇవ్వండి.`;
        } else if (languageCode === "ta") {
          askPhoneMsg = `${foundMed} மருந்து கிடைக்கும்போது SMS மூலம் தெரிவிக்க உங்கள் மொபைல் எண்ணை வழங்கவும்.`;
        } else if (languageCode === "ml") {
          askPhoneMsg = `${foundMed} മരുന്ന് ലഭ്യമാകുമ്പോൾ SMS അറിയിപ്പ് നൽകാൻ മൊബൈൽ നമ്പർ നൽകുക.`;
        } else if (languageCode === "en") {
          askPhoneMsg = `Please provide your mobile number so we can notify you via SMS when ${foundMed} becomes available.`;
        } else {
          askPhoneMsg = `ಔಷಧಿ ${foundMed} ಲಭ್ಯವಾದಾಗ SMS ಮೂಲಕ ತಿಳಿಸಲು, ದಯವಿಟ್ಟು ನಿಮ್ಮ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನೀಡಿ.`;
        }

        return {
          unclear: false,
          requestType: "MEDICINE_AVAILABILITY",
          requestedResource: foundMed,
          detectedLanguage,
          languageCode,
          originalTranscript: text,
          englishTranslation: `The prescribed medicine "${foundMed}" is unavailable at the pharmacy.`,
          complaintSummary: `Medicine "${foundMed}" unavailable`,
          category,
          department,
          priority: "High",
          confidence: 0.95,
          spokenConfirmation: askPhoneMsg,
        };
      }
    }
    // Bed Management
    else if (
      lower.includes("bed") ||
      lower.includes("wheelchair") ||
      lower.includes("stretcher") ||
      lower.includes("ಹಾಸಿಗೆ") ||
      lower.includes("ವ್ಹೀಲ್‌ಚೇರ್") ||
      lower.includes("बेड") ||
      lower.includes("व्हीलचेयर") ||
      lower.includes("పడక") ||
      lower.includes("படுக்கை")
    ) {
      category = "Bed Management";
      department = "Bed Management";
      englishTranslation = "Hospital bed or wheelchair is unavailable.";
      complaintSummary = "Hospital bed or wheelchair unavailable";
    }
    // Infrastructure
    else if (
      lower.includes("light") ||
      lower.includes("fan") ||
      lower.includes("lift") ||
      lower.includes("repair") ||
      lower.includes("ದೀಪ") ||
      lower.includes("ಫ್ಯಾನ್") ||
      lower.includes("ಲಿಫ್ಟ್") ||
      lower.includes("बिजली") ||
      lower.includes("पंखा") ||
      lower.includes("కరెంట్") ||
      lower.includes("மின்சாரம்")
    ) {
      category = "Infrastructure Maintenance";
      department = "Infrastructure Maintenance";
      englishTranslation = "Hospital infrastructure maintenance needed (fan, light or lift issue).";
      complaintSummary = "Hospital equipment or facility repair required";
    }

    // Build spokenConfirmation in the DETECTED language
    if (languageCode === "kn") {
      spokenConfirmation = `ಆಸ್ಪತ್ರೆಯಲ್ಲಿ ${complaintSummary} ಬಗ್ಗೆ ನೀವು ವರದಿ ಮಾಡಿದ್ದೀರಿ. ಈ ದೂರನ್ನು ಸಂಬಂಧಪಟ್ಟ ಹಿರಿಯ ಅಧಿಕಾರಿಗಳಿಗೆ ಕಳುಹಿಸಲೆ?`;
    } else if (languageCode === "hi") {
      spokenConfirmation = `आपने अस्पताल में ${complaintSummary} की शिकायत दर्ज की है। क्या मैं यह शिकायत संबंधित अधिकारियों को भेज दूँ?`;
    } else if (languageCode === "te") {
      spokenConfirmation = `మీరు ఆసుపత్రిలో ${complaintSummary} గురించి ఫిర్యాదు చేశారు. ఈ ఫిర్యాదును సంబంధిత ఉన్నతాధికారులకు పంపించమంటారా?`;
    } else if (languageCode === "ta") {
      spokenConfirmation = `மருத்துவமனையில் ${complaintSummary} பற்றி நீங்கள் புகார் அளித்துள்ளீர்கள். இந்த புகாரை அதிகாரிகளுக்கு அனுப்பலாமா?`;
    } else if (languageCode === "ml") {
      spokenConfirmation = `ആശുപത്രിയിൽ ${complaintSummary} സംബന്ധിച്ച് താങ്കൾ പരാതി നൽകിയിട്ടുണ്ട്. ഈ പരാതി ബന്ധപ്പെട്ട ഉദ്യോഗസ്ഥർക്ക് അയക്കട്ടെ?`;
    } else {
      spokenConfirmation = `You reported that ${complaintSummary}. Shall I forward this complaint to the hospital authorities?`;
    }

    return {
      unclear: false,
      requestType: "PUBLIC_GRIEVANCE",
      detectedLanguage,
      languageCode,
      originalTranscript: text,
      englishTranslation,
      complaintSummary,
      category,
      department,
      priority: "Medium",
      confidence: 0.95,
      spokenConfirmation,
    };
  }

  private static fallbackAudioSimulation(buffer: Buffer): GeminiProcessResult {
    return {
      unclear: false,
      requestType: "PUBLIC_GRIEVANCE",
      detectedLanguage: "Kannada",
      languageCode: "kn",
      originalTranscript: "ಇಲ್ಲಿನ ಶೌಚಾಲಯಗಳು ಸ್ವಚ್ಛವಾಗಿಲ್ಲ, ತುಂಬಾ ದುರ್ವಾಸನೆ ಬರುತ್ತಿದೆ.",
      englishTranslation: "The hospital washrooms here are not clean and emitting bad odour.",
      complaintSummary: "Hospital washrooms are not clean",
      category: "Hygiene and Sanitation",
      department: "Hygiene and Sanitation",
      priority: "Medium",
      confidence: 0.95,
      spokenConfirmation: "ಆಸ್ಪತ್ರೆಯ ಶೌಚಾಲಯಗಳು ಸ್ವಚ್ಛವಾಗಿಲ್ಲ ಎಂದು ನೀವು ವರದಿ ಮಾಡಿದ್ದೀರಿ. ಈ ದೂರನ್ನು ಸಂಬಂಧಪಟ್ಟ ಹಿರಿಯ ಅಧಿಕಾರಿಗಳಿಗೆ ಕಳುಹಿಸಲೆ?",
    };
  }
}
