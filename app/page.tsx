"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mic,
  ArrowRight,
  UserCheck,
  Shield,
  Languages,
  Clock,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileText,
  Sparkles,
  Pill,
  ShieldCheck,
  EyeOff,
  Bell,
  Activity,
  Layers,
  ChevronRight,
} from "lucide-react";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"all" | "citizens" | "officials" | "admins">("all");

  const GAPS_DATA = [
    {
      id: "language",
      gapTitle: "The Language & Literacy Barrier",
      traditionalProblem: "Traditional complaint systems require writing letters or navigating complex English-only online forms. Over 65% of public hospital patients are rural, elderly, or illiterate and cannot register grievances.",
      janasuvidhaSolution: "Voice-First Multilingual AI: Patients speak naturally in Kannada, Hindi, or English. Gemini AI transcribes, translates, and speaks back in their own language with zero typing required.",
      category: "citizens",
      icon: Languages,
      tag: "Accessibility Gap",
      accent: "teal",
    },
    {
      id: "routing",
      gapTitle: "Bureaucratic Misrouting & Lost Complaints",
      traditionalProblem: "Complaints dropped into physical suggestion boxes or generic email inboxes sit unattended for weeks before reaching the correct technical or sanitation department.",
      janasuvidhaSolution: "Instant AI Department Dispatch: AI classifies the issue (Hygiene, Water, Pharmacy, Beds, Infrastructure) and directly alerts the concerned officer with strict SLA turnaround countdowns.",
      category: "officials",
      icon: Bell,
      tag: "Efficiency Gap",
      accent: "amber",
    },
    {
      id: "paper-closure",
      gapTitle: "Ghost Resolutions (Closed on Paper Only)",
      traditionalProblem: "Officials frequently mark grievances as 'Resolved' in paperwork without performing any physical repair or cleaning on the hospital floor.",
      janasuvidhaSolution: "Mandatory Before & After Photo Proof: Ground staff cannot resolve a ticket without uploading timestamped Before & After photo evidence, verified by a supervisor's physical inspection.",
      category: "officials",
      icon: Camera,
      tag: "Accountability Gap",
      accent: "rose",
    },
    {
      id: "black-box",
      gapTitle: "The 'Black Box' Complaint Drop",
      traditionalProblem: "Citizens receive no acknowledgment, no complaint ID, and no way to track whether their issue is being worked on, leading to deep public cynicism.",
      janasuvidhaSolution: "Physical Slip + Live Tracking & SMS: Citizens receive an instant bilingual slip with a unique ID (e.g. JNS-2026-000103) and can track real-time resolution progress on the public board.",
      category: "citizens",
      icon: FileText,
      tag: "Transparency Gap",
      accent: "cyan",
    },
    {
      id: "medicine",
      gapTitle: "Unnotified Medicine Stockouts",
      traditionalProblem: "Patients travel long distances to collect critical government hospital medications, only to find them out of stock with no notification of restock dates.",
      janasuvidhaSolution: "Automated Restock SMS Alerts: Patients register unavailable medications via the kiosk. The moment pharmacy replenishes inventory, an automatic SMS alert is sent to their phone.",
      category: "citizens",
      icon: Pill,
      tag: "Healthcare Supply Gap",
      accent: "emerald",
    },
    {
      id: "retribution",
      gapTitle: "Fear of Retaliation & Privacy Risks",
      traditionalProblem: "Patients often avoid reporting hygiene or facility failures because their names or phone numbers might be exposed to hospital staff, risking mistreatment.",
      janasuvidhaSolution: "100% PII Anonymization on Public Board: All shared hospital concerns are publicly visible for community accountability, while patient names and phone numbers are strictly encrypted.",
      category: "admins",
      icon: EyeOff,
      tag: "Safety & Privacy Gap",
      accent: "indigo",
    },
  ];

  const filteredGaps =
    activeTab === "all" ? GAPS_DATA : GAPS_DATA.filter((g) => g.category === activeTab);

  return (
    <div className="flex-1 flex flex-col w-full bg-[#F5F8F7] relative overflow-hidden">
      {/* AMBIENT BACKGROUND GLOW WITH SLOW PULSE */}
      <div
        className="absolute inset-0 pointer-events-none -z-10 opacity-60"
        style={{
          backgroundImage: "radial-gradient(#147D78 0.75px, transparent 0.75px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse 70% 50% at 50% 20%, black 20%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 50% at 50% 20%, black 20%, transparent 80%)",
        }}
      />
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[850px] h-[450px] rounded-full bg-gradient-to-b from-teal-200/25 via-emerald-100/15 to-transparent blur-3xl pointer-events-none -z-10 animate-glow-pulse" />

      {/* 1. HERO SECTION */}
      <section className="max-w-5xl mx-auto w-full px-6 pt-12 md:pt-16 pb-12 text-center space-y-6">
        {/* Pilot Hospital Badge with floating animation */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 border border-[#147D78]/30 text-[#147D78] text-xs font-semibold shadow-xs backdrop-blur-md animate-float-slow">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span>Government of Karnataka • Outpatient Department, Ballari</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#12343B] leading-[1.12]">
          Every Voice Matters.
          <br />
          <span className="text-[#147D78]">Every Complaint Counts.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-xl text-[#263238] font-normal leading-relaxed max-w-3xl mx-auto">
          An AI-powered, voice-first grievance redressal platform engineered for Indian public hospitals.
          Bridging the literacy divide, eliminating ghost resolutions with mandatory photo proof, and routing
          issues directly to responsible officials in seconds.
        </p>

        {/* Multilingual Support Pill with Live Voice Equalizer Bars */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-[#607477] font-medium">
          <span className="flex items-center gap-2 bg-white/90 px-3.5 py-1.5 rounded-xl border border-[#E2EBE8] shadow-xs">
            <div className="flex items-center gap-0.5 h-4 w-4">
              <span className="w-0.5 bg-[#147D78] rounded-full animate-[wave-bounce_1.1s_ease-in-out_infinite]" />
              <span className="w-0.5 bg-[#147D78] rounded-full animate-[wave-bounce_1.1s_ease-in-out_infinite_0.2s]" />
              <span className="w-0.5 bg-[#147D78] rounded-full animate-[wave-bounce_1.1s_ease-in-out_infinite_0.4s]" />
              <span className="w-0.5 bg-[#147D78] rounded-full animate-[wave-bounce_1.1s_ease-in-out_infinite_0.1s]" />
            </div>
            <span>Speak naturally in:</span>
          </span>
          <span className="bg-[#E8F4F1] text-[#147D78] font-bold px-2.5 py-1 rounded-lg border border-[#147D78]/20 hover:scale-105 transition-transform cursor-default">ಕನ್ನಡ (Kannada)</span>
          <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-[#E2EBE8] hover:scale-105 transition-transform cursor-default">English</span>
          <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-[#E2EBE8] hover:scale-105 transition-transform cursor-default">हिन्दी (Hindi)</span>
          <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-[#E2EBE8] hover:scale-105 transition-transform cursor-default">తెలుగు</span>
          <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-[#E2EBE8] hover:scale-105 transition-transform cursor-default">தமிழ்</span>
          <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-[#E2EBE8] hover:scale-105 transition-transform cursor-default">മലയാളം</span>
        </div>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href="/citizen/kiosk"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#147D78] hover:bg-[#0e5e5a] text-white text-sm sm:text-base font-bold py-3.5 px-8 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 group relative overflow-hidden"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-300 animate-ping absolute left-5 top-5" />
            <Mic className="w-5 h-5 group-hover:scale-110 transition-transform relative z-10" />
            <span className="relative z-10">Launch Citizen Voice Kiosk</span>
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform relative z-10" />
          </Link>

          <Link
            href="/citizen/kiosk/report"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-[#E8F4F1] text-[#12343B] text-sm sm:text-base font-semibold py-3.5 px-6 rounded-2xl border border-[#E2EBE8] hover:border-[#147D78]/30 hover:-translate-y-0.5 transition-all shadow-xs"
          >
            <Activity className="w-4 h-4 text-[#147D78]" />
            <span>View Public Issue Board</span>
          </Link>
        </div>

        {/* 4 Trust Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-8 max-w-4xl mx-auto text-left">
          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-[#E2EBE8] shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 text-[#147D78] mb-1">
              <Mic className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Voice-First</span>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-[#12343B]">0 Typing</p>
            <p className="text-xs text-[#607477]">Accessible to illiterate & elderly citizens</p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-[#E2EBE8] shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Auto-Triage</span>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-[#12343B]">&lt; 5 Sec</p>
            <p className="text-xs text-[#607477]">AI categorization & department notification</p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-[#E2EBE8] shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <Camera className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Proof of Work</span>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-[#12343B]">100%</p>
            <p className="text-xs text-[#607477]">Mandatory Before/After ground photos</p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-[#E2EBE8] shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Citizen Safety</span>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-[#12343B]">Zero PII</p>
            <p className="text-xs text-[#607477]">Public board hides phone & personal data</p>
          </div>
        </div>
      </section>

      {/* 2. THE CRITICAL GAPS SECTION — HOW JANASUVIDHA SOLVES THEM */}
      <section className="bg-white border-y border-[#E2EBE8] py-16 px-6 relative">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-bold text-[#147D78] uppercase tracking-wider bg-[#E8F4F1] px-3 py-1 rounded-full border border-[#147D78]/20">
              Systemic Problem vs. Technology Solution
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#12343B]">
              How We Solve Public Healthcare Gaps
            </h2>
            <p className="text-sm sm:text-base text-[#607477] leading-relaxed">
              Public hospitals in India face severe structural obstacles when handling patient grievances.
              Here is how JanaSuvidha transforms each failure point into an accountable workflow.
            </p>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all ${
                  activeTab === "all"
                    ? "bg-[#147D78] text-white shadow-xs"
                    : "bg-[#F5F8F7] text-[#607477] hover:text-[#12343B]"
                }`}
              >
                All 6 Gaps
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("citizens")}
                className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all ${
                  activeTab === "citizens"
                    ? "bg-[#147D78] text-white shadow-xs"
                    : "bg-[#F5F8F7] text-[#607477] hover:text-[#12343B]"
                }`}
              >
                Patient & Citizen Gaps
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("officials")}
                className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all ${
                  activeTab === "officials"
                    ? "bg-[#147D78] text-white shadow-xs"
                    : "bg-[#F5F8F7] text-[#607477] hover:text-[#12343B]"
                }`}
              >
                Hospital Staff Gaps
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("admins")}
                className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all ${
                  activeTab === "admins"
                    ? "bg-[#147D78] text-white shadow-xs"
                    : "bg-[#F5F8F7] text-[#607477] hover:text-[#12343B]"
                }`}
              >
                Governance & Privacy Gaps
              </button>
            </div>
          </div>

          {/* 6 Gap Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredGaps.map((item) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={item.id}
                  className="bg-[#F5F8F7] rounded-3xl p-6 border border-[#E2EBE8] hover:border-[#147D78]/40 transition-all duration-300 flex flex-col justify-between space-y-4 relative group hover:-translate-y-1.5 hover:shadow-xl"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-2xl bg-white text-[#147D78] group-hover:bg-[#147D78] group-hover:text-white flex items-center justify-center font-bold shadow-xs transition-all duration-300 group-hover:scale-105">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold text-[#147D78] bg-[#E8F4F1] px-3 py-1 rounded-full border border-[#147D78]/20 group-hover:border-[#147D78]/40 transition-colors">
                        {item.tag}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#12343B] group-hover:text-[#147D78] transition-colors">{item.gapTitle}</h3>

                    {/* The Old Broken Way */}
                    <div className="bg-white/90 rounded-2xl p-3.5 border border-rose-100 text-xs text-[#263238] space-y-1 group-hover:border-rose-200 transition-colors shadow-2xs">
                      <div className="flex items-center gap-1.5 text-rose-700 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>The Traditional Gap:</span>
                      </div>
                      <p className="text-[#607477] leading-relaxed pl-5">{item.traditionalProblem}</p>
                    </div>

                    {/* The JanaSuvidha Solution */}
                    <div className="bg-[#E8F4F1]/80 rounded-2xl p-3.5 border border-[#147D78]/25 text-xs text-[#12343B] space-y-1 group-hover:bg-[#E8F4F1] transition-colors shadow-2xs">
                      <div className="flex items-center gap-1.5 text-[#147D78] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>JanaSuvidha Redressal:</span>
                      </div>
                      <p className="text-[#263238] leading-relaxed pl-5 font-semibold">
                        {item.janasuvidhaSolution}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. END-TO-END 4-STEP WORKFLOW */}
      <section className="py-16 px-6 max-w-5xl mx-auto w-full space-y-12">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-[#147D78] uppercase tracking-wider bg-[#E8F4F1] px-3 py-1 rounded-full border border-[#147D78]/20">
            Clear, Transparent Accountability
          </span>
          <h2 className="text-3xl font-extrabold text-[#12343B]">
            How a Complaint Becomes a Verified Fix
          </h2>
          <p className="text-sm text-[#607477]">
            From spoken voice to ground photographic proof in 4 deterministic steps.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Step 1 */}
          <div className="bg-white rounded-3xl p-6 border border-[#E2EBE8] shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between space-y-4 relative group hover:border-[#147D78]/30">
            <div className="space-y-3">
              <span className="text-3xl font-black text-[#147D78]/25 group-hover:text-[#147D78]/50 transition-colors">01</span>
              <div className="w-10 h-10 rounded-xl bg-[#E8F4F1] text-[#147D78] group-hover:bg-[#147D78] group-hover:text-white flex items-center justify-center font-bold transition-all duration-300 shadow-xs">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#12343B]">Patient Speaks</h3>
              <p className="text-xs text-[#607477] leading-relaxed">
                Patient approaches the hospital kiosk or mobile web. Speaks in Kannada, Hindi, or English.
              </p>
            </div>
            <div className="text-[11px] font-semibold text-[#147D78] bg-[#F5F8F7] p-2.5 rounded-xl border border-[#E2EBE8] group-hover:bg-[#E8F4F1] transition-colors">
              No typing or literacy needed
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-3xl p-6 border border-[#E2EBE8] shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between space-y-4 relative group hover:border-[#147D78]/30">
            <div className="space-y-3">
              <span className="text-3xl font-black text-[#147D78]/25 group-hover:text-[#147D78]/50 transition-colors">02</span>
              <div className="w-10 h-10 rounded-xl bg-[#E8F4F1] text-[#147D78] group-hover:bg-[#147D78] group-hover:text-white flex items-center justify-center font-bold transition-all duration-300 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#12343B]">AI Triage & Verbal OK</h3>
              <p className="text-xs text-[#607477] leading-relaxed">
                AI categorizes department, urgency, and location. Assistant speaks back asking confirmation before submission.
              </p>
            </div>
            <div className="text-[11px] font-semibold text-[#147D78] bg-[#F5F8F7] p-2.5 rounded-xl border border-[#E2EBE8] group-hover:bg-[#E8F4F1] transition-colors">
              Spoken citizen agreement
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-3xl p-6 border border-[#E2EBE8] shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between space-y-4 relative group hover:border-[#147D78]/30">
            <div className="space-y-3">
              <span className="text-3xl font-black text-[#147D78]/25 group-hover:text-[#147D78]/50 transition-colors">03</span>
              <div className="w-10 h-10 rounded-xl bg-[#E8F4F1] text-[#147D78] group-hover:bg-[#147D78] group-hover:text-white flex items-center justify-center font-bold transition-all duration-300 shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#12343B]">Dept Officer Alert</h3>
              <p className="text-xs text-[#607477] leading-relaxed">
                Concerned department (Hygiene, Water, Pharmacy, etc.) receives real-time notification with SLA countdown.
              </p>
            </div>
            <div className="text-[11px] font-semibold text-[#147D78] bg-[#F5F8F7] p-2.5 rounded-xl border border-[#E2EBE8] group-hover:bg-[#E8F4F1] transition-colors">
              Direct staff dispatch
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-3xl p-6 border border-[#E2EBE8] shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between space-y-4 relative group hover:border-[#147D78]/30">
            <div className="space-y-3">
              <span className="text-3xl font-black text-[#147D78]/25 group-hover:text-[#147D78]/50 transition-colors">04</span>
              <div className="w-10 h-10 rounded-xl bg-[#E8F4F1] text-[#147D78] group-hover:bg-[#147D78] group-hover:text-white flex items-center justify-center font-bold transition-all duration-300 shadow-xs">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#12343B]">Photo Verification</h3>
              <p className="text-xs text-[#607477] leading-relaxed">
                Officer uploads Before & After photographic evidence. Supervisor conducts physical inspection sign-off.
              </p>
            </div>
            <div className="text-[11px] font-semibold text-[#147D78] bg-[#F5F8F7] p-2.5 rounded-xl border border-[#E2EBE8] group-hover:bg-[#E8F4F1] transition-colors">
              100% ground truth verified
            </div>
          </div>
        </div>
      </section>

      {/* 4. DEDICATED PORTAL ACCESS CARDS */}
      <section className="bg-white border-t border-[#E2EBE8] py-16 px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-[#147D78] uppercase tracking-wider">
              System Access Portals
            </span>
            <h2 className="text-3xl font-extrabold text-[#12343B]">
              Enter JanaSuvidha Workspaces
            </h2>
            <p className="text-sm text-[#607477]">
              Choose the appropriate portal based on your role in the hospital.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* 1. CITIZEN KIOSK */}
            <div className="bg-gradient-to-b from-[#F2F7F6] to-white rounded-3xl p-8 border-2 border-[#147D78] shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between space-y-6 relative group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#147D78] text-white flex items-center justify-center font-bold shadow-xs group-hover:scale-110 transition-transform">
                    <Mic className="w-6 h-6 animate-pulse" />
                  </div>
                  <span className="text-[10px] font-extrabold text-[#147D78] bg-[#E8F4F1] px-3 py-1 rounded-full border border-[#147D78]/25 flex items-center gap-1.5 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    LIVE VOICE KIOSK
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#12343B] group-hover:text-[#147D78] transition-colors">Citizen Voice Kiosk</h3>
                <p className="text-xs sm:text-sm text-[#607477] leading-relaxed">
                  Touch-free, voice-first reporting station for OPDs and hospital entry points. Speaks and understands 6+ Indian languages.
                </p>
                <div className="text-xs text-[#147D78] font-semibold pt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Instant Bilingual Printed Slip</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/citizen/kiosk"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#147D78] hover:bg-[#0e5e5a] text-white text-sm font-bold py-3.5 px-6 rounded-xl shadow-xs hover:shadow-md transition-all active:scale-95"
                >
                  <span>Open Citizen Kiosk</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* 2. DEPARTMENT OFFICIALS */}
            <div className="bg-white rounded-3xl p-8 border border-[#E2EBE8] hover:border-[#147D78]/40 shadow-xs hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between space-y-6 group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#F5F8F7] text-[#147D78] group-hover:bg-[#147D78] group-hover:text-white flex items-center justify-center font-bold border border-[#E2EBE8] group-hover:scale-110 transition-all shadow-xs">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#12343B] group-hover:text-[#147D78] transition-colors">Department Officials</h3>
                <p className="text-xs sm:text-sm text-[#607477] leading-relaxed">
                  Ground workspace for Sanitation Inspectors, Water & Facilities Officers, Pharmacists, and Biomedical Engineers.
                </p>
                <div className="text-xs text-[#607477] font-semibold pt-1 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#147D78]" />
                  <span>Before & After Photo Proof Upload</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/official/login"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#F5F8F7] hover:bg-[#E8F4F1] text-[#12343B] text-sm font-semibold py-3.5 px-6 rounded-xl border border-[#E2EBE8] transition-all hover:border-[#147D78]/30 active:scale-95"
                >
                  <span>Official Portal Login</span>
                  <ArrowRight className="w-4 h-4 text-[#607477] group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* 3. HOSPITAL ADMINISTRATION */}
            <div className="bg-white rounded-3xl p-8 border border-[#E2EBE8] hover:border-[#147D78]/40 shadow-xs hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between space-y-6 group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#F5F8F7] text-[#147D78] group-hover:bg-[#147D78] group-hover:text-white flex items-center justify-center font-bold border border-[#E2EBE8] group-hover:scale-110 transition-all shadow-xs">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#12343B] group-hover:text-[#147D78] transition-colors">Hospital Administration</h3>
                <p className="text-xs sm:text-sm text-[#607477] leading-relaxed">
                  Executive command center for Medical Superintendents and Health Directorate officers. Real-time Recharts KPI analytics.
                </p>
                <div className="text-xs text-[#607477] font-semibold pt-1 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#147D78]" />
                  <span>SLA Escalation & One-Click CSV Audit</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/admin/login"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#F5F8F7] hover:bg-[#E8F4F1] text-[#12343B] text-sm font-semibold py-3.5 px-6 rounded-xl border border-[#E2EBE8] transition-all hover:border-[#147D78]/30 active:scale-95"
                >
                  <span>Admin Command Login</span>
                  <ArrowRight className="w-4 h-4 text-[#607477] group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PILOT HOSPITAL BANNER */}
      <section className="max-w-5xl mx-auto w-full px-6 py-12">
        <div className="bg-[#12343B] text-white rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md relative overflow-hidden">
          <div className="space-y-2 text-center md:text-left z-10">
            <span className="text-xs uppercase tracking-widest text-[#E8F4F1]/70 font-bold">
              Active Hospital Pilot
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Outpatient Department, Ballari
            </h3>
            <p className="text-xs sm:text-sm text-[#E8F4F1]/80 max-w-xl">
              District Hospital, Ballari • 6 Operational Departments Integrated • Serving daily OPD patients with multilingual voice accessibility.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 z-10 w-full md:w-auto">
            <Link
              href="/citizen/kiosk"
              className="inline-flex items-center justify-center gap-2 bg-[#147D78] hover:bg-[#0e5e5a] text-white text-xs sm:text-sm font-bold px-6 py-3.5 rounded-xl shadow-xs transition-colors"
            >
              <Mic className="w-4 h-4" />
              <span>Experience Voice Kiosk</span>
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold px-6 py-3.5 rounded-xl border border-white/20 transition-colors"
            >
              <span>Read Blueprint</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
