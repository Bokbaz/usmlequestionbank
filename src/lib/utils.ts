import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function pct(n: number | null | undefined, digits = 0) {
  if (n == null || Number.isNaN(n)) return "–";
  return `${n.toFixed(digits)}%`;
}

export function ratioPct(part: number, whole: number) {
  return whole > 0 ? (100 * part) / whole : 0;
}

export function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(h ? 2 : 1, "0");
  const ss = String(sec).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatSeconds(ms: number | null | undefined) {
  if (ms == null) return "–";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}

export function plural(n: number, word: string, pluralWord = `${word}s`) {
  return `${n.toLocaleString()} ${n === 1 ? word : pluralWord}`;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://argonaut-usmle.vercel.app";

// Whole days from now until an ISO date (negative when past). Server-side helper.
export function daysUntil(isoDate: string) {
  return Math.ceil((new Date(isoDate).getTime() - Date.now()) / 86_400_000);
}
