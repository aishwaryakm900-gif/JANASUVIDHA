"use client";

import React from "react";
import { Printer, Download, CheckCircle2 } from "lucide-react";
import { ComplaintReceipt } from "@/types";

interface Props {
  receipt: ComplaintReceipt;
  onPrint?: () => void;
  showActions?: boolean;
}

export function ComplaintReceiptCard({ receipt, onPrint, showActions = true }: Props) {
  if (!receipt) return null;

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
   Hospital Grievance Acknowledgement
========================================

Complaint ID:        ${receipt.complaintNumber}
Status:              ${receipt.status}

COMPLAINT:
${receipt.complaintText}

Original Language:   ${receipt.originalLanguage}
Category:            ${receipt.category}
Forwarded To:        ${receipt.forwardedTo}
Responsible Authority: ${receipt.responsibleAuthority}

Location:            ${receipt.location}
Date:                ${receipt.submissionDate}
Time:                ${receipt.submissionTime}
Time Zone:           ${receipt.timeZone}

----------------------------------------
Please keep this receipt for future reference.
Victoria District Hospital • JANASUVIDHA
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
        className="w-full max-w-[320px] bg-white border border-dashed border-[#147D78]/40 rounded-xl p-5 shadow-xs text-left font-sans text-xs text-[#263238] select-text relative"
      >
        {/* HEADER BRANDING */}
        <div className="text-center pb-3 border-b border-dashed border-gray-300">
          <div className="text-sm font-extrabold tracking-widest text-[#12343B]">
            JANASUVIDHA
          </div>
          <div className="text-[10px] text-[#607477] font-medium uppercase tracking-wider mt-0.5">
            Hospital Grievance Acknowledgement
          </div>
          <div className="text-[10px] text-[#147D78] font-semibold mt-0.5">
            {receipt.hospitalName}
          </div>
        </div>

        {/* COMPLAINT TOKEN NUMBER */}
        <div className="my-3 py-2 px-3 bg-[#E8F4F1] border border-[#147D78]/20 rounded-lg text-center">
          <div className="text-[9px] uppercase tracking-wider text-[#607477] font-semibold">
            Complaint ID
          </div>
          <div className="text-base font-mono font-bold text-[#12343B] tracking-tight">
            {receipt.complaintNumber}
          </div>
        </div>

        {/* RECEIPT FIELDS */}
        <div className="space-y-2 py-1 text-[11px] leading-snug">
          <div>
            <span className="text-[#607477] text-[10px] uppercase block font-medium">
              Complaint:
            </span>
            <span className="font-semibold text-[#12343B]">
              {receipt.complaintText}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
            <div>
              <span className="text-[#607477] text-[10px] uppercase block font-medium">
                Original Language:
              </span>
              <span className="font-medium text-[#12343B]">
                {receipt.originalLanguage}
              </span>
            </div>
            <div>
              <span className="text-[#607477] text-[10px] uppercase block font-medium">
                Category:
              </span>
              <span className="font-medium text-[#12343B]">
                {receipt.category}
              </span>
            </div>
          </div>

          <div className="pt-1 border-t border-gray-100">
            <span className="text-[#607477] text-[10px] uppercase block font-medium">
              Forwarded To:
            </span>
            <span className="font-semibold text-[#147D78]">
              {receipt.forwardedTo}
            </span>
          </div>

          <div>
            <span className="text-[#607477] text-[10px] uppercase block font-medium">
              Responsible Authority:
            </span>
            <span className="font-medium text-[#12343B]">
              {receipt.responsibleAuthority}
            </span>
          </div>

          <div className="pt-1 border-t border-gray-100">
            <span className="text-[#607477] text-[10px] uppercase block font-medium">
              Location:
            </span>
            <span className="text-[#12343B]">
              {receipt.location}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
            <div>
              <span className="text-[#607477] text-[10px] uppercase block font-medium">
                Date:
              </span>
              <span className="text-[#12343B] font-mono">
                {receipt.submissionDate}
              </span>
            </div>
            <div>
              <span className="text-[#607477] text-[10px] uppercase block font-medium">
                Time:
              </span>
              <span className="text-[#12343B] font-mono">
                {receipt.submissionTime}
              </span>
            </div>
          </div>

          <div className="pt-1">
            <span className="text-[#607477] text-[9px] uppercase block">
              Time Zone:
            </span>
            <span className="text-[#607477] text-[10px] font-mono">
              {receipt.timeZone}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-300">
            <span className="text-[#607477] font-medium text-[10px]">
              Status:
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-[#147D78] bg-[#E8F4F1] px-2 py-0.5 rounded text-[10px]">
              <CheckCircle2 className="w-3 h-3" />
              {receipt.status}
            </span>
          </div>
        </div>

        {/* QR CODE & FOOTER ADVISORY */}
        <div className="mt-3 pt-3 border-t border-dashed border-gray-300 flex items-center justify-between">
          <div className="flex-1 pr-2">
            <p className="text-[9px] text-[#607477] leading-tight italic">
              "Please keep this receipt for future reference."
            </p>
          </div>
          {/* Subtle QR representation */}
          <div className="w-10 h-10 bg-white border border-gray-300 p-0.5 rounded flex items-center justify-center shrink-0">
            <svg
              className="w-8 h-8 text-gray-800"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v3h-3v-3zm-5 5h3v3h-3v-3zm5 0h3v3h-3v-3zm-2-2h2v2h-2v-2zm-3-3h2v2h-2v-2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS (Hidden in Print) */}
      {showActions && (
        <div className="no-print mt-4 flex flex-wrap gap-2 justify-center w-full max-w-[320px]">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-[#147D78] hover:bg-[#0e5e5a] text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-gray-50 text-[#607477] text-xs font-semibold py-2.5 px-3 rounded-xl border border-[#E2EBE8] transition-colors"
            title="Download receipt text file"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        </div>
      )}
    </div>
  );
}

