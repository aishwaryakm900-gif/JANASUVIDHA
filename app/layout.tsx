import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";

export const metadata: Metadata = {
  title: "JANASUVIDHA — AI Multilingual Hospital Grievance Platform",
  description: "Every Voice Matters. Every Complaint Counts. AI-powered multilingual grievance reporting and resolution platform for Indian government hospitals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-surface-bg text-text-main font-sans selection:bg-teal-soft selection:text-teal-deep">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
