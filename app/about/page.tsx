import Link from "next/link";
import { ArrowLeft, Shield, Mic, CheckCircle2 } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-12">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#147D78] hover:text-[#0e5e5a] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="space-y-4">
        <span className="text-xs font-semibold text-[#147D78] uppercase tracking-wider block">
          Healthcare Grievance Platform
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#12343B]">
          About JANASUVIDHA
        </h1>
        <p className="text-base sm:text-lg text-[#263238] leading-relaxed">
          JANASUVIDHA is a voice-first hospital grievance reporting and resolution platform created for Indian government hospitals.
        </p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-[#E2EBE8] shadow-xs space-y-6 text-sm text-[#263238] leading-relaxed">
        <h2 className="text-lg font-bold text-[#12343B]">The Core Principle</h2>
        <p>
          A citizen visits a government hospital, speaks about a problem in <strong>any supported language</strong>, and the system understands the complaint, confirms it verbally, and forwards it to the appropriate higher authority only after the citizen agrees.
        </p>

        <h2 className="text-lg font-bold text-[#12343B] pt-2">How It Works</h2>
        <ul className="space-y-3 text-xs sm:text-sm text-[#607477]">
          <li className="flex items-start gap-2.5">
            <span className="font-bold text-[#147D78]">1.</span>
            <span><strong>Voice First:</strong> The citizen speaks in Kannada, Hindi, or English without having to fill forms or select dropdowns.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="font-bold text-[#147D78]">2.</span>
            <span><strong>Spoken Confirmation:</strong> The system automatically detects the language and speaks back in the same language asking for permission to send the complaint to authorities.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="font-bold text-[#147D78]">3.</span>
            <span><strong>Citizen Agreement:</strong> If the citizen says "Yes" / "ಹೌದು" / "हाँ", the complaint is registered, assigned to the department official, and tracked to resolution.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="font-bold text-[#147D78]">4.</span>
            <span><strong>Verified Ground Truth:</strong> Department officials resolve the issue on the ground with Before and After photo proof verified by supervisors.</span>
          </li>
        </ul>
      </div>

      <div className="text-center pt-4">
        <Link
          href="/citizen/kiosk"
          className="inline-flex items-center gap-2 bg-[#147D78] hover:bg-[#0e5e5a] text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors shadow-xs"
        >
          <Mic className="w-4 h-4" />
          <span>Open Citizen Kiosk</span>
        </Link>
      </div>
    </div>
  );
}
