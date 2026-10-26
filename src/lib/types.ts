// Row shapes for the Supabase tables (see supabase/migrations).
// Postgres `numeric` columns arrive as numbers via supabase-js.

export type Profile = {
  id: string;
  is_pro: boolean;
  monthly_budget: number | null;
  created_at: string;
};

export type Category = {
  id: string;
  user_id: string;
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
