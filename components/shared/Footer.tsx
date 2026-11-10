"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export function Footer() {
  const pathname = usePathname();

  // Hide footer completely on citizen kiosk
  if (pathname.startsWith("/citizen/kiosk")) {
    return null;
  }

  return (
    <footer className="w-full border-t border-[#E2EBE8] bg-[#F5F8F7] py-8 text-center text-xs text-[#607477]">
      <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>© {new Date().getFullYear()} JANASUVIDHA • Government Hospital Grievance Redressal</span>
        <div className="flex gap-4">
          <Link href="/about" className="hover:text-[#12343B] transition-colors">
            About JANASUVIDHA
          </Link>
          <span>•</span>
          <Link href="/citizen/kiosk" className="hover:text-[#12343B] transition-colors">
            Citizen Kiosk
          </Link>
        </div>
      </div>
    </footer>
  );
}
