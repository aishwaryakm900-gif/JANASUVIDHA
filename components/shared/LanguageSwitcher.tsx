"use client";

import { SUPPORTED_LANGUAGES, Language } from "@/types";
import { Globe } from "lucide-react";
import { useState, useEffect } from "react";

interface LanguageSwitcherProps {
  onLanguageChange?: (lang: Language) => void;
  currentLang?: Language;
}

export function LanguageSwitcher({ onLanguageChange, currentLang = "en" }: LanguageSwitcherProps) {
  const [selected, setSelected] = useState<Language>(currentLang);

  useEffect(() => {
    setSelected(currentLang);
  }, [currentLang]);

  const handleChange = (lang: Language) => {
    setSelected(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("janasuvidha_lang", lang);
    }
    if (onLanguageChange) {
      onLanguageChange(lang);
    }
  };

  return (
    <div className="inline-flex items-center bg-teal-subtle/80 border border-teal-primary/20 rounded-lg p-1 text-sm shadow-sm">
      <Globe className="w-4 h-4 text-teal-primary ml-1.5 mr-2" />
      <div className="flex gap-1">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isActive = selected === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleChange(lang.code)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                isActive
                  ? "bg-teal-primary text-white shadow-sm"
                  : "text-text-muted hover:text-teal-deep hover:bg-white"
              }`}
            >
              {lang.nativeLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}

