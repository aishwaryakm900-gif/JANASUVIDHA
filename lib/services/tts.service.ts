"use client";

import { Language } from "@/types";

export interface SpokenConfirmationPhrases {
  askConfirmation: string;
  successMessage: string;
  cancelMessage: string;
  retryMessage: string;
  duplicateAsk: string;
  trackStatus: string;
  repeatAsk: string;
  durationAsk: string;
  privatePhoneAsk: string;
  privateOtpAsk: string;
  privateSuccess: string;
  repeatOptions: {
    stillUnclean: string;
    clean: string;
    worsened: string;
    returned: string;
  };
  durationOptions: {
    lessThanHour: string;
    fewHours: string;
    sinceMorning: string;
    dontKnow: string;
  };
  yesWords: string[];
  noWords: string[];
}

export const LANGUAGE_PHRASES: Record<string, SpokenConfirmationPhrases> = {
  kn: {
    askConfirmation: "ಆಸ್ಪತ್ರೆಯ ಈ ಸಮಸ್ಯೆಯನ್ನು ನೀವು ವರದಿ ಮಾಡಿದ್ದೀರಿ. ಈ ದೂರನ್ನು ಸಂಬಂಧಪಟ್ಟ ಹಿರಿಯ ಅಧಿಕಾರಿಗಳಿಗೆ ಕಳುಹಿಸಲೆ?",
    successMessage: "ಧನ್ಯವಾದಗಳು. ನಿಮ್ಮ ದೂರು ಸಂಖ್ಯೆ {id} ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಾಗಿದೆ. ದಯವಿಟ್ಟು ರಶೀದಿಯನ್ನು ಸಂಗ್ರಹಿಸಿ.",
    cancelMessage: "ಸರಿ, ಈ ದೂರನ್ನು ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ. ನೀವು ಮತ್ತೆ ಹೇಳಬಹುದು.",
    retryMessage: "ಕ್ಷಮಿಸಿ, ಸರಿಯಾಗಿ ಅರ್ಥವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎಂದು ಸ್ಪಷ್ಟವಾಗಿ ಹೇಳಿ.",
    duplicateAsk: "ಈ ಸಮಸ್ಯೆಯನ್ನು ಇಂದು ಈಗಾಗಲೇ ವರದಿ ಮಾಡಲಾಗಿದೆ. ನೀವು ಹಳೆಯ ದೂರಿನ ಸ್ಥಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಲು ಬಯಸುವಿರಾ ಅಥವಾ ಹೊಸ ದೂರನ್ನು ದಾಖಲಿಸಬೇಕೇ?",
    trackStatus: "ನಿಮ್ಮ ಹಿಂದಿನ ದೂರು ಸಂಖ್ಯೆ {id}, ಮತ್ತು ಇದರ ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ {status} ಆಗಿದೆ.",
    repeatAsk: "ಈ ಸಮಸ್ಯೆಯನ್ನು ಈಗಾಗಲೇ ವರದಿ ಮಾಡಲಾಗಿದೆ. ನೀವು ಭೇಟಿ ನೀಡಿದಾಗ ಅದು ಇನ್ನೂ ಅಸ್ವಚ್ಛವಾಗಿತ್ತೇ?",
    durationAsk: "ಇದು ಎಷ್ಟು ಸಮಯದಿಂದ ಹೀಗಿದೆ? ಒಂದು ಗಂಟೆಗಿಂತ ಕಡಿಮೆ, ಕೆಲವು ಗಂಟೆಗಳು, ಅಥವಾ ಬೆಳಿಗ್ಗೆಯಿಂದ?",
    privatePhoneAsk: "ಔಷಧಿ ಅಥವಾ ಸೌಲಭ್ಯ ಲಭ್ಯವಾದಾಗ SMS ಮೂಲಕ ತಿಳಿಸಲು, ದಯವಿಟ್ಟು ನಿಮ್ಮ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನೀಡಿ.",
    privateOtpAsk: "ನಿಮ್ಮ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಗೆ ಕಳುಹಿಸಲಾದ 6 ಅಂಕಿಯ OTP ನಮೂದಿಸಿ.",
    privateSuccess: "ಧನ್ಯವಾದಗಳು. ನಿಮ್ಮ ಖಾಸಗಿ ವಿನಂತಿ ದಾಖಲಾಗಿದೆ. ಸೌಲಭ್ಯ ಲಭ್ಯವಾದ ತಕ್ಷಣ SMS ಮೂಲಕ ತಿಳಿಸುತ್ತೇವೆ.",
    repeatOptions: {
      stillUnclean: "ಇನ್ನೂ ಅಸ್ವಚ್ಛವಾಗಿದೆ",
      clean: "ಇಲ್ಲ, ಸ್ವಚ್ಛವಾಗಿದೆ",
      worsened: "ಇನ್ನೂ ಕೆಟ್ಟದಾಗಿದೆ",
      returned: "ಮತ್ತೆ ಪ್ರಾರಂಭವಾಗಿದೆ",
    },
    durationOptions: {
      lessThanHour: "ಒಂದು ಗಂಟೆಗಿಂತ ಕಡಿಮೆ",
      fewHours: "ಕೆಲವು ಗಂಟೆಗಳಿಂದ",
      sinceMorning: "ಬೆಳಿಗ್ಗೆಯಿಂದ",
      dontKnow: "ಗೊತ್ತಿಲ್ಲ",
    },
    yesWords: [
      "ಹೌದು",
      "haudu",
      "howdu",
      "ಸರಿ",
      "sari",
      "ಕಳುಹಿಸಿ",
      "ಹಾ",
      "ಮಾಡಿ",
      "ದಾಖಲಿಸಿ",
      "yes",
      "yeah",
      "yep",
      "ok",
      "okay",
    ],
    noWords: [
      "ಇಲ್ಲ",
      "illa",
      "ಬೇಡ",
      "beda",
      "ಕ್ಯಾನ್ಸಲ್",
      "ನೋ",
      "no",
      "nope",
      "stop",
    ],
  },
  hi: {
    askConfirmation: "आपने अस्पताल की इस समस्या की शिकायत दर्ज की है। क्या मैं यह शिकायत संबंधित उच्च अधिकारियों को भेज दूँ?",
    successMessage: "धन्यवाद। आपकी शिकायत संख्या {id} सफलतापूर्वक दर्ज कर ली गई है। कृपया अपनी रसीद प्राप्त करें।",
    cancelMessage: "ठीक है, यह शिकायत रद्द कर दी गई है। आप दोबारा बता सकते हैं।",
    retryMessage: "क्षमा करें, समझ नहीं आया। कृपया हाँ या नहीं कहें।",
    duplicateAsk: "इस समस्या के बारे में आज पहले ही शिकायत दर्ज की जा चुकी है। क्या आप पुरानी शिकायत की स्थिति देखना चाहते हैं या नई शिकायत दर्ज करना चाहते हैं?",
    trackStatus: "आपकी पिछली शिकायत संख्या {id} है, और इसकी वर्तमान स्थिति {status} है।",
    repeatAsk: "यह समस्या पहले ही दर्ज की गई है। क्या यह अभी भी अस्वच्छ है?",
    durationAsk: "यह कितने समय से ऐसा है? एक घंटे से कम, कुछ घंटों से, या सुबह से?",
    privatePhoneAsk: "सुविधा उपलब्ध होने पर SMS द्वारा सूचित करने के लिए, कृपया अपना मोबाइल नंबर प्रदान करें।",
    privateOtpAsk: "आपके मोबाइल पर भेजा गया 6 अंकों का ओटीपी दर्ज करें।",
    privateSuccess: "धन्यवाद। आपका निजी अनुरोध दर्ज कर लिया गया है। उपलब्ध होते ही एसएमएस द्वारा सूचित किया जाएगा।",
    repeatOptions: {
      stillUnclean: "अभी भी अस्वच्छ है",
      clean: "नहीं, साफ़ है",
      worsened: "स्थिति और बिगड़ गई है",
      returned: "समस्या फिर से आ गई है",
    },
    durationOptions: {
      lessThanHour: "एक घंटे से कम",
      fewHours: "कुछ घंटों से",
      sinceMorning: "सुबह से",
      dontKnow: "पता नहीं",
    },
    yesWords: [
      "हाँ",
      "हां",
      "haan",
      "ha",
      "सही",
      "भेज दो",
      "कर दो",
      "दर्ज करो",
      "theek hai",
      "theek",
      "yes",
      "yeah",
      "ok",
    ],
    noWords: [
      "नहीं",
      "nahi",
      "nahin",
      "ना",
      "na",
      "मत भेजो",
      "रद्द",
      "no",
      "nope",
    ],
  },
  te: {
    askConfirmation: "మీరు ఆసుపత్రి సమస్యను నమోదు చేశారు. ఈ ఫిర్యాదును సంబంధిత ఉన్నతాధికారులకు పంపించమంటారా?",
    successMessage: "ధన్యవాదాలు. మీ ఫిర్యాదు సంఖ్య {id} విజయవంతంగా నమోదైంది. దయచేసి మీ రసీదును తీసుకోండి.",
    cancelMessage: "సరే, ఈ ఫిర్యాదు రద్దు చేయబడింది. మీరు మళ్లీ చెప్పవచ్చు.",
    retryMessage: "క్షమించండి, అర్థం కాలేదు. దయచేసి అవును లేదా కాదు అని స్పష్టంగా చెప్పండి.",
    duplicateAsk: "ఈ సమస్యపై ఇప్పటికే ఫిర్యాదు నమోదైంది. మీరు పాత ఫిర్యాదు స్థితిని తనిఖీ చేయాలనుకుంటున్నారా లేదా కొత్త ఫిర్యాదును నమోదు చేయాలనుకుంటున్నారా?",
    trackStatus: "మీ మునుపటి ఫిర్యాదు సంఖ్య {id}, మరియు దీని ప్రస్తుత స్థితి {status}.",
    repeatAsk: "ఈ సమస్యపై ఇప్పటికే ఫిర్యాదు నమోదైంది. మీరు పరిశీలించినప్పుడు ఇంకా సమస్య ఉందా?",
    durationAsk: "ఇది ఎంత సమయం నుండి ఇలా ఉంది? ఒక గంట కంటే తక్కువ, కొన్ని గంటలు, లేదా ఉదయం నుంచా?",
    privatePhoneAsk: "సౌకర్యం అందుబాటులోకి వచ్చినప్పుడు SMS ద్వారా తెలియజేయడానికి దయచేసి మీ మొబైల్ నంబర్ ఇవ్వండి.",
    privateOtpAsk: "మీ మొబైల్‌కు పంపిన 6 అంకెల OTP ని నమోదు చేయండి.",
    privateSuccess: "ధన్యవాదాలు. మీ అభ్యర్థన నమోదైంది. అందుబాటులోకి వచ్చిన వెంటనే SMS పంపుతాము.",
    repeatOptions: {
      stillUnclean: "ఇంకా శుభ్రంగా లేదు",
      clean: "లేదు, శుభ్రంగా ఉంది",
      worsened: "ఇంకా పాడైంది",
      returned: "మళ్లీ మొదలైంది",
    },
    durationOptions: {
      lessThanHour: "ఒక గంట కంటే తక్కువ",
      fewHours: "కొన్ని గంటల నుండి",
      sinceMorning: "ఉదయం నుండి",
      dontKnow: "తెలియదు",
    },
    yesWords: [
      "అవును",
      "avunu",
      "ha",
      "sare",
      "సరే",
      "పంపండి",
      "చేయండి",
      "నమోదు చేయి",
      "yes",
      "yeah",
      "ok",
      "okay",
    ],
    noWords: [
      "కాదు",
      "kaadhu",
      "వద్దు",
      "vaddu",
      "రద్దు",
      "వద్దు",
      "no",
      "nope",
      "stop",
    ],
  },
  ta: {
    askConfirmation: "மருத்துவமனையின் இந்த பிரச்சனையை நீங்கள் தெரிவித்துள்ளீர்கள். இந்த புகாரை உயர் அதிகாரிகளுக்கு அனுப்பலாமா?",
    successMessage: "நன்றி. உங்கள் புகார் எண் {id} வெற்றிகரமாக பதிவு செய்யப்பட்டுள்ளது. தயவுசெய்து ரசீதை பெற்றுக்கொள்ளவும்.",
    cancelMessage: "சரி, இந்த புகார் ரத்து செய்யப்பட்டது. நீங்கள் மீண்டும் கூறலாம்.",
    retryMessage: "மன்னிக்கவும், புரியவில்லை. தயவுசெய்து ஆம் அல்லது இல்லை என்று கூறவும்.",
    duplicateAsk: "இந்த பிரச்சனை குறித்து ஏற்கனவே புகார் பதிவு செய்யப்பட்டுள்ளது. முந்தைய புகாரின் நிலையை அறிய விரும்புகிறீர்களா அல்லது புதிய புகாரைப் பதிவு செய்ய விரும்புகிறீர்களா?",
    trackStatus: "உங்கள் முந்தைய புகார் எண் {id}, அதன் தற்போதைய நிலை {status}.",
    repeatAsk: "இந்த பிரச்சனை ஏற்கனவே பதிவாகியுள்ளது. நீங்கள் பார்த்தபோது இன்னும் சுத்தமில்லாமல் இருந்ததா?",
    durationAsk: "இது எவ்வளவு நேரமாக இப்படி உள்ளது? ஒரு மணி நேரத்திற்கும் குறைவாக, சில மணி நேரங்களாக, அல்லது காலையிலிருந்தா?",
    privatePhoneAsk: "வசதி கிடைக்கும்போது SMS மூலம் தெரிவிக்க உங்கள் மொபைல் எண்ணை வழங்கவும்.",
    privateOtpAsk: "உங்கள் மொபைலுக்கு அனுப்பப்பட்ட 6 இலக்க OTP ஐ உள்ளிடவும்.",
    privateSuccess: "நன்றி. உங்கள் கோரிக்கை பதிவு செய்யப்பட்டது. கிடைத்தவுடன் SMS மூலம் அறிவிப்போம்.",
    repeatOptions: {
      stillUnclean: "இன்னும் சுத்தமாக இல்லை",
      clean: "இல்லை, சுத்தமாக உள்ளது",
      worsened: "நிலைமை மோசமாகியுள்ளது",
      returned: "மீண்டும் வந்துள்ளது",
    },
    durationOptions: {
      lessThanHour: "ஒரு மணி நேரத்திற்கும் குறைவாக",
      fewHours: "சில மணி நேரங்களாக",
      sinceMorning: "காலையிலிருந்து",
      dontKnow: "தெரியாது",
    },
    yesWords: [
      "ஆம்",
      "aam",
      "aama",
      "சரி",
      "sari",
      "அனுப்புங்கள்",
      "பதிவு செய்",
      "yes",
      "yeah",
      "ok",
      "okay",
    ],
    noWords: [
      "இல்லை",
      "illai",
      "வேண்டாம்",
      "vendaam",
      "ரத்து",
      "no",
      "nope",
      "stop",
    ],
  },
  ml: {
    askConfirmation: "ആശുപത്രിയിലെ ഈ പ്രശ്നം നിങ്ങൾ അറിയിച്ചിട്ടുണ്ട്. ഈ പരാതി ബന്ധപ്പെട്ട ഉന്നത ഉദ്യോഗസ്ഥർക്ക് അയക്കട്ടെ?",
    successMessage: "നന്ദി. താങ്കളുടെ പരാതി നമ്പർ {id} വിജയകരമായി രജിസ്റ്റർ ചെയ്തു. ദയവായി രസീത് കൈപ്പറ്റുക.",
    cancelMessage: "ശരി, ഈ പരാതി റദ്ദാക്കി. താങ്കൾക്ക് വീണ്ടും പറയാം.",
    retryMessage: "ക്ഷമിക്കണം, മനസ്സിലായില്ല. അതെ അല്ലെങ്കിൽ അല്ല എന്ന് വ്യക്തമായി പറയുക.",
    duplicateAsk: "ഈ പ്രശ്നത്തെക്കുറിച്ച് നേരത്തെ പരാതി രജിസ്റ്റർ ചെയ്തിട്ടുണ്ട്. പഴയ പരാതിയുടെ നില പരിശോധിക്കണോ അതോ പുതിയ പരാതി നൽകണോ?",
    trackStatus: "താങ്കളുടെ മുൻ പരാതി നമ്പർ {id}, നിലവിലെ സ്ഥിതി {status}.",
    repeatAsk: "ഈ പ്രശ്നം നേരത്തെ റിപ്പോർട്ട് ചെയ്തതാണ്. താങ്കൾ കണ്ടപ്പോൾ വൃത്തിഹീനമായിരുന്നോ?",
    durationAsk: "ഇത് എത്ര സമയമായി ഇങ്ങനെയാണ്? ഒരു മണിക്കൂറിൽ താഴെ, ഏതാനും മണിക്കൂറുകൾ, അതോ രാവിലെ മുതലോ?",
    privatePhoneAsk: "ലഭ്യമാകുമ്പോൾ SMS അയക്കുന്നതിനായി താങ്കളുടെ മൊബൈൽ നമ്പർ നൽകുക.",
    privateOtpAsk: "മൊബൈലിൽ ലഭിച്ച 6 അക്ക OTP രേഖപ്പെടുത്തുക.",
    privateSuccess: "നന്ദി. താങ്കളുടെ അപേക്ഷ സ്വീകരിച്ചു. ലഭ്യമാകുമ്പോൾ SMS വഴി അറിയിക്കും.",
    repeatOptions: {
      stillUnclean: "ഇപ്പോഴും വൃത്തിഹീനമാണ്",
      clean: "അല്ല, വൃത്തിയായിട്ടുണ്ട്",
      worsened: "കൂടുതൽ മോശമായി",
      returned: "വീണ്ടും ഉണ്ടായി",
    },
    durationOptions: {
      lessThanHour: "ഒരു മണിക്കൂറിൽ താഴെ",
      fewHours: "ഏതാനും മണിക്കൂറുകൾ",
      sinceMorning: "രാവിലെ മുതൽ",
      dontKnow: "അറിയില്ല",
    },
    yesWords: [
      "അതെ",
      "athe",
      "ശരി",
      "shari",
      "അയക്കുക",
      "രജിസ്റ്റർ ചെയ്യുക",
      "yes",
      "yeah",
      "ok",
      "okay",
    ],
    noWords: [
      "അല്ല",
      "alla",
      "വേണ്ട",
      "venda",
      "റദ്ദാക്കുക",
      "no",
      "nope",
      "stop",
    ],
  },
  en: {
    askConfirmation: "You have reported this issue. Shall I send this complaint to the hospital authorities?",
    successMessage: "Thank you. Your complaint ID {id} has been successfully registered. Please collect your receipt.",
    cancelMessage: "Understood. The complaint has been cancelled. You may speak again.",
    retryMessage: "Sorry, I didn't catch that. Please say Yes or No.",
    duplicateAsk: "A similar complaint has already been registered today. Would you like to check its status or register a new complaint?",
    trackStatus: "Your previous complaint number is {id}, and its current status is {status}.",
    repeatAsk: "This issue has already been reported. When you visited, was it still unclean?",
    durationAsk: "How long has it been like this? Less than an hour, A few hours, or Since morning?",
    privatePhoneAsk: "Please provide your 10-digit mobile number so we can notify you via SMS when available.",
    privateOtpAsk: "Please enter the 6-digit verification code sent to your mobile.",
    privateSuccess: "Thank you. Your private availability request has been registered. You will be notified via SMS.",
    repeatOptions: {
      stillUnclean: "Still unclean",
      clean: "No, it was clean",
      worsened: "Issue worsened",
      returned: "Issue returned",
    },
    durationOptions: {
      lessThanHour: "Less than an hour",
      fewHours: "A few hours",
      sinceMorning: "Since morning",
      dontKnow: "I don't know",
    },
    yesWords: [
      "yes",
      "yeah",
      "yep",
      "sure",
      "proceed",
      "send",
      "submit",
      "confirm",
      "ok",
      "okay",
      "affirmative",
      "correct",
    ],
    noWords: [
      "no",
      "nope",
      "cancel",
      "stop",
      "abort",
      "don't",
      "incorrect",
    ],
  },
};

