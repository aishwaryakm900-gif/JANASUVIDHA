"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Mic,
  Check,
  X,
  RotateCcw,
  Volume2,
  Search,
  ArrowRight,
  Pill,
  Phone,
  AlertCircle,
} from "lucide-react";
import WebThreads from "@/components/WebThreads";
import { TTSService } from "@/lib/services/tts.service";
import { ComplaintReceiptCard } from "@/components/ComplaintReceiptCard";
import { ComplaintItem, ComplaintReceipt, GeminiProcessResult } from "@/types";

type KioskStage =
  | "IDLE"
  | "LISTENING"
  | "ANALYZING"
  | "ASKING_MEDICINE_NAME"
  | "ASKING_PHONE"
  | "DUPLICATE_CHECK"
  | "TRACKING_EXISTING"
  | "CONFIRMATION"
  | "SUBMITTING"
  | "COMPLETED";

export default function CitizenKioskPage() {
  const [stage, setStage] = useState<KioskStage>("IDLE");
  const [transcript, setTranscript] = useState("");
  const [confirmationQuestion, setConfirmationQuestion] = useState("");
  const [summary, setSummary] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [priorityVal, setPriorityVal] = useState<any>("Medium");
  const [englishTranslationText, setEnglishTranslationText] = useState("");
  const [statusText, setStatusText] = useState("");
  const [receipt, setReceipt] = useState<ComplaintReceipt | null>(null);

  // Multilingual State: Detected from citizen's first sentence and maintained throughout
  const [currentLang, setCurrentLang] = useState<string>("kn");
  const [detectedLangName, setDetectedLangName] = useState<string>("Kannada");

  // Medicine Complaint Specific State
  const [isMedicineComplaint, setIsMedicineComplaint] = useState(false);
  const [medicineName, setMedicineName] = useState("");
  const [citizenPhone, setCitizenPhone] = useState("");
  const [phoneInputVal, setPhoneInputVal] = useState("");
  const [medInputVal, setMedInputVal] = useState("");

  // Duplicate / existing complaint state
  const [existingRepeatComplaint, setExistingRepeatComplaint] = useState<ComplaintItem | null>(null);
  const [storedGeminiData, setStoredGeminiData] = useState<GeminiProcessResult | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const liveTranscriptRef = useRef<string>("");
  const recognitionRef = useRef<any>(null);
  const isSubmittingRef = useRef<boolean>(false);
  const currentLangRef = useRef<string>("kn");

  useEffect(() => {
    currentLangRef.current = currentLang;
  }, [currentLang]);

  // Clean up audio streams and speech synthesis on unmount
  useEffect(() => {
    return () => {
      TTSService.stop();
      stopMediaRecording();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const stopMediaRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      } catch (e) {}
    }
  };

  // Dedicated speech listener tuned to citizen's detected language
  const startSpeechListener = (onResult: (spokenText: string) => void, langCode: string = "kn") => {
    if (
      typeof window === "undefined" ||
      !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }

      const SpeechRec =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRec();
      recognitionRef.current = rec;
      rec.continuous = true;
      rec.interimResults = true;

      const langMap: Record<string, string> = {
        kn: "kn-IN",
        hi: "hi-IN",
        te: "te-IN",
        ta: "ta-IN",
        ml: "ml-IN",
        en: "en-IN",
      };
      rec.lang = langMap[langCode] || `${langCode}-IN`;

      rec.onresult = (event: any) => {
        let full = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          full += event.results[i][0].transcript;
        }
        if (full.trim()) {
          onResult(full.trim());
        }
      };

      rec.onerror = () => {};
      rec.start();
    } catch (e) {
      console.warn("Speech listener start error:", e);
    }
  };

  // 1. USER PRESSES MICROPHONE -> DIRECT LISTENING (NO PRE-GREETING!)
  // User speaks in ANY Indian language or English
  const handleStartVoiceInteraction = async () => {
    TTSService.stop();
    setStage("LISTENING");
    setStatusText("ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ... / सुन रहा हूँ... / Listening... Speak your issue in any language");
    setTranscript("");
    liveTranscriptRef.current = "";
    audioChunksRef.current = [];

    // Initialize browser speech recognition for real-time transcription feedback
    if (
      typeof window !== "undefined" &&
      ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      try {
        const SpeechRec =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const liveRec = new SpeechRec();
        recognitionRef.current = liveRec;
        liveRec.continuous = true;
        liveRec.interimResults = true;

        liveRec.onresult = (event: any) => {
          let fullStr = "";
          for (let i = 0; i < event.results.length; ++i) {
            fullStr += event.results[i][0].transcript;
          }
          if (fullStr.trim()) {
            liveTranscriptRef.current = fullStr.trim();
            setTranscript(fullStr.trim());
            setStatusText("ಮಾತನಾಡಿದ ಧ್ವನಿ ಗುರುತಿಸಲಾಗಿದೆ / आवाज़ पहचानी गई / Speech detected...");
          }
        };

        liveRec.onerror = () => {};
        liveRec.start();
      } catch (recInitErr) {
        console.warn("[Live SpeechRec init]", recInitErr);
      }
    }

    // Capture microphone audio stream via MediaRecorder
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const capturedSpeech = liveTranscriptRef.current.trim();

          if (audioBlob.size > 500 || capturedSpeech.length > 2) {
            await sendAudioToServer(audioBlob, mimeType, capturedSpeech);
          } else {
            handleUnclearSpeech("ಕ್ಷಮಿಸಿ, ಧ್ವನಿ ದಾಖಲಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಮಾತನಾಡಿ. / क्षमा करें, आवाज़ रिकॉर्ड नहीं हुई।");
          }
        };

        recorder.start(250);
      } catch (micErr) {
        console.warn("[MediaRecorder] stream error or permission denied:", micErr);
      }
    }
  };

  // Stop recording manually when citizen taps "✓ વાત समाप्त / ಮುಗಿದಿದೆ / Done" or the mic button
  const stopListeningManual = () => {
    if (stage === "LISTENING") {
      stopMediaRecording();
    }
  };

  // 2. AUTOMATIC LANGUAGE DETECTION: Send audio to /api/voice/process
  const sendAudioToServer = async (blob: Blob, mimeType: string, capturedText?: string) => {
    setStage("ANALYZING");
    setStatusText("ಭಾಷೆ ಮತ್ತು ದೂರನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ... / भाषा और समस्या का विश्लेषण हो रहा है... / Analyzing speech and language...");

    try {
      const formData = new FormData();
      if (blob && blob.size > 0) {
        formData.append("audio", blob, "citizen-grievance.webm");
      }
      formData.append("mimeType", mimeType);
      if (capturedText) {
        formData.append("liveTranscript", capturedText);
      }

      const res = await fetch("/api/voice/process", {
        method: "POST",
        body: formData,
      });

      const data: GeminiProcessResult & { success: boolean; error?: string } = await res.json();

      if (!data.success || data.unclear) {
        if (capturedText && capturedText.length > 2) {
          await processTextThroughGemini(capturedText);
          return;
        }
        handleUnclearSpeech(
          data.spokenConfirmation || "ಕ್ಷಮಿಸಿ, ಮಾತು ಅರ್ಥವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಮಾತನಾಡಿ."
        );
        return;
      }

      applyGeminiResult(data);
    } catch (err) {
      console.error("[Voice Process Error]", err);
      if (capturedText && capturedText.length > 2) {
        await processTextThroughGemini(capturedText);
        return;
      }
      handleUnclearSpeech("ಕ್ಷಮಿಸಿ, ಸಂಪರ್ಕ ದೋಷ ಸಂಭವಿಸಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.");
    }
  };

  const processTextThroughGemini = async (spokenText: string) => {
    setStage("ANALYZING");
    setStatusText("ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ... / विश्लेषण हो रहा है... / Processing...");

    try {
      const res = await fetch("/api/voice/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: spokenText }),
      });

      const data: GeminiProcessResult & { success: boolean } = await res.json();

      if (!data.success || data.unclear) {
        handleUnclearSpeech(data.spokenConfirmation || "ಕ್ಷಮಿಸಿ, ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಮಾತನಾಡಿ.");
        return;
      }

      applyGeminiResult(data);
    } catch (err) {
      console.error(err);
      handleUnclearSpeech("ಕ್ಷಮಿಸಿ, ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಮಾತನಾಡಿ.");
    }
  };

  // 3. MAINTAIN DETECTED LANGUAGE THROUGHOUT INTERACTION & CLASSIFY WORKFLOW
  const applyGeminiResult = async (data: GeminiProcessResult) => {
    const langCode = data.languageCode || "kn";
    const langName = data.detectedLanguage || "Kannada";
    setCurrentLang(langCode);
    setDetectedLangName(langName);
    currentLangRef.current = langCode;

    setStoredGeminiData(data);
    setTranscript(data.originalTranscript || liveTranscriptRef.current);
    setEnglishTranslationText(data.englishTranslation);
    setSummary(data.complaintSummary);
    setDepartmentName(data.department);
    setCategoryName(data.category);
    setPriorityVal(data.priority);

    // If citizen requested a language switch mid-conversation
    if (data.requestType === "LANGUAGE_SWITCH") {
      setStatusText(data.spokenConfirmation);
      await TTSService.speak(data.spokenConfirmation, langCode);
      setTimeout(() => {
        handleStartVoiceInteraction();
      }, 800);
      return;
    }

    // CLASSIFICATION: Is this a MEDICINE AVAILABILITY complaint?
    const isMed =
      data.requestType === "MEDICINE_AVAILABILITY" ||
      data.category === "Pharmacy and Medicine Availability" ||
      data.department === "Pharmacy and Medicine Availability" ||
      data.originalTranscript.toLowerCase().includes("medicine") ||
      data.originalTranscript.toLowerCase().includes("ಔಷಧಿ") ||
      data.originalTranscript.toLowerCase().includes("ದವಾ") ||
      data.originalTranscript.toLowerCase().includes("दवा");

    if (isMed) {
      setIsMedicineComplaint(true);
      const extractedMed = data.requestedResource || "";
      if (extractedMed && extractedMed !== "Prescribed Medicines") {
        setMedicineName(extractedMed);
        setMedInputVal(extractedMed);
        // Medicine name is already known, ask for mobile number
        askForCitizenMobile(extractedMed, langCode);
      } else {
        // Medicine name is missing -> Prompt citizen to specify medicine name
        askForMedicineName(langCode);
      }
      return;
    }

    // PUBLIC FACILITY COMPLAINT WORKFLOW
    setIsMedicineComplaint(false);

    // 4. CHECK EXISTING COMPLAINT (DUPLICATE DETECTION)
    try {
      const repRes = await fetch("/api/complaints/check-repeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: data.category, department: data.department }),
      });
      const repData = await repRes.json();

      if (repData.hasActive && repData.complaint) {
        setExistingRepeatComplaint(repData.complaint);
        setStage("DUPLICATE_CHECK");

        let duplicateQuestion = "";
        if (langCode === "hi") {
          duplicateQuestion = `इस समस्या (${data.complaintSummary || data.department}) के बारे में आज पहले ही शिकायत दर्ज की जा चुकी है। क्या आप पुरानी शिकायत की स्थिति देखना चाहते हैं या नई शिकायत दर्ज करना चाहते हैं?`;
        } else if (langCode === "te") {
          duplicateQuestion = `ఈ సమస్య (${data.complaintSummary || data.department}) పై ఇప్పటికే ఫిర్యాదు నమోదైంది. మీరు పాత ఫిర్యాదు స్థితిని తనిఖీ చేయాలనుకుంటున్నారా లేదా కొత్త ఫిర్యాదును నమోదు చేయాలనుకుంటున్నారా?`;
        } else if (langCode === "ta") {
          duplicateQuestion = `இந்த பிரச்சனை (${data.complaintSummary || data.department}) குறித்து ஏற்கனவே புகார் பதிவு செய்யப்பட்டுள்ளது. முந்தைய புகாரின் நிலையை அறிய விரும்புகிறீர்களா அல்லது புதிய புகாரைப் பதிவு செய்ய விரும்புகிறீர்களா?`;
        } else if (langCode === "ml") {
          duplicateQuestion = `ഈ പ്രശ്നത്തെക്കുറിച്ച് (${data.complaintSummary || data.department}) നേരത്തെ പരാതി രജിസ്റ്റർ ചെയ്തിട്ടുണ്ട്. പഴയ പരാതിയുടെ നില പരിശോധിക്കണോ അതോ புதிய പരാതി നൽകണോ?`;
        } else if (langCode === "en") {
          duplicateQuestion = `We found an existing complaint regarding ${data.complaintSummary || data.department} registered earlier today. Would you like to check its status or register a new complaint?`;
        } else {
          duplicateQuestion = `ಈ ಸಮಸ್ಯೆಯ (${data.complaintSummary || data.department}) ಬಗ್ಗೆ ಇಂದು ಈಗಾಗಲೇ ದೂರು ದಾಖಲಾಗಿದೆ. ನೀವು ಹಳೆಯ ದೂರಿನ ಸ್ಥಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಲು ಬಯಸುವಿರಾ ಅಥವಾ ಹೊಸ ದೂರನ್ನು ದಾಖಲಿಸಬೇಕೇ?`;
        }

        setConfirmationQuestion(duplicateQuestion);
        setStatusText(duplicateQuestion);

        await TTSService.speak(duplicateQuestion, langCode);
        listenForDuplicateChoice(data, langCode);
        return;
      }
    } catch (e) {
      console.warn("Check repeat error:", e);
    }

    // No duplicate: proceed to confirmation
    proceedToConfirmation(data, langCode);
  };

  // --- MEDICINE SPECIAL WORKFLOW HELPERS ---

  const askForMedicineName = async (langCode: string) => {
    setStage("ASKING_MEDICINE_NAME");

    let promptText = "";
    if (langCode === "hi") {
      promptText = "कृपया बताएं कौन सी दवा उपलब्ध नहीं है?";
    } else if (langCode === "te") {
      promptText = "ఏ మందు అందుబాటులో లేదో దయచేసి చెప్పండి?";
    } else if (langCode === "ta") {
      promptText = "எந்த மருந்து கிடைக்கவில்லை என்று தயவுசெய்து கூறவும்?";
    } else if (langCode === "ml") {
      promptText = "ഏത് മരുന്നാണ് ലഭ്യമല്ലാത്തതെന്ന് ദയവായി വ്യക്തമാക്കുക?";
    } else if (langCode === "en") {
      promptText = "Please specify which medicine is not available?";
    } else {
      promptText = "ಯಾವ ಔಷಧಿ ಲಭ್ಯವಿಲ್ಲ ಎಂದು ದಯವಿಟ್ಟು ತಿಳಿಸಿ?";
    }

    setStatusText(promptText);
    setConfirmationQuestion(promptText);

    await TTSService.speak(promptText, langCode);

    // Listen for medicine name
    startSpeechListener((spoken) => {
      if (spoken.trim().length > 1) {
        const cleanMed = spoken.trim();
        setMedicineName(cleanMed);
        setMedInputVal(cleanMed);
      }
    }, langCode);
  };

  // When citizen confirms medicine name (via Voice or "OK / Next" button)
  const handleMedicineNameConfirm = (confirmedMed?: string) => {
    const med = confirmedMed || medInputVal || medicineName;
    if (!med.trim()) return;

    setMedicineName(med.trim());
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    // Immediately move to asking phone number!
    askForCitizenMobile(med.trim(), currentLang);
  };

  const askForCitizenMobile = async (med: string, langCode: string) => {
    setStage("ASKING_PHONE");

    let promptText = "";
    if (langCode === "hi") {
      promptText = `दवा "${med}" उपलब्ध होने पर SMS द्वारा सूचित करने के लिए, कृपया अपना 10 अंकों का मोबाइल नंबर प्रदान करें।`;
    } else if (langCode === "te") {
      promptText = `"${med}" మందు అందుబాటులోకి వచ్చినప్పుడు SMS ద్వారా తెలియజేయడానికి మీ మొబైల్ నంబర్ ఇవ్వండి.`;
    } else if (langCode === "ta") {
      promptText = `"${med}" மருந்து கிடைக்கும்போது SMS மூலம் தெரிவிக்க உங்கள் மொபைல் எண்ணை வழங்கவும்.`;
    } else if (langCode === "ml") {
      promptText = `"${med}" മരുന്ന് ലഭ്യമാകുമ്പോൾ SMS അറിയിപ്പ് നൽകാൻ മൊബൈൽ നമ്പർ നൽകുക.`;
    } else if (langCode === "en") {
      promptText = `Please provide your 10-digit mobile number so we can notify you via SMS when "${med}" becomes available.`;
    } else {
      promptText = `ಔಷಧಿ "${med}" ಲಭ್ಯವಾದಾಗ SMS ಮೂಲಕ ತಿಳಿಸಲು, ದಯವಿಟ್ಟು ನಿಮ್ಮ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನೀಡಿ.`;
    }

    setStatusText(promptText);
    setConfirmationQuestion(promptText);

    await TTSService.speak(promptText, langCode);

    // Listen for spoken phone number digits
    startSpeechListener((spoken) => {
      const digits = TTSService.extractDigits(spoken);
      if (digits.length >= 10) {
        const tenDigits = digits.slice(-10);
        setCitizenPhone(tenDigits);
        setPhoneInputVal(tenDigits);
      }
    }, langCode);
  };

  // When citizen confirms phone number (via Voice or "OK / Next" button)
  const handlePhoneConfirm = (confirmedPhone?: string) => {
    const p = confirmedPhone || phoneInputVal || citizenPhone || "";
    const digits = p.replace(/\D/g, "");
    if (digits.length < 10) {
      const lang = currentLangRef.current || currentLang;
      const invalidPhoneMsg =
        lang === "hi"
          ? "कृपया सही 10 अंकों का मोबाइल नंबर दर्ज करें"
          : lang === "te"
          ? "దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్‌ను నమోదు చేయండి"
          : lang === "ta"
          ? "தயவுசெய்து சரியான 10 இலக்க மொபைல் எண்ணை உள்ளிடவும்"
          : lang === "ml"
          ? "ദയവായി ശരിയായ 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക"
          : lang === "en"
          ? "Please enter a valid 10-digit mobile number"
          : "ದಯವಿಟ್ಟು ಸರಿಯಾದ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ";
      setStatusText(invalidPhoneMsg);
      return;
    }

    const validPhone = digits.slice(-10);
    setCitizenPhone(validPhone);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    // Immediately move to final confirmation!
    proceedToConfirmation(storedGeminiData!, currentLang, medicineName, validPhone);
  };

  // --- DUPLICATE CHOICE LISTENER ---
  const listenForDuplicateChoice = (data: GeminiProcessResult, langCode: string) => {
    startSpeechListener((answer) => {
      const clean = answer.toLowerCase().trim();
      if (
        clean.includes("ಹಳೆಯ") ||
        clean.includes("ಪರಿಶೀಲಿಸಿ") ||
        clean.includes("ಟ್ರ್ಯಾಕ್") ||
        clean.includes("ಸ್ಥಿತಿ") ||
        clean.includes("पुरानी") ||
        clean.includes("पुराना") ||
        clean.includes("ट्रैक") ||
        clean.includes("పాత") ||
        clean.includes("ముந்தைய") ||
        clean.includes("പഴയ") ||
        clean.includes("track") ||
        clean.includes("existing") ||
        clean.includes("status")
      ) {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {}
        }
        handleTrackExistingComplaint(langCode);
      } else if (
        clean.includes("ಹೊಸ") ||
        clean.includes("ದಾಖಲಿಸಿ") ||
        clean.includes("ಹೌದು") ||
        clean.includes("नई") ||
        clean.includes("नया") ||
        clean.includes("दर्ज") ||
        clean.includes("కొత్త") ||
        clean.includes("புதிய") ||
        clean.includes("പുതിയ") ||
        clean.includes("new") ||
        clean.includes("register")
      ) {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {}
        }
        proceedToConfirmation(data, langCode);
      }
    }, langCode);
  };

  // Citizen selects "Track existing complaint"
  const handleTrackExistingComplaint = async (langCode: string = currentLang) => {
    if (!existingRepeatComplaint) return;
    setStage("TRACKING_EXISTING");

    const compId = existingRepeatComplaint.complaintNumber || existingRepeatComplaint.ticketNumber || "JNS-2026-000102";
    const statusRaw = existingRepeatComplaint.status;

    let trackMsg = "";
    if (langCode === "hi") {
      const st = statusRaw === "IN_PROGRESS" ? "प्रगति में" : statusRaw === "VERIFIED" ? "समाधान हो गया" : "दर्ज";
      trackMsg = `आपकी पिछली शिकायत संख्या ${compId} है, और इसकी वर्तमान स्थिति ${st} है।`;
    } else if (langCode === "te") {
      const st = statusRaw === "IN_PROGRESS" ? "పురోగతిలో ఉంది" : statusRaw === "VERIFIED" ? "పరిష్కరించబడింది" : "నమోదైంది";
      trackMsg = `మీ మునుపటి ఫిర్యాదు సంఖ్య ${compId}, మరియు దీని ప్రస్తుత స్థితి ${st}.`;
    } else if (langCode === "ta") {
      const st = statusRaw === "IN_PROGRESS" ? "நடவடிக்கையில் உள்ளது" : statusRaw === "VERIFIED" ? "தீர்க்கப்பட்டது" : "பதிவானது";
      trackMsg = `உங்கள் முந்தைய புகார் எண் ${compId}, அதன் தற்போதைய நிலை ${st}.`;
    } else if (langCode === "ml") {
      const st = statusRaw === "IN_PROGRESS" ? "നടപടികൾ പുരോഗമിക്കുന്നു" : statusRaw === "VERIFIED" ? "പരിഹരിച്ചു" : "രജിസ്റ്റർ ചെയ്തു";
      trackMsg = `താങ്കളുടെ മുൻ പരാതി നമ്പർ ${compId}, നിലവിലെ സ്ഥിതി ${st}.`;
    } else if (langCode === "en") {
      const st = statusRaw === "IN_PROGRESS" ? "In Progress" : statusRaw === "VERIFIED" ? "Resolved" : "Assigned";
      trackMsg = `Your previous complaint number is ${compId}, and its current status is ${st}.`;
    } else {
      const st = statusRaw === "IN_PROGRESS" ? "ಪ್ರಗತಿಯಲ್ಲಿದೆ" : statusRaw === "VERIFIED" ? "ಪರಿಹರಿಸಲಾಗಿದೆ" : "ದಾಖಲಾಗಿದೆ";
      trackMsg = `ನಿಮ್ಮ ಹಿಂದಿನ ದೂರು ಸಂಖ್ಯೆ ${compId}, ಮತ್ತು ಇದರ ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ ${st} ಆಗಿದೆ.`;
    }

    setStatusText(trackMsg);
    setConfirmationQuestion(trackMsg);

    await TTSService.speak(trackMsg, langCode);
  };

  // 5. VOICE-BASED CONFIRMATION IN DETECTED LANGUAGE
  const proceedToConfirmation = async (
    data: GeminiProcessResult,
    langCode: string = currentLang,
    med?: string,
    phone?: string
  ) => {
    setStage("CONFIRMATION");

    let confirmMsg = "";

    if (isMedicineComplaint || med) {
      const medName = med || medicineName || "ಔಷಧಿ";
      const ph = phone || citizenPhone || "";
      if (langCode === "hi") {
        confirmMsg = `आपने बताया कि दवा "${medName}" उपलब्ध नहीं है। उपलब्ध होने पर ${ph} पर SMS भेजा जाएगा। क्या मैं आपकी शिकायत दर्ज कर दूँ?`;
      } else if (langCode === "te") {
        confirmMsg = `మీరు చెప్పిన "${medName}" మందు అందుబాటులో లేదు. అందుబాటులోకి వచ్చినప్పుడు ${ph} కి SMS పంపబడుతుంది. ఈ ఫిర్యాదును నమోదు చేయమంటారా?`;
      } else if (langCode === "ta") {
        confirmMsg = `"${medName}" மருந்து கிடைக்கவில்லை என்று தெரிவித்துள்ளீர்கள். கிடைத்ததும் ${ph} எண்ணிற்கு SMS அனுப்பப்படும். புகாரை பதிவு செய்யலாமா?`;
      } else if (langCode === "ml") {
        confirmMsg = `"${medName}" മരുന്ന് ലഭ്യമല്ല എന്ന് അറിയിച്ചിട്ടുണ്ട്. ലഭ്യമാകുമ്പോൾ ${ph} നമ്പറിലേക്ക് SMS അയക്കും. പരാതി രജിസ്റ്റർ ചെയ്യട്ടെ?`;
      } else if (langCode === "en") {
        confirmMsg = `You reported that medicine "${medName}" is unavailable. An SMS alert will be sent to ${ph} when available. Shall I submit this complaint?`;
      } else {
        confirmMsg = `ಔಷಧಿ "${medName}" ಲಭ್ಯವಿಲ್ಲ ಎಂದು ನೀವು ವರದಿ ಮಾಡಿದ್ದೀರಿ. ಲಭ್ಯವಾದಾಗ ${ph} ಸಂಖ್ಯೆಗೆ SMS ಕಳುಹಿಸಲಾಗುವುದು. ಈ ದೂರನ್ನು ದಾಖಲಿಸಲೆ?`;
      }
    } else {
      const cleanSummary = data?.complaintSummary || data?.originalTranscript || summary;
      if (langCode === "hi") {
        confirmMsg = `आपने अस्पताल में "${cleanSummary}" की शिकायत दर्ज की है। क्या मैं यह शिकायत संबंधित अधिकारियों को भेज दूँ?`;
      } else if (langCode === "te") {
        confirmMsg = `మీరు చెప్పిన సమస్య: "${cleanSummary}"। ఈ ఫిర్యాదును అధికారులకు పంపించమంటారా?`;
      } else if (langCode === "ta") {
        confirmMsg = `நீங்கள் கூறிய பிரச்சனை: "${cleanSummary}"। இந்த புகாரை பதிவு செய்யலாமா?`;
      } else if (langCode === "ml") {
        confirmMsg = `താങ്കൾ അറിയിച്ച പ്രശ്നം: "${cleanSummary}"। ഈ പരാതി സമർപ്പിക്കട്ടെ?`;
      } else if (langCode === "en") {
        confirmMsg = `You reported that ${cleanSummary}. Shall I forward this complaint to the hospital authorities?`;
      } else {
        confirmMsg = `ಆಸ್ಪತ್ರೆಯಲ್ಲಿ "${cleanSummary}" ಬಗ್ಗೆ ನೀವು ವರದಿ ಮಾಡಿದ್ದೀರಿ. ಈ ದೂರನ್ನು ಸಂಬಂಧಪಟ್ಟ ಅಧಿಕಾರಿಗಳಿಗೆ ಕಳುಹಿಸಲೆ?`;
      }
    }

    setConfirmationQuestion(confirmMsg);
    setStatusText(confirmMsg);

    await TTSService.speak(confirmMsg, langCode);

    // Listen for verbal Yes/No in detected language
    startSpeechListener((answer) => {
      const verdict = TTSService.parseYesNo(answer, langCode);
      if (verdict === "YES") {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {}
        }
        submitComplaint();
      } else if (verdict === "NO") {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {}
        }
        cancelComplaint();
      }
    }, langCode);
  };

  // 6. SUBMIT COMPLAINT (IMMEDIATELY ADVANCES - NO REPLAYING OR LOOPS)
  const submitComplaint = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setStage("SUBMITTING");

    const langCode = currentLangRef.current || "kn";
    const processingMsg =
      langCode === "hi"
        ? "आपकी शिकायत दर्ज की जा रही है..."
        : langCode === "te"
        ? "మీ ఫిర్యాదు నమోదు చేయబడుతోంది..."
        : langCode === "ta"
        ? "உங்கள் புகார் பதிவு செய்யப்படுகிறது..."
        : langCode === "ml"
        ? "പരാതി രജിസ്റ്റർ ചെയ്യുന്നു..."
        : langCode === "en"
        ? "Registering your grievance..."
        : "ನಿಮ್ಮ ದೂರನ್ನು ದಾಖಲಿಸಲಾಗುತ್ತಿದೆ...";

    setStatusText(processingMsg);

    try {
      const idempotencyKey = `kiosk-${transcript.trim().slice(0, 15)}-${Date.now()}`;
      const payload: any = {
        idempotencyKey,
        originalTranscript: transcript,
        originalLanguage: detectedLangName,
        languageCode: langCode,
        englishTranslation: englishTranslationText || summary,
        summary: isMedicineComplaint
          ? `Medicine unavailable: ${medicineName || summary}`
          : (summary || transcript.slice(0, 80)),
        category: isMedicineComplaint ? "Pharmacy and Medicine Availability" : (categoryName || "Hospital Services"),
        department: isMedicineComplaint ? "Pharmacy and Medicine Availability" : (departmentName || "Hospital Services"),
        priority: priorityVal || "Medium",
        location: "Victoria District Hospital - Kiosk #1",
        source: "VOICE_KIOSK",
        isMedicineComplaint,
        medicineName: isMedicineComplaint ? medicineName : undefined,
        citizenPhone: isMedicineComplaint ? citizenPhone : undefined,
        citizenName: isMedicineComplaint ? "Citizen" : undefined,
        visibility: isMedicineComplaint ? "PRIVATE" : "PUBLIC",
      };

      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success && data.complaint) {
        const finalComplaint = data.complaint;
        setReceipt(finalComplaint.receipt || null);
        setStage("COMPLETED");

        const complaintId = finalComplaint.complaintNumber || finalComplaint.ticketNumber || "HOSP-2026-00125";

        let successSpeech = "";
        if (langCode === "hi") {
          successSpeech = `धन्यवाद। आपकी शिकायत सफलतापूर्वक दर्ज कर ली गई है। आपकी शिकायत संख्या है ${complaintId}। कृपया अपनी रसीद प्राप्त करें।`;
        } else if (langCode === "te") {
          successSpeech = `ధన్యవాదాలు. మీ ఫిర్యాదు విజయవంతంగా నమోదైంది. మీ ఫిర్యాదు సంఖ్య ${complaintId}. దయచేసి మీ రసీదును తీసుకోండి.`;
        } else if (langCode === "ta") {
          successSpeech = `நன்றி. உங்கள் புகார் வெற்றிகரமாக பதிவு செய்யப்பட்டுள்ளது. உங்கள் புகார் எண் ${complaintId}. தயவுசெய்து ரசீதை பெற்றுக்கொள்ளவும்.`;
        } else if (langCode === "ml") {
          successSpeech = `നന്ദി. താങ്കളുടെ പരാതി വിജയകരമായി രജിസ്റ്റർ ചെയ്തു. പരാതി നമ്പർ ${complaintId}. രസീത് കൈപ്പറ്റുക.`;
        } else if (langCode === "en") {
          successSpeech = `Thank you. Your complaint has been successfully registered. Your complaint ID is ${complaintId}. Please keep this receipt for tracking.`;
        } else {
          successSpeech = `ಧನ್ಯವಾದಗಳು. ನಿಮ್ಮ ದೂರು ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಾಗಿದೆ. ನಿಮ್ಮ ದೂರು ಸಂಖ್ಯೆ ${complaintId}. ದಯವಿಟ್ಟು ರಶೀದಿಯನ್ನು ಸಂಗ್ರಹಿಸಿ.`;
        }

        setStatusText(successSpeech);

        // Announce ID aloud in citizen's detected language
        await TTSService.speak(successSpeech, langCode);
      } else {
        const retryErr =
          langCode === "hi"
            ? "दर्ज करने में समस्या आई। कृपया पुनः प्रयास करें।"
            : langCode === "te"
            ? "ఫిర్యాదు నమోదు కాలేదు. దయచేసి మళ్ళీ ప్రయత్నించండి."
            : langCode === "ta"
            ? "பதிவு செய்வதில் சிக்கல். தயவுசெய்து மீண்டும் முயற்சிக்கவும்."
            : langCode === "ml"
            ? "രജിസ്ട്രേഷൻ പരാജയപ്പെട്ടു. ദയവായി വീണ്ടും ശ്രമിക്കുക."
            : langCode === "en"
            ? "Failed to register. Please tap OK to retry."
            : "ದಾಖಲಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.";
        setStatusText(retryErr);
        setStage("CONFIRMATION");
      }
    } catch (err) {
      console.error("[Complaint Submission Error]", err);
      const errAlert =
        langCode === "hi"
          ? "त्रुटि हुई। कृपया पुनः प्रयास करें।"
          : langCode === "te"
          ? "లోపం సంభవించింది. దయచేసి మళ్ళీ ప్రయత్నించండి."
          : langCode === "ta"
          ? "பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்."
          : langCode === "ml"
          ? "ഒരു പിശക് സംഭവിച്ചു. ദയവായി വീണ്ടും ശ്രമിക്കുക."
          : langCode === "en"
          ? "An error occurred. Please try again."
          : "ದೋಷ ಸಂಭವಿಸಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.";
      setStatusText(errAlert);
      setStage("CONFIRMATION");
    } finally {
      isSubmittingRef.current = false;
    }
  };

  // Citizen confirms "No" -> cancel and allow user to speak again
  const cancelComplaint = async () => {
    const langCode = currentLangRef.current || "kn";
    let cancelMsg = "";

    if (langCode === "hi") {
      cancelMsg = "ठीक है, यह शिकायत रद्द कर दी गई है। कृपया अपनी समस्या दोबारा बताएं।";
    } else if (langCode === "te") {
      cancelMsg = "సరే, ఈ ఫిర్యాదు రద్దు చేయబడింది. దయచేసి మీ సమస్యను మళ్లీ చెప్పండి.";
    } else if (langCode === "ta") {
      cancelMsg = "சரி, இந்த புகார் ரத்து செய்யப்பட்டது. உங்கள் பிரச்சனையை மீண்டும் கூறவும்.";
    } else if (langCode === "ml") {
      cancelMsg = "ശരി, ഈ പരാതി റദ്ദാക്കി. താങ്കൾക്ക് വീണ്ടും പറയാം.";
    } else if (langCode === "en") {
      cancelMsg = "Understood. The complaint has been cancelled. Please state your issue again.";
    } else {
      cancelMsg = "ಸರಿ, ಈ ದೂರನ್ನು ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ.";
    }

    setStatusText(cancelMsg);
    await TTSService.speak(cancelMsg, langCode);
    handleStartVoiceInteraction();
  };

  // Handle unclear audio gracefully in detected language
  const handleUnclearSpeech = async (promptMessage: string) => {
    setStatusText(promptMessage);
    await TTSService.speak(promptMessage, currentLang);
    setTimeout(() => {
      setStage("IDLE");
      setStatusText("");
    }, 2500);
  };

  // Reset kiosk back to completely clean initial screen
  const resetKiosk = () => {
    TTSService.stop();
    stopMediaRecording();
    setStage("IDLE");
    setTranscript("");
    setConfirmationQuestion("");
    setSummary("");
    setEnglishTranslationText("");
    setStatusText("");
    setReceipt(null);
    setExistingRepeatComplaint(null);
    setStoredGeminiData(null);
    setIsMedicineComplaint(false);
    setMedicineName("");
    setCitizenPhone("");
    setMedInputVal("");
    setPhoneInputVal("");
    setCurrentLang("kn");
    setDetectedLangName("Kannada");
  };

  return (
    <div className="min-h-screen bg-[#F5F8F7] flex flex-col justify-between p-6 sm:p-12 select-none relative overflow-hidden">
      {/* TOP BAR: MINIMAL CLEAN HEADER */}
      <header className="flex items-center justify-between w-full max-w-5xl mx-auto">
        <Link
          href="/"
          className="text-xs font-semibold text-[#607477] hover:text-[#12343B] transition-colors"
        >
          JANASUVIDHA
        </Link>
        <div className="flex items-center gap-3">
          {stage !== "IDLE" && (
            <span className="text-[11px] font-bold text-[#147D78] bg-[#E8F4F1] px-3 py-1 rounded-full border border-[#147D78]/20">
              {detectedLangName} ({(currentLang || "kn").toUpperCase()})
            </span>
          )}
          <Link
            href="/citizen/kiosk/report"
            className="text-xs sm:text-sm font-semibold text-[#147D78] hover:text-[#0e5e5a] transition-colors bg-[#E8F4F1] px-4 py-2 rounded-full border border-[#147D78]/20"
          >
            Public Grievance Board
          </Link>
        </div>
      </header>

      {/* CENTER: THE MULTILINGUAL VOICE-FIRST EXPERIENCE */}
      <main className="flex-1 flex flex-col items-center justify-center text-center max-w-xl mx-auto w-full my-auto py-8">
        {/* COMPLETED: SUCCESS SCREEN WITH COMPLAINT ID & RECEIPT */}
        {stage === "COMPLETED" ? (
          <div className="space-y-6 w-full animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-[#E8F4F1] text-[#147D78] flex items-center justify-center mx-auto shadow-xs no-print">
              <Check className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-1.5 no-print">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#12343B]">
                {currentLang === "hi"
                  ? "आपकी शिकायत सफलतापूर्वक दर्ज कर ली गई है"
                  : currentLang === "te"
                  ? "మీ ఫిర్యాదు విజయవంతంగా నమోదైంది"
                  : currentLang === "ta"
                  ? "உங்கள் புகார் வெற்றிகரமாக பதிவு செய்யப்பட்டுள்ளது"
                  : currentLang === "ml"
                  ? "താങ്കളുടെ പരാതി വിജയകരമായി രജിസ്റ്റർ ചെയ്തു"
                  : currentLang === "en"
                  ? "Your Grievance Has Been Successfully Registered"
                  : "ನಿಮ್ಮ ದೂರು ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಾಗಿದೆ"}
              </h2>
              {isMedicineComplaint && citizenPhone && (
                <div className="bg-[#E8F4F1] border border-[#147D78]/30 rounded-xl p-3 max-w-md mx-auto text-xs text-[#147D78] font-semibold flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>
                    SMS notification will be sent to <strong>XXXXXX{citizenPhone.slice(-4)}</strong> when {medicineName || "medicine"} arrives.
                  </span>
                </div>
              )}
              <p className="text-xs text-[#607477]">
                {currentLang === "hi"
                  ? "कृपया नीचे दी गई पावती रसीद को सुरक्षित रखें।"
                  : currentLang === "en"
                  ? "Please keep the acknowledgement receipt below for tracking."
                  : "ದಯವಿಟ್ಟು ಕೆಳಗಿನ ಸ್ವೀಕೃತಿ ರಶೀದಿಯನ್ನು ಸುರಕ್ಷಿತವಾಗಿರಿಸಿಕೊಳ್ಳಿ."}
              </p>
            </div>

            {/* PRINTABLE COMPLAINT RECEIPT CARD */}
            {receipt && (
              <div className="w-full flex justify-center">
                <ComplaintReceiptCard receipt={receipt} />
              </div>
            )}

            <div className="pt-2 no-print">
              <button
                type="button"
                onClick={resetKiosk}
                className="inline-flex items-center gap-2 bg-[#147D78] hover:bg-[#0e5e5a] text-white text-xs font-semibold px-6 py-3 rounded-xl shadow-xs transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>ಮತ್ತೊಂದು ದೂರು ದಾಖಲಿಸಿ / Report Another Issue</span>
              </button>
            </div>
          </div>
        ) : stage === "ASKING_MEDICINE_NAME" ? (
          /* MEDICINE WORKFLOW STEP 1: SPECIFY MEDICINE NAME */
          <div className="space-y-6 w-full max-w-lg mx-auto animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center mx-auto animate-pulse">
              <Pill className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider bg-blue-100 px-3 py-1 rounded-full border border-blue-300 inline-block">
                ಔಷಧ ಲಭ್ಯತೆ ವಿನಂತಿ / Medicine Availability
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#12343B] leading-snug">
                "{confirmationQuestion}"
              </h2>
              <p className="text-xs text-[#607477]">
                ಔಷಧಿಯ ಹೆಸರನ್ನು ಧ್ವನಿ ಮೂಲಕ ಹೇಳಿ ಅಥವಾ ಕೆಳಗೆ ನಮೂದಿಸಿ "ಸರಿ / OK" ಒತ್ತಿ:
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="relative">
                <input
                  type="text"
                  value={medInputVal}
                  onChange={(e) => setMedInputVal(e.target.value)}
                  placeholder="ಉದಾಹರಣೆ: Paracetamol 500mg, Insulin, Dolo..."
                  className="w-full text-sm font-semibold text-[#12343B] p-3.5 rounded-2xl border-2 border-[#147D78]/30 bg-white focus:outline-none focus:border-[#147D78] text-center"
                />
              </div>

              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleMedicineNameConfirm()}
                  disabled={!medInputVal.trim()}
                  className="flex items-center gap-2 bg-[#147D78] hover:bg-[#0e5e5a] disabled:opacity-50 text-white font-bold text-sm px-8 py-3 rounded-2xl shadow-sm transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>ಮುಂದೆ / OK (Next)</span>
                </button>
              </div>
            </div>
          </div>
        ) : stage === "ASKING_PHONE" ? (
          /* MEDICINE WORKFLOW STEP 2: COLLECT 10-DIGIT MOBILE NUMBER FOR SMS */
          <div className="space-y-6 w-full max-w-lg mx-auto animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto animate-pulse">
              <Phone className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 inline-block">
                SMS ಅಧಿಸೂಚನೆಗಾಗಿ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ / Mobile for SMS Alert
              </span>
              <h2 className="text-base sm:text-lg font-bold text-[#12343B] leading-snug">
                "{confirmationQuestion}"
              </h2>
              <p className="text-xs text-[#607477]">
                ಔಷಧಿ: <strong className="text-[#147D78]">{medicineName}</strong>
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="relative max-w-xs mx-auto">
                <input
                  type="tel"
                  maxLength={10}
                  value={phoneInputVal}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "");
                    setPhoneInputVal(clean);
                    setCitizenPhone(clean);
                  }}
                  placeholder="9876543210"
                  className="w-full text-lg tracking-widest font-mono font-bold text-[#12343B] p-3.5 rounded-2xl border-2 border-[#147D78]/30 bg-white focus:outline-none focus:border-[#147D78] text-center"
                />
              </div>

              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handlePhoneConfirm()}
                  disabled={phoneInputVal.length < 10}
                  className="flex items-center gap-2 bg-[#147D78] hover:bg-[#0e5e5a] disabled:opacity-50 text-white font-bold text-sm px-8 py-3 rounded-2xl shadow-sm transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>ಖಚಿತಪಡಿಸಿ / OK (Confirm)</span>
                </button>
              </div>
            </div>
          </div>
        ) : stage === "TRACKING_EXISTING" && existingRepeatComplaint ? (
          /* TRACKING EXISTING COMPLAINT SCREEN */
          <div className="space-y-6 w-full max-w-lg mx-auto animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-full bg-[#E8F4F1] text-[#147D78] flex items-center justify-center mx-auto">
              <Search className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#147D78] uppercase tracking-wider bg-[#E8F4F1] px-3 py-1 rounded-full border border-[#147D78]/20 inline-block">
                {currentLang === "hi"
                  ? "मौजूदा शिकायत की स्थिति"
                  : currentLang === "en"
                  ? "Existing Complaint Status"
                  : "ಪ್ರಸ್ತುತ ದೂರಿನ ಸ್ಥಿತಿ"}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#12343B]">
                {currentLang === "hi" ? "शिकायत संख्या:" : currentLang === "en" ? "Complaint ID:" : "ದೂರು ಸಂಖ್ಯೆ:"}{" "}
                <strong className="font-mono text-[#147D78]">
                  {existingRepeatComplaint.complaintNumber || existingRepeatComplaint.ticketNumber}
                </strong>
              </h2>
              <p className="text-xs text-[#607477]">
                {currentLang === "hi" ? "स्थिति:" : currentLang === "en" ? "Status:" : "ಸ್ಥಿತಿ:"}{" "}
                <strong className="text-[#12343B] font-semibold">
                  {existingRepeatComplaint.status === "IN_PROGRESS"
                    ? "ಪ್ರಗತಿಯಲ್ಲಿದೆ (In Progress)"
                    : existingRepeatComplaint.status === "VERIFIED"
                    ? "ಪರಿಹರಿಸಲಾಗಿದೆ (Resolved)"
                    : "ದಾಖಲಾಗಿದೆ (Assigned)"}
                </strong>
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-[#E2EBE8] text-left text-xs space-y-2 shadow-2xs">
              <div>
                <span className="text-[#607477] text-[11px] block">
                  {currentLang === "hi" ? "समस्या:" : currentLang === "en" ? "Issue:" : "ಸಮಸ್ಯೆ:"}
                </span>
                <strong className="text-[#12343B]">{existingRepeatComplaint.summary}</strong>
              </div>
              <div>
                <span className="text-[#607477] text-[11px] block">
                  {currentLang === "hi" ? "विभाग:" : currentLang === "en" ? "Department:" : "ವಿಭಾಗ:"}
                </span>
                <span className="text-[#12343B] font-medium">{existingRepeatComplaint.departmentName}</span>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => storedGeminiData && proceedToConfirmation(storedGeminiData, currentLang)}
                className="py-3 px-5 bg-[#147D78] hover:bg-[#0e5e5a] text-white text-xs font-bold rounded-2xl shadow-xs transition-all cursor-pointer"
              >
                ಹೊಸ ದೂರು ದಾಖಲಿಸಿ / Register New
              </button>
              <button
                type="button"
                onClick={resetKiosk}
                className="py-3 px-5 bg-white hover:bg-slate-50 border border-[#E2EBE8] text-[#607477] text-xs font-bold rounded-2xl transition-colors cursor-pointer"
              >
                ಮುಕ್ತಾಯ / Done
              </button>
            </div>
          </div>
        ) : stage === "DUPLICATE_CHECK" ? (
          /* INTELLIGENT DUPLICATE COMPLAINT DETECTION SCREEN */
          <div className="space-y-6 w-full max-w-lg mx-auto animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto animate-pulse">
              <Volume2 className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider bg-amber-100 px-3 py-1 rounded-full border border-amber-300 inline-block">
                {currentLang === "hi"
                  ? "समान शिकायत पहले से दर्ज है"
                  : currentLang === "en"
                  ? "Similar Complaint Found"
                  : "ಸಮಾನ ದೂರು ಈಗಾಗಲೇ ದಾಖಲಾಗಿದೆ"}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#12343B] leading-snug">
                "{confirmationQuestion}"
              </h2>
              <p className="text-xs text-[#607477]">
                {currentLang === "hi"
                  ? "बोलकर बताएं ('पुरानी शिकायत' या 'नई शिकायत') या नीचे चुनें:"
                  : currentLang === "en"
                  ? "Speak your choice ('Track Existing' or 'New Complaint') or select below:"
                  : "ಧ್ವನಿ ಮೂಲಕ ತಿಳಿಸಿ ('ಹಳೆಯ ದೂರು' ಅಥವಾ 'ಹೊಸ ದೂರು') ಅಥವಾ ಆಯ್ಕೆಮಾಡಿ:"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleTrackExistingComplaint(currentLang)}
                className="py-3.5 px-4 bg-white hover:bg-[#E8F4F1] border border-[#147D78]/30 text-[#147D78] text-xs font-bold rounded-2xl text-left shadow-2xs transition-all flex items-center justify-between cursor-pointer"
              >
                <span>
                  {currentLang === "hi"
                    ? "1. पुरानी शिकायत ट्रैक करें"
                    : currentLang === "en"
                    ? "1. Track Existing Complaint"
                    : "1. ಹಳೆಯ ದೂರು ಪರಿಶೀಲಿಸಿ"}
                </span>
                <Search className="w-4 h-4 text-[#147D78] shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => storedGeminiData && proceedToConfirmation(storedGeminiData, currentLang)}
                className="py-3.5 px-4 bg-white hover:bg-slate-50 border border-[#E2EBE8] text-[#12343B] text-xs font-bold rounded-2xl text-left shadow-2xs transition-all flex items-center justify-between cursor-pointer"
              >
                <span>
                  {currentLang === "hi"
                    ? "2. नई शिकायत दर्ज करें"
                    : currentLang === "en"
                    ? "2. Register New Complaint"
                    : "2. ಹೊಸ ದೂರು ದಾಖಲಿಸಿ"}
                </span>
                <ArrowRight className="w-4 h-4 text-[#607477] shrink-0" />
              </button>
            </div>
          </div>
        ) : stage === "CONFIRMATION" ? (
          /* FINAL CONFIRMATION STAGE: OK / SUBMIT (IMMEDIATE ADVANCE) */
          <div className="space-y-8 w-full animate-in fade-in duration-200">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#E8F4F1] text-[#147D78] flex items-center justify-center mx-auto animate-pulse">
                <Volume2 className="w-7 h-7" />
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-[#12343B] leading-relaxed max-w-lg mx-auto">
                "{confirmationQuestion}"
              </h2>

              <p className="text-xs text-[#607477]">
                {currentLang === "hi"
                  ? "बोलकर उत्तर दें ('हाँ' या 'नहीं') या नीचे 'OK' दबाएं:"
                  : currentLang === "en"
                  ? "Speak your answer ('Yes' or 'No') or tap OK below:"
                  : "ಧ್ವನಿ ಮೂಲಕ 'ಹೌದು' / 'ಇಲ್ಲ' ಎಂದು ಹೇಳಿ ಅಥವಾ ಕೆಳಗೆ 'OK' ಒತ್ತಿ:"}
              </p>
            </div>

            {/* GREEN YES / RED NO ACCESSIBLE BUTTONS */}
            <div className="flex justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={submitComplaint}
                className="flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm sm:text-base px-8 py-3.5 rounded-2xl shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>
                  {currentLang === "hi"
                    ? "हाँ / OK (दर्ज करें)"
                    : currentLang === "te"
                    ? "అవును / OK (నమోదు చేయి)"
                    : currentLang === "ta"
                    ? "ஆம் / OK (பதிவு செய்)"
                    : currentLang === "ml"
                    ? "അതെ / OK (രജിസ്റ്റർ ചെയ്യുക)"
                    : currentLang === "en"
                    ? "Yes / OK (Submit)"
                    : "ಹೌದು / OK (ದಾಖಲಿಸಿ)"}
                </span>
              </button>

              <button
                type="button"
                onClick={cancelComplaint}
                className="flex items-center gap-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-sm sm:text-base px-8 py-3.5 rounded-2xl shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
                <span>
                  {currentLang === "hi"
                    ? "नहीं (सुधारें)"
                    : currentLang === "te"
                    ? "కాదు (సవరించు)"
                    : currentLang === "ta"
                    ? "இல்லை (மாற்று)"
                    : currentLang === "ml"
                    ? "അല്ല (തിരുത്തുക)"
                    : currentLang === "en"
                    ? "No (Cancel)"
                    : "ಇಲ್ಲ (ರದ್ದುಮಾಡಿ)"}
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* INITIAL CLEAN SCREEN (IDLE) OR LISTENING / ANALYZING / SUBMITTING */
          <div className="space-y-8 flex flex-col items-center">
            {/* MICROPHONE BUTTON WITH SOUNDWAVE */}
            <div className="relative flex items-center justify-center w-full min-h-[220px] sm:min-h-[260px]">
              {stage === "LISTENING" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
                  <div className="w-full h-full max-w-2xl relative animate-in fade-in zoom-in-95 duration-500">
                    <WebThreads
                      colors={["#147D78", "#2DD4BF", "#12343B", "#48d265"]}
                      coreColor="#147D78"
                      threadCount={8}
                      spread={0.22}
                      speed={0.25}
                      frequency={5}
                      lightMode={true}
                      thickness={1.3}
                      glow={0.03}
                      shimmer={true}
                      pulses={0.3}
                      mouseInteraction={true}
                      pulseOnClick={true}
                      backgroundColor="transparent"
                    />
                  </div>
                </div>
              )}
              {stage === "LISTENING" && (
                <div className="absolute w-44 h-44 rounded-full bg-[#147D78]/20 animate-ping pointer-events-none" />
              )}
              <button
                type="button"
                onClick={
                  stage === "IDLE"
                    ? handleStartVoiceInteraction
                    : stage === "LISTENING"
                    ? stopListeningManual
                    : undefined
                }
                disabled={stage === "ANALYZING" || stage === "SUBMITTING"}
                aria-label="ಧ್ವನಿ ಮೂಲಕ ಮಾತನಾಡಲು ಮೈಕ್ರೊಫೋನ್ ಒತ್ತಿ"
                className={`relative z-10 flex items-center justify-center w-36 h-36 sm:w-44 sm:h-44 rounded-full transition-all duration-300 shadow-md ${
                  stage === "LISTENING"
                    ? "bg-[#147D78] text-white scale-105 shadow-xl ring-8 ring-[#147D78]/20 cursor-pointer"
                    : "bg-[#147D78] hover:bg-[#0e5e5a] text-white hover:scale-105 active:scale-95 cursor-pointer"
                }`}
              >
                <Mic className="w-16 h-16 sm:w-20 sm:h-20" />
              </button>
            </div>

            {/* INSTRUCTION & STATUS */}
            <div className="space-y-3">
              <p className="text-lg sm:text-xl font-medium text-[#12343B]">
                {stage === "IDLE"
                  ? "ಮೈಕ್ರೊಫೋನ್ ಒತ್ತಿ ಮಾತನಾಡಿ / बोलने के लिए माइक दबाएं / Tap to Start Speaking"
                  : stage === "LISTENING"
                  ? "ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ... / सुन रहा हूँ... / Listening... Speak your issue"
                  : stage === "ANALYZING"
                  ? statusText || "ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ... / Analyzing..."
                  : stage === "SUBMITTING"
                  ? statusText || "ದಾಖಲಿಸಲಾಗುತ್ತಿದೆ... / Registering..."
                  : statusText}
              </p>

              {/* Citizen completion button during LISTENING */}
              {stage === "LISTENING" && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={stopListeningManual}
                    className="inline-flex items-center gap-2 bg-[#147D78] hover:bg-[#0e5e5a] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-md transition-all active:scale-95 animate-pulse cursor-pointer"
                  >
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                    <span>✓ ಮಾತನಾಡಿ ಮುಗಿದಿದೆ / बात समाप्त / Done / పూర్తియింది</span>
                  </button>
                </div>
              )}

              {/* Real-time recognized voice feedback */}
              {transcript ? (
                <div className="bg-[#E8F4F1] border border-[#147D78]/20 px-4 py-2.5 rounded-xl max-w-md mx-auto shadow-2xs animate-in fade-in">
                  <p className="text-xs font-semibold text-[#147D78] mb-1 flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#147D78] animate-pulse" />
                    <span>ಗುರುತಿಸಲಾದ ಮಾತು / पहचान की गई आवाज़:</span>
                  </p>
                  <p className="text-sm text-[#12343B] font-medium italic">
                    "{transcript}"
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </main>

      {/* BOTTOM: Hospital Context Footer */}
      <footer className="text-center text-xs text-[#607477]/60 no-print">
        ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆ ಕುಂದುಕೊರತೆ ನಿವಾರಣಾ ವ್ಯವಸ್ಥೆ • Multilingual AI Voice Assistant
      </footer>
    </div>
  );
}
