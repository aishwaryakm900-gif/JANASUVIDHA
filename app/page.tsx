import Link from "next/link";
import { Mic, ArrowRight, UserCheck, Shield } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col justify-between max-w-5xl mx-auto w-full px-6 py-12 md:py-20 space-y-16 md:space-y-24">
      {/* FIRST SECTION — INTRODUCTION */}
      <section className="text-center space-y-6 max-w-3xl mx-auto pt-4">
        {/* Subtle abstract health/voice icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#E8F4F1] text-[#147D78] mb-2 shadow-xs">
          <svg
            className="w-7 h-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#12343B] leading-[1.15]">
          Every Voice Matters.
          <br />
          Every Complaint Counts.
        </h1>

        <p className="text-lg sm:text-xl text-[#263238] font-normal leading-relaxed max-w-2xl mx-auto">
          Speak about a problem in your government hospital. We will help your concern reach the right authority.
        </p>

        <p className="text-sm font-medium text-[#607477]">
          Simple. Multilingual. Accessible to Everyone.
        </p>
      </section>

      {/* SECOND SECTION — THREE PORTAL CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch pb-8">
        {/* 1. CITIZEN KIOSK (VISUALLY PROMINENT) */}
        <div className="bg-white rounded-3xl p-8 border-2 border-[#147D78] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6 relative group">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8F4F1] text-[#147D78] flex items-center justify-center font-bold">
              <Mic className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-[#12343B]">
              Citizen Kiosk
            </h2>
            <p className="text-sm text-[#607477] leading-relaxed">
              Speak about a hospital issue and report it in your own language.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/citizen/kiosk"
              className="w-full inline-flex items-center justify-center gap-2 bg-[#147D78] hover:bg-[#0e5e5a] text-white text-sm font-semibold py-3.5 px-6 rounded-xl shadow-xs transition-colors"
            >
              <span>Open Kiosk</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 2. DEPARTMENT OFFICIALS */}
        <div className="bg-white rounded-3xl p-8 border border-[#E2EBE8] shadow-xs hover:shadow-sm transition-all flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5F8F7] text-[#607477] flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-[#12343B]">
              Department Officials
            </h2>
            <p className="text-sm text-[#607477] leading-relaxed">
              Access and manage complaints assigned to your department.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/official/login"
              className="w-full inline-flex items-center justify-center gap-2 bg-[#F5F8F7] hover:bg-[#E8F4F1] text-[#12343B] text-sm font-semibold py-3.5 px-6 rounded-xl border border-[#E2EBE8] transition-colors"
            >
              <span>Official Login</span>
              <ArrowRight className="w-4 h-4 text-[#607477]" />
            </Link>
          </div>
        </div>

        {/* 3. HOSPITAL ADMINISTRATION */}
        <div className="bg-white rounded-3xl p-8 border border-[#E2EBE8] shadow-xs hover:shadow-sm transition-all flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5F8F7] text-[#607477] flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-[#12343B]">
              Hospital Administration
            </h2>
            <p className="text-sm text-[#607477] leading-relaxed">
              Monitor grievances, review performance, and oversee resolutions.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/admin/login"
              className="w-full inline-flex items-center justify-center gap-2 bg-[#F5F8F7] hover:bg-[#E8F4F1] text-[#12343B] text-sm font-semibold py-3.5 px-6 rounded-xl border border-[#E2EBE8] transition-colors"
            >
              <span>Admin Login</span>
              <ArrowRight className="w-4 h-4 text-[#607477]" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
