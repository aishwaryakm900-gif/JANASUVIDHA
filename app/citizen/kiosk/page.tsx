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
  Sparkles,
  Radio,
} from "lucide-react";
import WebThreads from "@/components/WebThreads";
import { ComplaintReceiptCard } from "@/components/ComplaintReceiptCard";
import { ComplaintItem, ComplaintReceipt, GeminiProcessResult } from "@/types";
import { useGemini38LiveVoice } from "@/lib/services/gemini-live.service";
import { TTSService } from "@/lib/services/tts.service";

type KioskStage =
  | "IDLE"
  | "GEMINI_LIVE_CONVERSATION"
  | "ANALYZING"
  | "ASKING_MEDICINE_NAME"
  | "ASKING_PHONE"
  | "DUPLICATE_CHECK"
  | "TRACKING_EXISTING"
  | "CONFIRMATION"
  | "SUBMITTING"
  | "COMPLETED";

const UI_TEXT: Record<string, {
  headerTitle: string;
  publicBoard: string;
  idlePrompt: string;
  agentListening: string;
  doneButton: string;
  detectedSpeech: string;
  confirmYes: string;
  confirmNo: string;
  regSuccess: string;
  reportAnother: string;
  keepReceipt: string;
  medAvailability: string;
  medPrompt: string;
  nextButton: string;
  phonePrompt: string;
  confirmPhone: string;
  similarFound: string;
  trackOld: string;
  registerNew: string;
  oldStatusTitle: string;
  oldStatusId: string;
  finish: string;
  smsAlertNotice: string;
  medicineLabel: string;
  medicinePlaceholder: string;
}> = {
  en: {
    headerTitle: "JANASUVIDHA",
    publicBoard: "Public Grievance Board",
    idlePrompt: "Tap to talk with Gemini 3.8 Live Voice Agent",
    agentListening: "Gemini 3.8 Live is listening & speaking...",
    doneButton: "✓ Finish & Review Complaint",
    detectedSpeech: "Recognized Speech",
    confirmYes: "Yes / OK (Submit)",
    confirmNo: "No (Cancel / Rephrase)",
    regSuccess: "Your Grievance Has Been Successfully Registered",
    reportAnother: "Report Another Issue",
    keepReceipt: "Please keep this slip for future reference & tracking.",
    medAvailability: "Medicine Availability Request",
    medPrompt: "Specify the unavailable medicine:",
    nextButton: "Next / OK",
    phonePrompt: "Enter 10-digit mobile number for SMS alert:",
    confirmPhone: "Confirm Mobile Number",
    similarFound: "Similar Complaint Found",
    trackOld: "1. Track Existing Complaint",
    registerNew: "2. Register New Complaint",
    oldStatusTitle: "Existing Complaint Status",
    oldStatusId: "Complaint ID:",
    finish: "Finish",
    smsAlertNotice: "SMS notification will be sent when medicine arrives.",
    medicineLabel: "Medicine:",
    medicinePlaceholder: "Enter medicine name",
  },
  kn: {
    headerTitle: "ಜನಸುವಿಧಾ",
    publicBoard: "ಸಾರ್ವಜನಿಕ ಕುಂದುಕೊರತೆ ಫಲಕ",
    idlePrompt: "ಜೆಮಿನಿ 3.8 ಲೈವ್ ಧ್ವನಿ ಸಹಾಯಕನೊಂದಿಗೆ ಮಾತನಾಡಲು ಒತ್ತಿ",
    agentListening: "ಜೆಮಿನಿ 3.8 ಲೈವ್ ಮಾತನಾಡುತ್ತಿದೆ ಮತ್ತು ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದೆ...",
    doneButton: "✓ ಮಾತನಾಡಿ ಮುಗಿದಿದೆ (ಪರಿಶೀಲಿಸಿ)",
    detectedSpeech: "ಗುರುತಿಸಲಾದ ಮಾತು",
    confirmYes: "ಹೌದು / OK (ದಾಖಲಿಸಿ)",
    confirmNo: "ಇಲ್ಲ (ರದ್ದುಮಾಡಿ)",
    regSuccess: "ನಿಮ್ಮ ದೂರು ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಾಗಿದೆ",
    reportAnother: "ಮತ್ತೊಂದು ದೂರು ದಾಖಲಿಸಿ",
    keepReceipt: "ಮುಂದಿನ ಪರಿಶೀಲನೆಗಾಗಿ ಈ ರಶೀದಿಯನ್ನು ಸುರಕ್ಷಿತವಾಗಿರಿಸಿಕೊಳ್ಳಿ.",
    medAvailability: "ಔಷಧ ಲಭ್ಯತೆ ವಿನಂತಿ",
    medPrompt: "ಲಭ್ಯವಿಲ್ಲದ ಔಷಧಿಯ ಹೆಸರನ್ನು ನಮೂದಿಸಿ:",
    nextButton: "ಮುಂದೆ / OK",
    phonePrompt: "SMS ಗಾಗಿ ನಿಮ್ಮ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನೀಡಿ:",
    confirmPhone: "ಖಚಿತಪಡಿಸಿ / OK",
    similarFound: "ಸಮಾನ ದೂರು ಈಗಾಗಲೇ ದಾಖಲಾಗಿದೆ",
    trackOld: "1. ಹಳೆಯ ದೂರು ಪರಿಶೀಲಿಸಿ",
    registerNew: "2. ಹೊಸ ದೂರು ದಾಖಲಿಸಿ",
    oldStatusTitle: "ಪ್ರಸ್ತುತ ದೂರಿನ ಸ್ಥಿತಿ",
    oldStatusId: "ದೂರು ಸಂಖ್ಯೆ:",
    finish: "ಮುಕ್ತಾಯ / Done",
    smsAlertNotice: "ಔಷಧಿ ಲಭ್ಯವಾದ ತಕ್ಷಣ ಈ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಗೆ SMS ಕಳುಹಿಸಲಾಗುವುದು.",
    medicineLabel: "ಔಷಧಿ:",
    medicinePlaceholder: "ಔಷಧಿಯ ಹೆಸರನ್ನು ನಮೂದಿಸಿ",
  },
  hi: {
    headerTitle: "जनसुविधा",
    publicBoard: "सार्वजनिक शिकायत बोर्ड",
    idlePrompt: "जेमिनी 3.8 लाइव वॉयस एजेंट से बात करने के लिए टैप करें",
    agentListening: "जेमिनी 3.8 लाइव सुन रहा है और बोल रहा है...",
    doneButton: "✓ बात समाप्त (दर्ज करें)",
    detectedSpeech: "पहचान की गई आवाज़",
    confirmYes: "हाँ / OK (दर्ज करें)",
    confirmNo: "नहीं (रद्द करें)",
    regSuccess: "आपकी शिकायत सफलतापूर्वक दर्ज कर ली गई है",
    reportAnother: "दूसरी शिकायत दर्ज करें",
    keepReceipt: "कृपया भविष्य के संदर्भ के लिए यह पर्ची संभाल कर रखें।",
    medAvailability: "दवा उपलब्धता अनुरोध",
    medPrompt: "जो दवा नहीं मिल रही उसका नाम दर्ज करें:",
    nextButton: "आगे / OK",
    phonePrompt: "SMS अलर्ट के लिए अपना 10 अंकों का मोबाइल नंबर दर्ज करें:",
    confirmPhone: "पुष्टि करें / OK",
    similarFound: "समान शिकायत पहले से दर्ज है",
    trackOld: "1. पुरानी शिकायत ट्रैक करें",
    registerNew: "2. नई शिकायत दर्ज करें",
    oldStatusTitle: "मौजूदा शिकायत की स्थिति",
    oldStatusId: "शिकायत संख्या:",
    finish: "समाप्त",
    smsAlertNotice: "दवा उपलब्ध होने पर आपके नंबर पर SMS भेजा जाएगा।",
    medicineLabel: "दवा:",
    medicinePlaceholder: "दवा का नाम दर्ज करें",
  },
  te: {
    headerTitle: "జనసువిధ",
    publicBoard: "ప్రజా ఫిర్యాదుల బోర్డు",
    idlePrompt: "జెమిని 3.8 లైవ్ వాయిస్ ఏజెంట్‌తో మాట్లాడటానికి నొక్కండి",
    agentListening: "జెమిని 3.8 లైవ్ వింటోంది మరియు మాట్లాడుతోంది...",
    doneButton: "✓ మాట్లాడటం పూర్తయింది",
    detectedSpeech: "గుర్తించిన మాట",
    confirmYes: "అవును / OK (నమోదు చేయి)",
    confirmNo: "కాదు (రద్దు చేయి)",
    regSuccess: "మీ ఫిర్యాదు విజయవంతంగా నమోదైంది",
    reportAnother: "మరొక ఫిర్యాదు నమోదు చేయండి",
    keepReceipt: "దయచేసి భవిష్యత్ అవసరాల కోసం ఈ రసీదును భద్రపరచండి.",
    medAvailability: "మందుల లభ్యత అభ్యర్థన",
    medPrompt: "అందుబాటులో లేని మందు పేరు:",
    nextButton: "తర్వాత / OK",
    phonePrompt: "SMS అలర్ట్ కోసం మీ 10 అంకెల మొబైల్ నంబర్ ఇవ్వండి:",
    confirmPhone: "ధృవీకరించండి / OK",
    similarFound: "ఇలాంటి ఫిర్యాదు ఇప్పటికే ఉంది",
    trackOld: "1. పాత ఫిర్యాదును ట్రాక్ చేయండి",
    registerNew: "2. కొత్త ఫిర్యాదు నమోదు చేయండి",
    oldStatusTitle: "ప్రస్తుత ఫిర్యాదు స్థితి",
    oldStatusId: "ఫిర్యాదు సంఖ్య:",
    finish: "ముగింపు",
    smsAlertNotice: "మందు అందుబాటులోకి వచ్చినప్పుడు SMS పంపబడుతుంది.",
    medicineLabel: "మందు:",
    medicinePlaceholder: "మందు పేరు నమోదు చేయండి",
  },
  ta: {
    headerTitle: "ஜனசுவிதா",
    publicBoard: "பொது குறைதீர்ப்பு பலகை",
    idlePrompt: "ஜெமினி 3.8 லைவ் உடன் பேச தட்டவும்",
    agentListening: "ஜெமினி 3.8 லைவ் கேட்கிறது மற்றும் பேசுகிறது...",
    doneButton: "✓ பேசி முடிந்தது",
    detectedSpeech: "அடையாளம் காணப்பட்ட பேச்சு",
    confirmYes: "ஆம் / OK (பதிவு செய்)",
    confirmNo: "இல்லை (ரத்து செய்)",
    regSuccess: "உங்கள் புகார் வெற்றிகரமாக பதிவு செய்யப்பட்டுள்ளது",
    reportAnother: "மற்றொரு புகாரைப் பதிவு செய்யவும்",
    keepReceipt: "எதிர்கால கண்காணிப்புக்கு இந்த சீட்டை பாதுகாக்கவும்.",
    medAvailability: "மருந்து கிடைக்கும் கோரிக்கை",
    medPrompt: "கிடைக்காத மருந்தின் பெயர்:",
    nextButton: "அடுத்து / OK",
    phonePrompt: "SMS அறிவிப்புக்கு உங்கள் 10 இலக்க மொபைல் எண்ணை உள்ளிடவும்:",
    confirmPhone: "உறுதிப்படுத்துக / OK",
    similarFound: "இதே போன்ற புகார் ஏற்கனவே பதிவாகியுள்ளது",
    trackOld: "1. முந்தைய புகாரை கண்காணிக்கவும்",
    registerNew: "2. புதிய புகாரைப் பதிவு செய்யவும்",
    oldStatusTitle: "முந்தைய புகாரின் நிலை",
    oldStatusId: "புகார் எண்:",
    finish: "முடிவு",
    smsAlertNotice: "மருந்து கிடைத்தவுடன் இந்த எண்ணிற்கு SMS அனுப்பப்படும்.",
    medicineLabel: "மருந்து:",
    medicinePlaceholder: "மருந்தின் பெயரை உள்ளிடவும்",
  },
  ml: {
    headerTitle: "ജനസുവിധ",
    publicBoard: "പൊതു പരാതി ബോർഡ്",
    idlePrompt: "ജെമിനി 3.8 ലൈവ് വോയ്‌സ് ഏജന്റുമായി സംസാരിക്കുക",
    agentListening: "ജെമിനി 3.8 ലൈവ് കേൾക്കുകയും സംസാരിക്കുകയും ചെയ്യുന്നു...",
    doneButton: "✓ സംസാരിച്ചു കഴിഞ്ഞു",
    detectedSpeech: "തിരിച്ചറിഞ്ഞ ശബ്ദം",
    confirmYes: "അതെ / OK (രജിസ്റ്റർ ചെയ്യുക)",
    confirmNo: "അല്ല (റദ്ദാക്കുക)",
    regSuccess: "താങ്കളുടെ പരാതി വിജയകരമായി രജിസ്റ്റർ ചെയ്തു",
    reportAnother: "മറ്റൊരു പരാതി നൽകുക",
    keepReceipt: "തുടർ ആവശ്യങ്ങൾക്കായി ഈ രസീത് സൂക്ഷിക്കുക.",
    medAvailability: "മരുന്ന് ലഭ്യത അപേക്ഷ",
    medPrompt: "ലഭ്യമല്ലാത്ത മരുന്നിന്റെ പേര്:",
    nextButton: "അടുത്തത് / OK",
    phonePrompt: "SMS അലേർട്ടിനായി 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക:",
    confirmPhone: "സ്ഥിరീകരിക്കുക / OK",
    similarFound: "സമാനമായ പരാതി നേരത്തെ രജിസ്റ്റർ ചെയ്തിട്ടുണ്ട്",
    trackOld: "1. പഴയ പരാതി പരിശോധിക്കുക",
    registerNew: "2. പുതിയ പരാതി നൽകുക",
    oldStatusTitle: "പരാതിയുടെ നിലവിലെ സ്ഥിതി",
    oldStatusId: "പരാതി നമ്പർ:",
    finish: "പൂർത്തിയായി",
    smsAlertNotice: "മരുന്ന് ലഭ്യമാകുമ്പോൾ SMS സന്ദേശം അയക്കും.",
    medicineLabel: "മരുന്ന്:",
    medicinePlaceholder: "മരുന്നിന്റെ പേര് നൽകുക",
  },
};

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

  // Multilingual State: Default English, switches dynamically when native speech is recognized
  const [currentLang, setCurrentLang] = useState<string>("en");
  const [detectedLangName, setDetectedLangName] = useState<string>("English");

  // Medicine Specific State (Private Grievance)
  const [isMedicineComplaint, setIsMedicineComplaint] = useState(false);
  const [medicineName, setMedicineName] = useState("");
  const [citizenPhone, setCitizenPhone] = useState("");
  const [phoneInputVal, setPhoneInputVal] = useState("");
  const [medInputVal, setMedInputVal] = useState("");

  // Duplicate state
  const [existingRepeatComplaint, setExistingRepeatComplaint] = useState<ComplaintItem | null>(null);
  const [storedGeminiData, setStoredGeminiData] = useState<GeminiProcessResult | null>(null);

  const unclearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const liveTranscriptRef = useRef<string>("");
  const submissionIdRef = useRef<string>("");
  const listeningStartedRef = useRef(false);
  const isSubmittingRef = useRef<boolean>(false);
  const currentLangRef = useRef<string>("en");

  // Gemini 3.8 Live Voice Agent
  const geminiLive = useGemini38LiveVoice();
  const disconnectGemini = geminiLive.disconnect;

  const ui = UI_TEXT[currentLang] || UI_TEXT["en"];

  useEffect(() => {
    currentLangRef.current = currentLang;
  }, [currentLang]);

  useEffect(() => {
    return () => {
      disconnectGemini();
    };
  }, [disconnectGemini]);

  // 1. CITIZEN CLICKS BUTTON -> DIRECT BIDIRECTIONAL GEMINI 3.8 LIVE AUDIO STREAM
  const handleStartGeminiLive = async () => {
    if (unclearTimeoutRef.current) clearTimeout(unclearTimeoutRef.current);
    setStage("GEMINI_LIVE_CONVERSATION");
    setTranscript("");
    liveTranscriptRef.current = "";
    submissionIdRef.current = "";
    listeningStartedRef.current = false;
    setConfirmationQuestion("");
    setSummary("");
    setEnglishTranslationText("");
    setDepartmentName("");
    setCategoryName("");
    setPriorityVal("Medium");
    setIsMedicineComplaint(false);
    setMedicineName("");
    setMedInputVal("");
    setCitizenPhone("");
    setPhoneInputVal("");
    setExistingRepeatComplaint(null);
    setStoredGeminiData(null);
    setStatusText("Connecting directly to Gemini 3.8 Live Voice Agent...");

    // Connect to Gemini 3.8 Live WebSocket
    let keyConfig: { token?: string; error?: string };
    try {
      const keyResponse = await fetch("/api/gemini/config", { method: "POST" });
      keyConfig = await keyResponse.json();
      if (!keyResponse.ok || !keyConfig.token) {
        throw new Error(keyConfig.error || "Gemini Live token could not be created. Check GEMINI_API_KEY on the server.");
      }
    } catch (error: any) {
      setStage("IDLE");
      setStatusText(error?.message || "Could not reach the Gemini token service. Please try again.");
      return;
    }
    const greetings: Record<string, string> = {
      en: "Hello! Welcome to JanaSuvidha. What complaint would you like to register today? Please speak freely.",
      kn: "ನಮಸ್ಕಾರ! ಜನಸುವಿಧಕ್ಕೆ ಸ್ವಾಗತ. ಇಂದು ಯಾವ ದೂರನ್ನು ದಾಖಲಿಸಲು ಬಯಸುತ್ತೀರಿ? ಮುಕ್ತವಾಗಿ ಮಾತನಾಡಿ.",
      hi: "नमस्ते! जनसुविधा में आपका स्वागत है। आज आप कौन सी शिकायत दर्ज कराना चाहते हैं? कृपया खुलकर बताएं।",
      te: "నమస్కారం! జనసువిధకు స్వాగతం. ఈరోజు మీరు ఏ ఫిర్యాదు నమోదు చేయాలనుకుంటున్నారు? స్వేచ్ఛగా చెప్పండి.",
      ta: "வணக்கம்! ஜனசுவிதாவிற்கு வரவேற்கிறோம். இன்று எந்த புகாரைப் பதிவு செய்ய விரும்புகிறீர்கள்? தயங்காமல் சொல்லுங்கள்.",
      ml: "നമസ്കാരം! ജനസുവിധയിലേക്ക് സ്വാഗതം. ഇന്ന് ഏത് പരാതി രജിസ്റ്റർ ചെയ്യാനാണ് ആഗ്രഹിക്കുന്നത്? തുറന്ന് പറയൂ.",
    };
    let connectionError = "";
    const connected = await geminiLive.connect({
      apiKey: keyConfig.token,
      systemInstruction: `You are JanaSuvidha, a warm, polite and highly empathetic hospital grievance voice assistant in an Indian government hospital.
You understand and speak Kannada, Hindi, English, Tamil, Telugu, and other Indian languages natively.
Speak naturally like a caring nurse or hospital guide.
When you start, greet the patient and ask what complaint they want to register.
When they speak in any language (Kannada, Hindi, etc.), respond immediately and fluently in that exact same language!
If they need an unavailable medicine, politely ask which medicine and tell them we will notify them.`,
      onConnected: () => {
        setStatusText("Gemini Live is speaking the welcome greeting...");
        geminiLive.sendInitialPrompt(`Speak this exact welcome message aloud in ${detectedLangName}: ${greetings[currentLangRef.current] || greetings.en}`);
      },
      onTurnComplete: () => {
        if (listeningStartedRef.current) return;
        listeningStartedRef.current = true;
        setStatusText("Welcome finished. Starting the microphone...");
        void geminiLive.startListening().then((started) => {
          if (started) setStatusText("Gemini Live is listening...");
        });
      },
      onInputTranscript: (text) => {
        setTranscript((prior) => `${prior} ${text}`.trim());
        liveTranscriptRef.current = `${liveTranscriptRef.current} ${text}`.trim();
        const lang = /[\u0C80-\u0CFF]/.test(text) ? "kn" : /[\u0900-\u097F]/.test(text) ? "hi" : /[\u0C00-\u0C7F]/.test(text) ? "te" : /[\u0B80-\u0BFF]/.test(text) ? "ta" : /[\u0D00-\u0D7F]/.test(text) ? "ml" : "en";
        const names: Record<string, string> = { en: "English", kn: "Kannada", hi: "Hindi", te: "Telugu", ta: "Tamil", ml: "Malayalam" };
        setCurrentLang(lang);
        currentLangRef.current = lang;
        setDetectedLangName(names[lang]);
      },
      onError: (err) => {
        console.error("Gemini 3.8 Live error:", err);
        connectionError = err?.message || "Gemini Live connection failed.";
        setStage("IDLE");
        setStatusText(connectionError);
      },
    });
    if (!connected) {
      geminiLive.disconnect();
      setStage("IDLE");
      setStatusText(connectionError || geminiLive.error || "Could not connect to Gemini Live. Check the API key and microphone permission.");
      return;
    }

  };

  // 2. CITIZEN FINISHES LIVE VOICE CHAT -> FINALIZE & STRUCTURE COMPLAINT
  const handleFinishLiveChat = async () => {
    if (!geminiLive.isListening) return;
    geminiLive.disconnect();
    setStage("ANALYZING");
    setStatusText("Structuring your complaint with Gemini...");
    await sendTranscriptToServer(liveTranscriptRef.current);
  };

  const sendTranscriptToServer = async (spokenTranscript: string) => {
    try {
      const res = await fetch("/api/voice/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: spokenTranscript }),
      });

      const data: GeminiProcessResult & { success: boolean; error?: string } = await res.json();
      applyGeminiResult(data);
    } catch (err) {
      console.error("[Voice Process Error]", err);
      handleUnclearSpeech("Connection error. Please try speaking again.");
    }
  };

  // 3. ADAPT INTERFACE & WORKFLOW TO CITIZEN'S SPOKEN NATIVE LANGUAGE
  const applyGeminiResult = async (data: GeminiProcessResult) => {
    const result = data || ({} as GeminiProcessResult);
    if (result.unclear) {
      handleUnclearSpeech(result.unclearReason || "I couldn’t understand the complaint. Please try speaking again.");
      return;
    }
    const originalTranscript =
      typeof result.originalTranscript === "string"
        ? result.originalTranscript
        : liveTranscriptRef.current;
    if (!originalTranscript.trim()) {
      handleUnclearSpeech("I couldn’t recognize the complaint. Please try speaking again.");
      return;
    }

    const detectedCode = typeof result.languageCode === "string"
      ? result.languageCode.toLowerCase().split("-")[0]
      : "en";
    const langCode = ["en", "kn", "hi", "te", "ta", "ml"].includes(detectedCode) ? detectedCode : "en";
    const langName = typeof result.detectedLanguage === "string" ? result.detectedLanguage : "English";
    const category = typeof result.category === "string" ? result.category : "Hospital Services";
    const department = typeof result.department === "string" ? result.department : category;
    const complaintSummary = typeof result.complaintSummary === "string" ? result.complaintSummary : originalTranscript;
    const englishTranslation = typeof result.englishTranslation === "string" ? result.englishTranslation : originalTranscript;

    setCurrentLang(langCode);
    setDetectedLangName(langName);
    currentLangRef.current = langCode;

    setStoredGeminiData({
      ...result,
      originalTranscript,
      languageCode: langCode,
      detectedLanguage: langName,
      category,
      department,
      complaintSummary,
      englishTranslation,
      priority: result.priority || "Medium",
    });
    setTranscript(originalTranscript);
    setEnglishTranslationText(englishTranslation);
    setSummary(complaintSummary);
    setDepartmentName(department);
    setCategoryName(category);
    setPriorityVal(result.priority || "Medium");

    if (result.requestType === "LANGUAGE_SWITCH") {
      const prompts: Record<string, string> = {
        en: "Okay, I’ll speak English. Please tell me the complaint you want to register.",
        kn: "ಸರಿ, ನಾನು ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡುತ್ತೇನೆ. ದಯವಿಟ್ಟು ದಾಖಲಿಸಬೇಕಾದ ದೂರನ್ನು ತಿಳಿಸಿ.",
        hi: "ठीक है, मैं हिंदी में बात करूँगा। कृपया बताएं कि आप कौन सी शिकायत दर्ज करना चाहते हैं।",
        te: "సరే, నేను తెలుగులో మాట్లాడతాను. దయచేసి మీరు నమోదు చేయాలనుకుంటున్న ఫిర్యాదును చెప్పండి.",
        ta: "சரி, நான் தமிழில் பேசுகிறேன். பதிவு செய்ய வேண்டிய புகாரைச் சொல்லுங்கள்.",
        ml: "ശരി, ഞാൻ മലയാളത്തിൽ സംസാരിക്കാം. രജിസ്റ്റർ ചെയ്യേണ്ട പരാതി പറയുക.",
      };
      const prompt = prompts[langCode] || prompts.en;
      setStage("IDLE");
      setConfirmationQuestion(prompt);
      setStatusText(prompt);
      void TTSService.speak(prompt, langCode);
      return;
    }

    // CLASSIFICATION: PRIVATE MEDICINE AVAILABILITY vs PUBLIC GRIEVANCE
    const isMed =
      result.requestType === "PRIVATE_AVAILABILITY" ||
      result.requestType === "MEDICINE_AVAILABILITY" ||
      category === "Pharmacy and Medicine Availability" ||
      department === "Pharmacy and Medicine Availability" ||
      originalTranscript.toLowerCase().includes("medicine") ||
      originalTranscript.toLowerCase().includes("ಔಷಧಿ") ||
      originalTranscript.toLowerCase().includes("ದವಾ") ||
      originalTranscript.toLowerCase().includes("दवा") ||
      originalTranscript.toLowerCase().includes("ಮಂದು") ||
      originalTranscript.toLowerCase().includes("மருந்து");

    if (isMed) {
      setIsMedicineComplaint(true);
      const extractedMed = result.requestedResource || "";
      if (extractedMed && extractedMed !== "Prescribed Medicines") {
        setMedicineName(extractedMed);
        setMedInputVal(extractedMed);
      }
      askForMedicineName(langCode);
      return;
    }

    setIsMedicineComplaint(false);

    // Check duplicate
    try {
      const repRes = await fetch("/api/complaints/check-repeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, department }),
      });
      const repData = await repRes.json();

      if (repData.hasActive && repData.complaint) {
        setExistingRepeatComplaint(repData.complaint);
        setStage("DUPLICATE_CHECK");

        const duplicateQuestions: Record<string, string> = {
          en: `A similar complaint about ${complaintSummary || department} was already registered today. Would you like to check its status or register a new complaint?`,
          hi: `इस समस्या (${complaintSummary || department}) के बारे में आज पहले ही शिकायत दर्ज है। क्या आप उसकी स्थिति देखना चाहते हैं या नई शिकायत दर्ज करना चाहते हैं?`,
          kn: `ಈ ಸಮಸ್ಯೆಯ (${complaintSummary || department}) ಬಗ್ಗೆ ಇಂದು ಈಗಾಗಲೇ ದೂರು ದಾಖಲಾಗಿದೆ. ಅದರ ಸ್ಥಿತಿ ನೋಡಬೇಕೇ ಅಥವಾ ಹೊಸ ದೂರು ದಾಖಲಿಸಬೇಕೇ?`,
          te: `ఈ సమస్య (${complaintSummary || department}) గురించి ఈరోజు ఇప్పటికే ఫిర్యాదు నమోదైంది. దాని స్థితి చూడాలా లేదా కొత్త ఫిర్యాదు నమోదు చేయాలా?`,
          ta: `இந்த பிரச்சினை (${complaintSummary || department}) குறித்து இன்று ஏற்கனவே புகார் பதிவு செய்யப்பட்டுள்ளது. அதன் நிலையைப் பார்க்கவா அல்லது புதிய புகார் பதிவு செய்யவா?`,
          ml: `ഈ പ്രശ്നത്തെക്കുറിച്ച് (${complaintSummary || department}) ഇന്ന് പരാതി രജിസ്റ്റർ ചെയ്തിട്ടുണ്ട്. അതിന്റെ സ്ഥിതി പരിശോധിക്കണോ, പുതിയ പരാതി നൽകണോ?`,
        };
        const duplicateQuestion = duplicateQuestions[langCode] || duplicateQuestions.en;

        setConfirmationQuestion(duplicateQuestion);
        setStatusText(duplicateQuestion);
        void TTSService.speak(duplicateQuestion, langCode);
        return;
      }
    } catch (e) {
      console.warn("Check repeat error:", e);
    }

    proceedToConfirmation({
      ...result,
      originalTranscript,
      languageCode: langCode,
      detectedLanguage: langName,
      category,
      department,
      complaintSummary,
      englishTranslation,
      priority: result.priority || "Medium",
    }, langCode);
  };

  const askForMedicineName = (langCode: string) => {
    setStage("ASKING_MEDICINE_NAME");
    const prompts: Record<string, string> = {
      en: "Please specify which medicine is not available.",
      hi: "कृपया बताएं कि कौन सी दवा उपलब्ध नहीं है।",
      kn: "ಯಾವ ಔಷಧಿ ಲಭ್ಯವಿಲ್ಲ ಎಂದು ದಯವಿಟ್ಟು ತಿಳಿಸಿ.",
      te: "దయచేసి అందుబాటులో లేని మందు ఏదో చెప్పండి.",
      ta: "கிடைக்காத மருந்து எது என்பதைச் சொல்லுங்கள்.",
      ml: "ലഭ്യമല്ലാത്ത മരുന്ന് ഏതാണ് എന്ന് പറയുക.",
    };
    const promptText = prompts[langCode] || prompts.en;
    setStatusText(promptText);
    setConfirmationQuestion(promptText);
    void TTSService.speak(promptText, langCode);
  };

  const handleMedicineNameConfirm = () => {
    const med = medInputVal || medicineName;
    if (!med.trim()) return;
    setMedicineName(med.trim());
    askForCitizenMobile(med.trim(), currentLang);
  };

  const askForCitizenMobile = (med: string, langCode: string) => {
    setStage("ASKING_PHONE");
    const prompts: Record<string, string> = {
      en: `Please provide your 10-digit mobile number so we can notify you via SMS when "${med}" becomes available.`,
      hi: `दवा "${med}" उपलब्ध होने पर SMS से सूचना देने के लिए अपना 10 अंकों का मोबाइल नंबर दें।`,
      kn: `ಔಷಧಿ "${med}" ಲಭ್ಯವಾದಾಗ SMS ಮೂಲಕ ತಿಳಿಸಲು ನಿಮ್ಮ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನೀಡಿ.`,
      te: `"${med}" అందుబాటులోకి వచ్చినప్పుడు SMS ద్వారా తెలియజేయడానికి మీ 10 అంకెల మొబైల్ నంబర్ ఇవ్వండి.`,
      ta: `"${med}" கிடைக்கும்போது SMS மூலம் தெரிவிக்க உங்கள் 10 இலக்க கைபேசி எண்ணை வழங்கவும்.`,
      ml: `"${med}" ലഭ്യമാകുമ്പോൾ SMS വഴി അറിയിക്കാൻ നിങ്ങളുടെ 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക.`,
    };
    const promptText = prompts[langCode] || prompts.en;
    setStatusText(promptText);
    setConfirmationQuestion(promptText);
    void TTSService.speak(promptText, langCode);
  };

  const handlePhoneConfirm = () => {
    const digits = (phoneInputVal || citizenPhone).replace(/\D/g, "");
    if (digits.length !== 10 || !storedGeminiData) return;
    const validPhone = digits.slice(-10);
    setCitizenPhone(validPhone);
    proceedToConfirmation(storedGeminiData!, currentLang, medicineName, validPhone);
  };

  const proceedToConfirmation = (
    data: GeminiProcessResult,
    langCode: string = currentLang,
    med?: string,
    phone?: string
  ) => {
    setStage("CONFIRMATION");
    let confirmMsg = "";

    if (isMedicineComplaint || med) {
      const medName = med || medicineName || "Medicine";
      const ph = phone || citizenPhone || "";
      const confirmations: Record<string, string> = {
        en: `You reported that medicine "${medName}" is unavailable. An SMS alert will be sent to ${ph} when available. Shall I submit this complaint?`,
        hi: `आपने बताया कि दवा "${medName}" उपलब्ध नहीं है। उपलब्ध होने पर ${ph} पर SMS भेजा जाएगा। क्या मैं शिकायत दर्ज कर दूँ?`,
        kn: `ಔಷಧಿ "${medName}" ಲಭ್ಯವಿಲ್ಲ ಎಂದು ನೀವು ತಿಳಿಸಿದ್ದೀರಿ. ಲಭ್ಯವಾದಾಗ ${ph} ಸಂಖ್ಯೆಗೆ SMS ಕಳುಹಿಸಲಾಗುತ್ತದೆ. ದೂರನ್ನು ದಾಖಲಿಸಲೇ?`,
        te: `"${medName}" మందు అందుబాటులో లేదని తెలిపారు. అందుబాటులోకి వచ్చినప్పుడు ${ph} నంబర్‌కు SMS పంపుతాము. ఈ ఫిర్యాదును నమోదు చేయనా?`,
        ta: `"${medName}" மருந்து கிடைக்கவில்லை என்று தெரிவித்தீர்கள். கிடைக்கும்போது ${ph} எண்ணிற்கு SMS அனுப்பப்படும். இந்த புகாரைப் பதிவு செய்யவா?`,
        ml: `"${medName}" മരുന്ന് ലഭ്യമല്ലെന്ന് അറിയിച്ചു. ലഭ്യമാകുമ്പോൾ ${ph} എന്ന നമ്പറിലേക്ക് SMS അയക്കും. പരാതി രജിസ്റ്റർ ചെയ്യട്ടേ?`,
      };
      confirmMsg = confirmations[langCode] || confirmations.en;
    } else {
      const cleanSummary = data?.complaintSummary || summary;
      const confirmations: Record<string, string> = {
        en: `You reported: "${cleanSummary}". Shall I submit this complaint to the hospital authorities?`,
        hi: `आपने "${cleanSummary}" की शिकायत की है। क्या मैं इसे अस्पताल के संबंधित अधिकारियों को भेज दूँ?`,
        kn: `"${cleanSummary}" ಬಗ್ಗೆ ನೀವು ದೂರು ನೀಡಿದ್ದೀರಿ. ಇದನ್ನು ಆಸ್ಪತ್ರೆಯ ಸಂಬಂಧಪಟ್ಟ ಅಧಿಕಾರಿಗಳಿಗೆ ಕಳುಹಿಸಲೇ?`,
        te: `"${cleanSummary}" గురించి మీరు ఫిర్యాదు చేశారు. దీన్ని సంబంధిత ఆసుపత్రి అధికారులకు పంపించనా?`,
        ta: `"${cleanSummary}" குறித்து புகார் அளித்துள்ளீர்கள். இதை மருத்துவமனை அதிகாரிகளுக்கு அனுப்பவா?`,
        ml: `"${cleanSummary}" എന്ന പരാതിയാണ് നൽകിയത്. ഇത് ആശുപത്രി അധികാരികൾക്ക് അയയ്ക്കട്ടേ?`,
      };
      confirmMsg = confirmations[langCode] || confirmations.en;
    }

    setConfirmationQuestion(confirmMsg);
    setStatusText(confirmMsg);
    void TTSService.speak(confirmMsg, langCode);
  };

  const handleRegisterNewComplaint = () => {
    if (!storedGeminiData) {
      setStage("IDLE");
      return;
    }
    proceedToConfirmation(storedGeminiData, currentLang);
  };

  const handleTrackExistingComplaint = () => {
    if (!existingRepeatComplaint) return;
    setStage("TRACKING_EXISTING");
    const number = existingRepeatComplaint.complaintNumber || existingRepeatComplaint.ticketNumber || existingRepeatComplaint.id;
    const status = existingRepeatComplaint.status || "PENDING";
    const message = currentLang === "hi"
      ? `मौजूदा शिकायत संख्या ${number} की स्थिति ${status} है।`
      : currentLang === "kn"
      ? `ಹಳೆಯ ದೂರು ಸಂಖ್ಯೆ ${number} ರ ಸ್ಥಿತಿ ${status} ಆಗಿದೆ.`
      : currentLang === "te"
      ? `ఇప్పటికే ఉన్న ఫిర్యాదు సంఖ్య ${number} స్థితి ${status}.`
      : currentLang === "ta"
      ? `ஏற்கனவே உள்ள புகார் எண் ${number} இன் நிலை ${status}.`
      : currentLang === "ml"
      ? `നിലവിലുള്ള പരാതി നമ്പർ ${number} ന്റെ സ്ഥിതി ${status}.`
      : `Existing complaint ${number} is currently ${status}.`;
    setConfirmationQuestion(message);
    setStatusText(message);
    void TTSService.speak(message, currentLang);
  };

  const submitComplaint = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setStage("SUBMITTING");

    const langCode = currentLangRef.current || "en";
    setStatusText("Registering your grievance with hospital authorities...");

    try {
      let ticket = "";
      let receiptData: ComplaintReceipt | null = null;

      if (isMedicineComplaint) {
        const response = await fetch("/api/availability-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            verifiedPhoneNumber: citizenPhone,
            requestedResource: medicineName,
            resourceType: "MEDICINE",
            originalTranscript: transcript,
            englishTranslation: englishTranslationText || summary,
            languageCode: langCode,
            hospitalName: "Victoria District Hospital",
            departmentName: "Pharmacy and Medicine Availability",
          }),
        });
        const data = await response.json();
        if (!response.ok || !data.success || !data.request) {
          throw new Error(data.error || "Could not register the medicine availability request.");
        }

        ticket = data.request.requestNumber;
        const now = new Date();
        receiptData = {
          complaintNumber: ticket,
          complaintText: `${ui.medAvailability}: ${medicineName}`,
          originalLanguage: detectedLangName,
          hospitalName: "Victoria District Hospital",
          location: "Victoria District Hospital - Kiosk #1",
          submissionDate: now.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
          submissionTime: now.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }),
          timeZone: "Asia/Kolkata (IST, UTC+05:30)",
          category: "Pharmacy and Medicine Availability",
          forwardedTo: "Pharmacy and Medicine Availability Department",
          responsibleAuthority: "Pharmacy Department Officer",
          status: data.request.status || "Pending",
        };
      } else {
        const idempotencyKey = submissionIdRef.current || `kiosk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        submissionIdRef.current = idempotencyKey;
        const response = await fetch("/api/complaints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idempotencyKey,
            originalTranscript: transcript,
            originalLanguage: detectedLangName,
            languageCode: langCode,
            englishTranslation: englishTranslationText || summary,
            summary: summary || transcript.slice(0, 80),
            category: categoryName || "Hospital Services",
            department: departmentName || "Hospital Services",
            priority: priorityVal || "Medium",
            location: "Victoria District Hospital - Kiosk #1",
            source: "VOICE_KIOSK",
            visibility: "PUBLIC",
          }),
        });
        const data = await response.json();
        if (!response.ok || !data.success || !data.complaint) {
          throw new Error(data.error || "We could not register the complaint. Please try again.");
        }
        receiptData = data.complaint.receipt || null;
        ticket = receiptData?.complaintNumber || data.complaint.complaintNumber || "";
      }

      if (!receiptData) throw new Error("The request was saved, but its acknowledgement could not be prepared.");
      setReceipt(receiptData);
      setStage("COMPLETED");
      const closingByLang: Record<string, string> = {
        en: `Thank you! Your ${isMedicineComplaint ? "medicine availability request" : "complaint"} has been successfully registered under ticket ID ${ticket}. It has been forwarded to the concerned hospital authorities. Please keep your slip. Have a wonderful day!`,
        kn: `ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ${isMedicineComplaint ? "ಔಷಧ ಲಭ್ಯತೆ ವಿನಂತಿ" : "ದೂರು"} ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಾಗಿದೆ. ಸಂಖ್ಯೆ ${ticket}. ಸಂಬಂಧಪಟ್ಟ ಆಸ್ಪತ್ರೆಗೆ ಕಳುಹಿಸಲಾಗಿದೆ. ರಶೀದಿಯನ್ನು ಇಟ್ಟುಕೊಳ್ಳಿ. ಶುಭ ದಿನ.`,
        hi: `धन्यवाद! आपका ${isMedicineComplaint ? "दवा उपलब्धता अनुरोध" : "शिकायत"} सफलतापूर्वक दर्ज हो गया है। संख्या ${ticket} है। इसे संबंधित अस्पताल अधिकारियों को भेज दिया गया है। पर्ची संभालकर रखें। आपका दिन शुभ हो।`,
        te: `ధన్యవాదాలు! మీ ${isMedicineComplaint ? "మందుల లభ్యత అభ్యర్థన" : "ఫిర్యాదు"} నమోదైంది. సంఖ్య ${ticket}. సంబంధిత ఆసుపత్రి అధికారులకు పంపించాం. రసీదును భద్రపరచండి. శుభదినం.`,
        ta: `நன்றி! உங்கள் ${isMedicineComplaint ? "மருந்து கிடைக்கும் கோரிக்கை" : "புகார்"} பதிவு செய்யப்பட்டது. எண் ${ticket}. மருத்துவமனை அதிகாரிகளுக்கு அனுப்பப்பட்டது. ரசீதை வைத்துக் கொள்ளுங்கள். இனிய நாள்.`,
        ml: `നന്ദി! നിങ്ങളുടെ ${isMedicineComplaint ? "മരുന്ന് ലഭ്യത അഭ്യർത്ഥന" : "പരാതി"} രജിസ്റ്റർ ചെയ്തു. നമ്പർ ${ticket}. ആശുപത്രി അധികാരികൾക്ക് കൈമാറി. രസീത് സൂക്ഷിക്കുക. നല്ലൊരു ദിവസം ആശംസിക്കുന്നു.`,
      };
      void TTSService.speak(closingByLang[langCode] || closingByLang.en, langCode);
    } catch (err) {
      console.error("[Complaint Submission Error]", err);
      setStatusText("We could not reach the complaint service. Please try submitting again.");
      setStage("CONFIRMATION");
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const cancelComplaint = () => {
    resetKiosk();
  };

  const handleUnclearSpeech = (promptMessage: string) => {
    if (unclearTimeoutRef.current) clearTimeout(unclearTimeoutRef.current);
    setStatusText(promptMessage);
    unclearTimeoutRef.current = setTimeout(() => {
      setStage("IDLE");
      setStatusText("");
      unclearTimeoutRef.current = null;
    }, 2500);
  };

  const resetKiosk = () => {
    if (unclearTimeoutRef.current) clearTimeout(unclearTimeoutRef.current);
    geminiLive.disconnect();
    setStage("IDLE");
    setTranscript("");
    liveTranscriptRef.current = "";
    submissionIdRef.current = "";
    setConfirmationQuestion("");
    setSummary("");
    setDepartmentName("");
    setCategoryName("");
    setPriorityVal("Medium");
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
    setCurrentLang("en");
    setDetectedLangName("English");
  };

  return (
    <div className="min-h-screen bg-[#F5F8F7] flex flex-col justify-between p-6 sm:p-12 select-none relative overflow-hidden">
      {/* TOP BAR: MINIMAL CLEAN HEADER WITH DYNAMIC NATIVE LANGUAGE */}
      <header className="flex items-center justify-between w-full max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-xs font-semibold text-[#607477] hover:text-[#12343B] transition-colors"
          >
            {ui.headerTitle}
          </Link>
          <span className="text-[10px] bg-emerald-100 text-[#147D78] font-bold px-2 py-0.5 rounded-full border border-[#147D78]/20 flex items-center gap-1">
            <Radio className="w-2.5 h-2.5 animate-pulse" />
            Gemini 3.8 Live Voice
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#147D78] bg-[#E8F4F1] px-3 py-1 rounded-full border border-[#147D78]/20">
            {detectedLangName} ({(currentLang || "en").toUpperCase()})
          </span>
          <Link
            href="/citizen/kiosk/report"
            className="text-xs sm:text-sm font-semibold text-[#147D78] hover:text-[#0e5e5a] transition-colors bg-[#E8F4F1] px-4 py-2 rounded-full border border-[#147D78]/20"
          >
            {ui.publicBoard}
          </Link>
        </div>
      </header>

      {/* CENTER: THE MULTILINGUAL VOICE-FIRST EXPERIENCE */}
      <main className="flex-1 flex flex-col items-center justify-center text-center max-w-xl mx-auto w-full my-auto py-8">
        {/* COMPLETED: SUCCESS SCREEN WITH COMPLAINT ID & MULTILINGUAL SLIP */}
        {stage === "COMPLETED" ? (
          <div className="space-y-6 w-full animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-[#E8F4F1] text-[#147D78] flex items-center justify-center mx-auto shadow-xs no-print">
              <Check className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-1.5 no-print">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#12343B]">
                {ui.regSuccess}
              </h2>
              {isMedicineComplaint && citizenPhone && (
                <div className="bg-[#E8F4F1] border border-[#147D78]/30 rounded-xl p-3 max-w-md mx-auto text-xs text-[#147D78] font-semibold flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>
                    {ui.smsAlertNotice} (<strong>XXXXXX{citizenPhone.slice(-4)}</strong>)
                  </span>
                </div>
              )}
              <p className="text-xs text-[#607477]">
                {ui.keepReceipt}
              </p>
            </div>

            {/* PRINTABLE COMPLAINT RECEIPT SLIP IN CITIZEN'S NATIVE LANGUAGE */}
            {receipt && (
              <div className="w-full flex justify-center">
                <ComplaintReceiptCard
                  receipt={receipt}
                  languageCode={currentLang}
                />
              </div>
            )}

            <div className="pt-2 no-print">
              <button
                type="button"
                onClick={resetKiosk}
                className="inline-flex items-center gap-2 bg-[#147D78] hover:bg-[#0e5e5a] text-white text-xs font-semibold px-6 py-3 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{ui.reportAnother}</span>
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
                {ui.medAvailability}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#12343B] leading-snug">
                "{confirmationQuestion}"
              </h2>
              <p className="text-xs text-[#607477]">
                {ui.medPrompt}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="relative">
                <input
                  type="text"
                  value={medInputVal}
                  onChange={(e) => setMedInputVal(e.target.value)}
                  placeholder={ui.medicinePlaceholder}
                  className="w-full text-sm font-semibold text-[#12343B] p-3.5 rounded-2xl border-2 border-[#147D78]/30 bg-white focus:outline-none focus:border-[#147D78] text-center"
                />
              </div>

              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleMedicineNameConfirm}
                  disabled={!medInputVal.trim()}
                  className="flex items-center gap-2 bg-[#147D78] hover:bg-[#0e5e5a] disabled:opacity-50 text-white font-bold text-sm px-8 py-3 rounded-2xl shadow-sm transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{ui.nextButton}</span>
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
                {ui.medAvailability}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-[#12343B] leading-snug">
                "{confirmationQuestion}"
              </h2>
              <p className="text-xs text-[#607477]">
                {ui.medicineLabel} <strong className="text-[#147D78]">{medicineName}</strong>
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
                  onClick={handlePhoneConfirm}
                  disabled={phoneInputVal.length < 10}
                  className="flex items-center gap-2 bg-[#147D78] hover:bg-[#0e5e5a] disabled:opacity-50 text-white font-bold text-sm px-8 py-3 rounded-2xl shadow-sm transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{ui.confirmPhone}</span>
                </button>
              </div>
            </div>
          </div>
        ) : stage === "DUPLICATE_CHECK" ? (
          <div className="space-y-6 w-full max-w-lg mx-auto animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto">
              <Search className="w-7 h-7" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#12343B] leading-relaxed">{confirmationQuestion}</h2>
            {existingRepeatComplaint && (
              <p className="text-sm text-[#607477]">
                {ui.oldStatusId} {existingRepeatComplaint.complaintNumber || existingRepeatComplaint.ticketNumber || existingRepeatComplaint.id}
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-3">
              <button type="button" onClick={handleTrackExistingComplaint} className="bg-white border border-[#147D78] text-[#147D78] font-bold text-sm px-5 py-3 rounded-xl">
                {ui.trackOld}
              </button>
              <button type="button" onClick={handleRegisterNewComplaint} className="bg-[#147D78] text-white font-bold text-sm px-5 py-3 rounded-xl">
                {ui.registerNew}
              </button>
              <button type="button" onClick={cancelComplaint} className="bg-rose-600 text-white font-bold text-sm px-5 py-3 rounded-xl">
                {ui.confirmNo}
              </button>
            </div>
          </div>
        ) : stage === "TRACKING_EXISTING" ? (
          <div className="space-y-6 w-full max-w-lg mx-auto animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-full bg-[#E8F4F1] text-[#147D78] flex items-center justify-center mx-auto">
              <Search className="w-7 h-7" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#12343B]">{ui.oldStatusTitle}</h2>
            <p className="text-base font-semibold text-[#147D78]">{confirmationQuestion}</p>
            <button type="button" onClick={resetKiosk} className="bg-[#147D78] text-white font-bold text-sm px-6 py-3 rounded-xl">
              {ui.finish}
            </button>
          </div>
        ) : stage === "CONFIRMATION" ? (
          /* FINAL CONFIRMATION STAGE: OK / SUBMIT */
          <div className="space-y-8 w-full animate-in fade-in duration-200">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#E8F4F1] text-[#147D78] flex items-center justify-center mx-auto animate-pulse">
                <Volume2 className="w-7 h-7" />
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-[#12343B] leading-relaxed max-w-lg mx-auto">
                "{confirmationQuestion}"
              </h2>
              {statusText && statusText !== confirmationQuestion && (
                <p role="alert" className="text-sm font-semibold text-rose-700">{statusText}</p>
              )}
            </div>

            <div className="flex justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={submitComplaint}
                className="flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm sm:text-base px-8 py-3.5 rounded-2xl shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>{ui.confirmYes}</span>
              </button>

              <button
                type="button"
                onClick={cancelComplaint}
                className="flex items-center gap-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-sm sm:text-base px-8 py-3.5 rounded-2xl shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
                <span>{ui.confirmNo}</span>
              </button>
            </div>
          </div>
        ) : (
          /* INITIAL CLEAN SCREEN (IDLE) OR GEMINI 3.8 LIVE CONVERSATION */
          <div className="space-y-8 flex flex-col items-center">
            {/* GEMINI 3.8 LIVE REAL-TIME VOICE AGENT BUTTON */}
            <div className="relative flex items-center justify-center w-full min-h-[220px] sm:min-h-[260px]">
              {stage === "GEMINI_LIVE_CONVERSATION" && (
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
              {stage === "GEMINI_LIVE_CONVERSATION" && (
                <div className="absolute w-44 h-44 rounded-full bg-[#147D78]/20 animate-ping pointer-events-none" />
              )}
              <button
                type="button"
                onClick={
                  stage === "IDLE"
                    ? handleStartGeminiLive
                    : stage === "GEMINI_LIVE_CONVERSATION"
                    ? handleFinishLiveChat
                    : undefined
                }
                disabled={
                  stage === "ANALYZING" ||
                  stage === "SUBMITTING" ||
                  (stage === "GEMINI_LIVE_CONVERSATION" && !geminiLive.isListening)
                }
                aria-label="Talk to Gemini 3.8 Live Voice Agent"
                className={`relative z-10 flex flex-col items-center justify-center w-36 h-36 sm:w-44 sm:h-44 rounded-full transition-all duration-300 shadow-md ${
                  stage === "GEMINI_LIVE_CONVERSATION"
                    ? "bg-[#147D78] text-white scale-105 shadow-xl ring-8 ring-[#147D78]/20 cursor-pointer"
                    : "bg-[#147D78] hover:bg-[#0e5e5a] text-white hover:scale-105 active:scale-95 cursor-pointer"
                }`}
              >
                <div className="relative">
                  <Mic className="w-14 h-14 sm:w-16 sm:h-16" />
                  <Sparkles className="w-4 h-4 text-emerald-200 absolute -top-1 -right-1 animate-spin" />
                </div>
                <span className="text-[10px] font-bold tracking-wider uppercase mt-1 opacity-90">
                  {stage === "GEMINI_LIVE_CONVERSATION" ? "Finish" : "Gemini 3.8 Live"}
                </span>
              </button>
            </div>

            {/* INSTRUCTION & STATUS */}
            <div className="space-y-3">
              <p className="text-lg sm:text-xl font-medium text-[#12343B]">
                {stage === "IDLE"
                  ? statusText || ui.idlePrompt
                  : stage === "GEMINI_LIVE_CONVERSATION"
                  ? geminiLive.isSpeaking
                    ? "Gemini 3.8 Live is speaking aloud to you..."
                    : geminiLive.isListening
                    ? ui.agentListening
                    : statusText || "Connecting to Gemini Live..."
                  : statusText}
              </p>

              {/* Citizen completion button during live conversation */}
              {stage === "GEMINI_LIVE_CONVERSATION" && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleFinishLiveChat}
                    disabled={!geminiLive.isListening}
                    className="inline-flex items-center gap-2 bg-[#147D78] hover:bg-[#0e5e5a] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-md transition-all active:scale-95 animate-pulse cursor-pointer"
                  >
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                    <span>{ui.doneButton}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* BOTTOM: Hospital Context Footer */}
      <footer className="text-center text-xs text-[#607477]/60 no-print flex flex-col items-center gap-1">
        <span>{ui.headerTitle} • Hospital Grievance System</span>
        <span className="text-[11px] font-medium text-[#147D78]/80">
          Powered by Google Gemini 3.8 Live Multilingual Voice Engine
        </span>
      </footer>
    </div>
  );
}
