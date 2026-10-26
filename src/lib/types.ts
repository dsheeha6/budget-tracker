// Row shapes for the Supabase tables (see supabase/migrations).
// Postgres `numeric` columns arrive as numbers via supabase-js.

export type PayFrequency = "weekly" | "biweekly" | "semimonthly" | "monthly";

export type Profile = {
  id: string;
  is_pro: boolean;
  monthly_budget: number | null;
  pay_amount: number | null; // take-home per paycheck
  pay_frequency: PayFrequency;
  retirement_per_paycheck: number;
  tax_per_paycheck: number;
  created_at: string;
};

/** A folder of categories, e.g. "Subscriptions". */
export type CategoryGroup = {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  sort_order: number;
  created_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  group_id: string | null;
  name: string;
  icon: string;
  color: string;
  monthly_budget: number;
  archived: boolean;
  sort_order: number;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  merchant: string | null;
  date: string;
  note: string | null;
  receipt_id: string | null;
  created_at: string;
};
