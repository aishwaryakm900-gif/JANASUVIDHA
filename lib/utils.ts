import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(date?: Date | string | null): string {
  if (!date) return "Recently";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (!d || isNaN(d.getTime())) return "Recently";
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch (e) {
    return "Recently";
  }
}

export function formatDate(date?: Date | string | null): string {
  if (!date) return "Recently";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (!d || isNaN(d.getTime())) return "Recently";
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch (e) {
    return "Recently";
  }
}

export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 10) return "XXXXXX-XXXX";
  const clean = phone.replace(/\D/g, "");
  return `+91 ${clean.slice(0, 2)}••••••${clean.slice(-2)}`;
}

export function generateComplaintId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `JSV-${year}-${rand}`;
}

