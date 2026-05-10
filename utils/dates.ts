/** Calendar-day difference from local midnight today to expiry (local date). */
export function daysRemaining(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const exp = parseLocalDate(expiryDate);
  exp.setHours(0, 0, 0, 0);

  return Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** Local calendar date → `YYYY-MM-DD` (no timezone shift). */
export function toIsoDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parses `YYYY-MM-DD` as local calendar date; falls back to `Date` parsing. */
export function parseLocalDate(iso: string): Date {
  const ymd = iso.trim().slice(0, 10);
  const parts = ymd.split('-').map(Number);
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    const [y, m, d] = parts;
    return new Date(y, m - 1, d);
  }
  return new Date(iso);
}

export function formatExpiryLabel(expiryDate: string, locale?: string): string {
  const d = parseLocalDate(expiryDate);
  return d.toLocaleDateString(locale || undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function isUrgentWindow(days: number): boolean {
  return days < 30;
}
