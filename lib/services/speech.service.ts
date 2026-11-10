import { Language } from "@/types";

export interface SpeechRecognitionResult {
  transcript: string;
  detectedLanguage: Language;
  confidence: number;
  isSimulated?: boolean;
}

export class SpeechService {
  /**
   * Automatically detects the spoken language from the unicode script of the transcript.
   */
  static detectLanguageFromText(text: string): Language {
    if (/[\u0C80-\u0CFF]/.test(text)) {
      return "kn";
    }
    if (/[\u0900-\u097F]/.test(text)) {
      return "hi";
    }
    return "en";
  }

  /**
   * Browser Speech Recognition with automatic language detection.
   */
  static createRecognizer(
    onResult: (result: { text: string; isFinal: boolean; detectedLang: Language }) => void,
    onError: (err: any) => void
  ) {
    if (typeof window === "undefined") return null;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      const isFinal = event.results[current].isFinal;
      const detectedLang = SpeechService.detectLanguageFromText(transcript);
      onResult({ text: transcript, isFinal, detectedLang });
    };

    recognition.onerror = (event: any) => {
      onError(event.error);
    };

    return recognition;
  }
}
