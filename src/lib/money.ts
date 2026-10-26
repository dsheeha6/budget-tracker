const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const usdWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function money(amount: number): string {
  return usd.format(amount);
}

/** Drops the cents when they're .00, e.g. "$400" instead of "$400.00". */
export function moneyShort(amount: number): string {
  return Number.isInteger(amount) ? usdWhole.format(amount) : usd.format(amount);
}

/** Parses user input like "12.5", "$1,200" → 12.5 / 1200. Returns NaN if invalid. */
export function parseMoney(value: FormDataEntryValue | null): number {
  const cleaned = String(value ?? "").replace(/[$,\s]/g, "");
  if (cleaned === "") return NaN;
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}
