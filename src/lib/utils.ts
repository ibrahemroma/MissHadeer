import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhone(phone: string): string {
  // Remove all non-digits and leading zeros, ensure starts with country code
  const digits = phone.replace(/\D/g, "");
  return digits;
}

export function getWhatsAppUrl(phone: string, message?: string): string {
  const digits = formatPhone(phone);
  const base = `https://wa.me/${digits}`;
  if (message) {
    return `${base}?text=${encodeURIComponent(message)}`;
  }
  return base;
}

export function fillTemplate(
  template: string,
  vars: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return result;
}

export function formatDate(date: Date | string, locale = "ar-EG"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(date: Date | string, locale = "ar-EG"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ar-EG", {
    month: "short",
    day: "numeric",
  });
}

export function isToday(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

export function isTomorrow(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    d.getDate() === tomorrow.getDate() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getFullYear() === tomorrow.getFullYear()
  );
}

export function isThisWeek(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return d >= startOfWeek && d < endOfWeek;
}

export function getAvatarInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export const AVATAR_COLORS = [
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
];

export function getRandomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

export const SKILL_LEVELS: Record<
  string,
  { label: string; labelAr: string; color: string; bg: string }
> = {
  beginner: { label: "Beginner", labelAr: "مبتدئ", color: "#10b981", bg: "#d1fae5" },
  elementary: { label: "Elementary", labelAr: "أساسي", color: "#3b82f6", bg: "#dbeafe" },
  intermediate: { label: "Intermediate", labelAr: "متوسط", color: "#f59e0b", bg: "#fef3c7" },
  advanced: { label: "Advanced", labelAr: "متقدم", color: "#8b5cf6", bg: "#ede9fe" },
};

export const STRENGTH_TAGS = [
  "التركيز", "الفهم", "السرعة", "الدقة", "الحماس", "المشاركة",
  "التذكر", "الإبداع", "الاتبعية", "الثقة بالنفس"
];

export const WEAKNESS_TAGS = [
  "التركيز", "الكتابة", "القراءة", "الحساب", "الاستماع",
  "التذكر", "التنظيم", "الوقت", "الثقة", "المشاركة"
];
