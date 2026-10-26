// Month and date helpers. A "month" is a "YYYY-MM" string, e.g. "2026-10".
// Dates are "YYYY-MM-DD" strings, matching Postgres `date` columns.

// The server runs in UTC, so "today" is computed in this time zone instead.
// (If this is ever opened to other people, store a time zone per profile.)
const TIME_ZONE = process.env.NEXT_PUBLIC_TIME_ZONE ?? "America/New_York";

export function today(): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
}

export function currentMonth(): string {
  return today().slice(0, 7);
}

export function isValidMonth(value: string | undefined): value is string {
  return !!value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

/** Month from a ?m= search param, falling back to the current month. */
export function monthParam(value: string | string[] | undefined): string {
  const m = Array.isArray(value) ? value[0] : value;
  return isValidMonth(m) ? m : currentMonth();
}

export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

/** First day of the month, e.g. "2026-10-01". */
export function monthStart(month: string): string {
  return `${month}-01`;
}

/** First day of the following month (use as an exclusive upper bound). */
export function nextMonthStart(month: string): string {
  return monthStart(addMonths(month, 1));
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Days left including today. 0 for past months, full length for future ones. */
export function daysLeft(month: string): number {
  const now = currentMonth();
  if (month < now) return 0;
  if (month > now) return daysInMonth(month);
  return daysInMonth(month) - Number(today().slice(8, 10)) + 1;
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "Today", "Yesterday", or e.g. "Mon, Oct 20". */
export function dayLabel(date: string): string {
  const t = today();
  if (date === t) return "Today";
  const y = new Date(`${t}T00:00:00Z`);
  y.setUTCDate(y.getUTCDate() - 1);
  if (date === y.toISOString().slice(0, 10)) return "Yesterday";
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
