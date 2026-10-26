import type { PayFrequency, Profile } from "./types";

export const PAY_FREQUENCIES: { value: PayFrequency; label: string }[] = [
  { value: "semimonthly", label: "Twice a month" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "weekly", label: "Every week" },
  { value: "monthly", label: "Once a month" },
];

/** Average paychecks in a month (every-2-weeks pay averages 26 a year / 12). */
export function paychecksPerMonth(frequency: PayFrequency): number {
  switch (frequency) {
    case "weekly":
      return 52 / 12;
    case "biweekly":
      return 26 / 12;
    case "semimonthly":
      return 2;
    case "monthly":
      return 1;
  }
}

export type MonthlyIncome = { takeHome: number; retirement: number; taxes: number; isAverage: boolean };

/** Monthly income from the paycheck settings, or null if none are set. */
export function monthlyIncome(
  profile: Pick<Profile, "pay_amount" | "pay_frequency" | "retirement_per_paycheck" | "tax_per_paycheck">,
): MonthlyIncome | null {
  if (profile.pay_amount == null) return null;
  const n = paychecksPerMonth(profile.pay_frequency);
  const round = (x: number) => Math.round(x * 100) / 100;
  return {
    takeHome: round(Number(profile.pay_amount) * n),
    retirement: round(Number(profile.retirement_per_paycheck) * n),
    taxes: round(Number(profile.tax_per_paycheck) * n),
    isAverage: profile.pay_frequency === "weekly" || profile.pay_frequency === "biweekly",
  };
}
