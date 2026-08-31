import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const IST = "Asia/Kolkata";

/** Format a date in IST, e.g. "12 Sep 2026, 6:30 PM IST" */
export function formatIST(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const formatted = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: IST,
  }).format(d);
  return `${formatted} IST`;
}

/** Date only, IST — "12 Sep 2026" */
export function formatDateIST(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: IST,
  }).format(d);
}

export function isPast(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.getTime() < Date.now();
}

/** Zero-pad a node number: 1 -> "01" */
export function padNode(n: number | null | undefined): string {
  if (n == null) return "—";
  return String(n).padStart(2, "0");
}

export function parsePhotos(photos: string | null | undefined): string[] {
  if (!photos) return [];
  try {
    const arr = JSON.parse(photos);
    return Array.isArray(arr) ? arr.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}
