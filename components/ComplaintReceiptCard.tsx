"use client";

import React from "react";
import { Printer, Download, CheckCircle2 } from "lucide-react";
import { ComplaintReceipt } from "@/types";

interface Props {
  receipt: ComplaintReceipt;
  languageCode?: string;
  onPrint?: () => void;
  showActions?: boolean;
}

const RECEIPT_TRANSLATIONS: Record<string, {
  title: string;
  subTitle: string;
  complaintId: string;
  issue: string;
  language: string;
  category: string;
  forwardedTo: string;
  authority: string;
  location: string;
  status: string;
  footer: string;
  print: string;
  download: string;
  dateTime: string;
}> = {
  kn: {
    title: "ಜನಸುವಿಧಾ",
    subTitle: "ಆಸ್ಪತ್ರೆ ಕುಂದುಕೊರತೆ ಸ್ವೀಕೃತಿ ರಶೀದಿ",
    complaintId: "ದೂರು ಸಂಖ್ಯೆ / Complaint ID",
    issue: "ದೂರಿನ ವಿವರ",
    language: "ಮೂಲ ಭಾಷೆ",
    category: "ವರ್ಗ",
    forwardedTo: "ರವಾನಿಸಲಾದ ಇಲಾಖೆ",
    authority: "ಜವಾಬ್ದಾರಿಯುತ ಅಧಿಕಾರಿ",
    location: "ಸ್ಥಳ",
    status: "ಸ್ಥಿತಿ",
    footer: "ದಯವಿಟ್ಟು ಮುಂದಿನ ಪರಿಶೀಲನೆಗಾಗಿ ಈ ರಶೀದಿಯನ್ನು ಇಟ್ಟುಕೊಳ್ಳಿ.",
    print: "ಮುದ್ರಿಸಿ (Print)",
    download: "ಡೌನ್‌ಲೋಡ್ (Download)",
    dateTime: "ದಿನಾಂಕ ಮತ್ತು ಸಮಯ",
  },
  hi: {
    title: "जनसुविधा",
    subTitle: "अस्पताल शिकायत पावती रसीद",
    complaintId: "शिकायत संख्या / Complaint ID",
    issue: "शिकायत विवरण",
    language: "मूल भाषा",
    category: "श्रेणी",
    forwardedTo: "भेजा गया विभाग",
    authority: "जिम्मेदार अधिकारी",
    location: "स्थान",
    status: "स्थिति",
    footer: "कृपया भविष्य के संदर्भ के लिए यह रसीद सुरक्षित रखें।",
    print: "प्रिंट करें (Print)",
    download: "डाउनलोड (Download)",
    dateTime: "दिनांक और समय",
  },
  te: {
    title: "జనసువిధ",
    subTitle: "ఆసుపత్రి ఫిర్యాదు రసీదు",
    complaintId: "ఫిర్యాదు సంఖ్య / Complaint ID",
    issue: "ఫిర్యాదు వివరాలు",
    language: "భాష",
    category: "వర్గం",
    forwardedTo: "పంపిన విభాగం",
    authority: "బాధ్యతాయుత అధికారి",
    location: "ప్రాంతం",
    status: "స్థితి",
    footer: "దయచేసి భవిష్యత్తు కోసం ఈ రసీదును భద్రపరుచుకోండి.",
    print: "ప్రింట్ (Print)",
    download: "డౌన్‌లోడ్ (Download)",
    dateTime: "తేదీ మరియు సమయం",
  },
  ta: {
    title: "ஜனசுவிதா",
    subTitle: "மருத்துவமனை புகார் ஒப்புதல் ரசீது",
    complaintId: "புகார் எண் / Complaint ID",
    issue: "புகார் விவரம்",
    language: "மொழி",
    category: "பிரிவு",
    forwardedTo: "அனுப்பப்பட்ட துறை",
    authority: "பொறுப்பு அதிகாரி",
    location: "இடம்",
    status: "நிலை",
    footer: "எதிர்கால கண்காணிப்புக்கு இந்த ரசீதை பாதுகாக்கவும்.",
    print: "அச்சிடுக (Print)",
    download: "பதிவிறக்கு (Download)",
    dateTime: "தேதி மற்றும் நேரம்",
  },
  ml: {
    title: "ജനസുവിധ",
    subTitle: "ആശുപത്രി പരാതി രസീത്",
    complaintId: "പരാതി നമ്പർ / Complaint ID",
    issue: "പരാതി",
    language: "ഭാഷ",
    category: "വിഭാഗം",
    forwardedTo: "കൈമാറിയ വകുപ്പ്",
    authority: "ഉത്തരവാദപ്പെട്ട ഉദ്യോഗസ്ഥൻ",
    location: "സ്ഥലം",
    status: "സ്ഥിതി",
    footer: "തുടർ ആവശ്യങ്ങൾക്കായി ഈ രസീത് സൂക്ഷിക്കുക.",
    print: "പ്രിന്റ് (Print)",
    download: "ഡൗൺലോഡ് (Download)",
    dateTime: "തീയതിയും സമയവും",
  },
  en: {
    title: "JANASUVIDHA",
    subTitle: "Hospital Grievance Acknowledgement",
    complaintId: "Complaint ID",
    issue: "Complaint",
    language: "Original Language",
    category: "Category",
    forwardedTo: "Forwarded To",
    authority: "Responsible Authority",
    location: "Location",
    status: "Status",
    footer: "Please keep this slip for future reference & tracking.",
    print: "Print Receipt",
    download: "Download Slip",
    dateTime: "Date & Time",
  },
};