export class TTSService {
  static getPhrases(lang: string = "en"): SpokenConfirmationPhrases {
    const code = (lang || "en").toLowerCase().split("-")[0];
    return LANGUAGE_PHRASES[code] || LANGUAGE_PHRASES.en;
  }

  /**
   * Speaks the given text reliably using Web Speech Synthesis API.
   * Resolves when speech finishes speaking or upon timeout.
   */
  static speak(text: string, lang: string = "en"): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        setTimeout(resolve, 500);
        return;
      }

      try {
        window.speechSynthesis.cancel();
        // Chrome bug workaround: resume if paused
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch (e) {}

      const utterance = new SpeechSynthesisUtterance(text);

      const langMap: Record<string, string> = {
        kn: "kn-IN",
        hi: "hi-IN",
        te: "te-IN",
        ta: "ta-IN",
        ml: "ml-IN",
        en: "en-US",
        bn: "bn-IN",
        mr: "mr-IN",
        gu: "gu-IN",
      };

      const cleanCode = (lang || "en").toLowerCase().split("-")[0];
      utterance.lang = langMap[cleanCode] || "en-US";
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      let hasResolved = false;
      const finish = () => {
        if (!hasResolved) {
          hasResolved = true;
          resolve();
        }
      };

      utterance.onend = finish;
      utterance.onerror = (e) => {
        console.warn("TTS playback status/ended:", e);
        finish();
      };

      // Match voice
      try {
        const voices = window.speechSynthesis.getVoices();
        const bcp47 = utterance.lang.toLowerCase();
        const matched = voices.find((v) => {
          const vLang = v.lang.toLowerCase().replace(/_/g, "-");
          return vLang === bcp47 || vLang.startsWith(cleanCode);
        });
        if (matched) {
          utterance.voice = matched;
        }
      } catch (err) {}

      // Keep-alive timer for speech synthesis in Chrome
      const words = text.split(/\s+/).length;
      const maxDuration = Math.max(3000, words * 450);
      const timer = setTimeout(finish, maxDuration);

      try {
        window.speechSynthesis.speak(utterance);
      } catch (speakErr) {
        clearTimeout(timer);
        finish();
      }
    });
  }

  static stop(): void {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }

  static parseYesNo(text: string, lang?: string): "YES" | "NO" | "UNCLEAR" {
    if (!text || !text.trim()) return "UNCLEAR";
    const clean = text.toLowerCase().trim();

    if (lang) {
      const cleanLang = lang.toLowerCase().split("-")[0];
      const phrases = LANGUAGE_PHRASES[cleanLang];
      if (phrases) {
        for (const w of phrases.yesWords) {
          if (clean === w || clean.includes(w)) return "YES";
        }
        for (const w of phrases.noWords) {
          if (clean === w || clean.includes(w)) return "NO";
        }
      }
    }

    for (const key of Object.keys(LANGUAGE_PHRASES)) {
      for (const w of LANGUAGE_PHRASES[key].yesWords) {
        if (clean === w || clean.includes(w)) return "YES";
      }
      for (const w of LANGUAGE_PHRASES[key].noWords) {
        if (clean === w || clean.includes(w)) return "NO";
      }
    }

    return "UNCLEAR";
  }

  static extractDigits(text: string): string {
    const wordDigitMap: Record<string, string> = {
      zero: "0", one: "1", two: "2", three: "3", four: "4",
      five: "5", six: "6", seven: "7", eight: "8", nine: "9",
      ek: "1", do: "2", teen: "3", chaar: "4", paanch: "5",
      chhah: "6", saat: "7", aath: "8", nau: "9", shunya: "0",
      ondu: "1", eradu: "2", mooru: "3", naalku: "4", aidu: "5",
      aaru: "6", eelu: "7", entu: "8", ombattu: "9", sonne: "0",
    };

    let result = "";
    for (const char of text) {
      if (/\d/.test(char)) result += char;
    }

    if (result.length < 10) {
      const words = text.toLowerCase().split(/[\s,.-]+/);
      for (const word of words) {
        if (wordDigitMap[word]) result += wordDigitMap[word];
      }
    }

    return result;
  }
}
