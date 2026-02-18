import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const nlDateFormatter = new Intl.DateTimeFormat("nl-NL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const nlDateShortFormatter = new Intl.DateTimeFormat("nl-NL", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

const nlTimeFormatter = new Intl.DateTimeFormat("nl-NL", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDatum(date: Date | string): string {
  return nlDateFormatter.format(new Date(date));
}

export function formatDatumKort(date: Date | string): string {
  return nlDateShortFormatter.format(new Date(date));
}

export function formatTijd(date: Date | string): string {
  return nlTimeFormatter.format(new Date(date));
}

export function relatieveDatum(date: Date | string): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Vandaag";
  if (diffDays === 1) return "Morgen";
  if (diffDays === -1) return "Gisteren";
  if (diffDays > 1 && diffDays <= 7) return `Over ${diffDays} dagen`;
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} dagen geleden`;
  return formatDatumKort(date);
}
