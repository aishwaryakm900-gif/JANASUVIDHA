"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  // The Citizen Kiosk has its own isolated, pure minimalist screen - hide global navbar
  if (pathname.startsWith("/citizen/kiosk")) {
    return null;
  }

  return (
    <header className="w-full bg-[#F5F8F7] border-b border-[#E2EBE8]">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#147D78] flex items-center justify-center text-white shadow-xs">
            <Shield className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-[#12343B]">
            JANASUVIDHA
          </span>
        </Link>

        {/* Small About Link */}
        <nav className="flex items-center gap-6">
          <Link
            href="/about"
            className="text-sm font-medium text-[#607477] hover:text-[#12343B] transition-colors"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