export function ComplaintReceiptCard({
  receipt,
  languageCode = "en",
  onPrint,
  showActions = true,
}: Props) {
  if (!receipt) return null;

  const t = RECEIPT_TRANSLATIONS[languageCode] || RECEIPT_TRANSLATIONS["en"];

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleDownload = () => {
    const textContent = `
========================================
             JANASUVIDHA
   ${t.subTitle}
========================================

${t.complaintId}:        ${receipt.complaintNumber}
${t.status}:              ${receipt.status}

${t.issue.toUpperCase()}:
${receipt.complaintText}

${t.language}:   ${receipt.originalLanguage}
${t.category}:            ${receipt.category}
${t.forwardedTo}:        ${receipt.forwardedTo}
${t.authority}: ${receipt.responsibleAuthority}

${t.location}:            ${receipt.location}
Date:                ${receipt.submissionDate}
Time:                ${receipt.submissionTime}
Time Zone:           ${receipt.timeZone}

----------------------------------------
${t.footer}
${receipt.hospitalName || "Outpatient Department, Ballari"} • JANASUVIDHA
========================================
`.trim();

    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Receipt_${receipt.complaintNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* THERMAL / TOKEN PHYSICAL RECEIPT CARD */}
      <div
        id="printable-receipt"
        className="w-full max-w-[340px] bg-white border-2 border-dashed border-[#147D78]/50 rounded-2xl p-5 shadow-sm text-left font-sans text-xs text-[#263238] select-text relative"
      >
        {/* HEADER BRANDING */}
        <div className="text-center pb-3 border-b border-dashed border-gray-300">
          <div className="text-base font-extrabold tracking-widest text-[#12343B]">
            {t.title}
          </div>
          <div className="text-[10px] text-[#607477] font-medium uppercase tracking-wider mt-0.5">
            {t.subTitle}
          </div>
          <div className="text-[11px] text-[#147D78] font-bold mt-0.5">
            {receipt.hospitalName || "Outpatient Department, Ballari"}
          </div>
        </div>

        {/* COMPLAINT TOKEN NUMBER */}
        <div className="my-3 py-2 px-3 bg-[#E8F4F1] border border-[#147D78]/20 rounded-xl text-center">
          <div className="text-[9px] uppercase tracking-wider text-[#607477] font-bold">
            {t.complaintId}
          </div>
          <div className="text-lg font-mono font-extrabold text-[#12343B] tracking-tight">
            {receipt.complaintNumber}
          </div>
        </div>

        {/* RECEIPT FIELDS */}
        <div className="space-y-2 py-1 text-[11px] leading-snug">
          <div>
            <span className="text-[#607477] text-[10px] uppercase block font-semibold">
              {t.issue}:
            </span>
            <span className="font-bold text-[#12343B] block mt-0.5">
              {receipt.complaintText}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
            <div>
              <span className="text-[#607477] text-[10px] uppercase block font-medium">
                {t.language}:
              </span>
              <span className="font-semibold text-[#12343B]">
                {receipt.originalLanguage}
              </span>
            </div>
            <div>
              <span className="text-[#607477] text-[10px] uppercase block font-medium">
                {t.category}:
              </span>
              <span className="font-semibold text-[#12343B]">
                {receipt.category}
              </span>
            </div>
          </div>

          <div className="pt-1 border-t border-gray-100">
            <span className="text-[#607477] text-[10px] uppercase block font-medium">
              {t.forwardedTo}:
            </span>
            <span className="font-bold text-[#147D78]">
              {receipt.forwardedTo}
            </span>
          </div>

          <div>
            <span className="text-[#607477] text-[10px] uppercase block font-medium">
              {t.authority}:
            </span>
            <span className="font-medium text-[#12343B]">
              {receipt.responsibleAuthority}
            </span>
          </div>

          <div className="pt-1 border-t border-gray-100 grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span className="text-[#607477] block font-medium">{t.dateTime}:</span>
              <span className="font-medium text-[#12343B]">
                {receipt.submissionDate} {receipt.submissionTime}
              </span>
            </div>
            <div>
              <span className="text-[#607477] block font-medium">{t.status}:</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {receipt.status}
              </span>
            </div>
          </div>
        </div>

        {/* FOOTER BARCODE / INSTRUCTION */}
        <div className="mt-3 pt-3 border-t border-dashed border-gray-300 text-center space-y-1">
          <p className="text-[10px] text-[#607477] leading-tight font-medium">
            {t.footer}
          </p>
          <div className="text-[9px] text-[#607477]/70 font-mono tracking-widest pt-1">
            * * * JANASUVIDHA TICKET * * *
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS (Hidden in print) */}
      {showActions && (
        <div className="mt-3 flex items-center justify-center gap-2 no-print">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-[#12343B] shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#147D78]" />
            <span>{t.print}</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-[#12343B] shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#147D78]" />
            <span>{t.download}</span>
          </button>
        </div>
      )}
    </div>
  );
}
