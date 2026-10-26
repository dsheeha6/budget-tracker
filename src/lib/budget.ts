import type { SupabaseClient } from "@supabase/supabase-js";
import { monthStart, nextMonthStart } from "./dates";
import type { Category } from "./types";

export type Status = "none" | "green" | "yellow" | "red";

/** Green under 75%, yellow 75–99%, red at 100%+. "none" = no budget set. */
export function budgetStatus(spent: number, budget: number): Status {
  if (budget <= 0) return "none";
  const pct = spent / budget;
  if (pct >= 1) return "red";
  if (pct >= 0.75) return "yellow";
  return "green";
}

export type CategorySummary = Category & {
  budget: number; // budget for this month (snapshot or default)
  spent: number;
  remaining: number;
  status: Status;
};

export type MonthSummary = {
  categories: CategorySummary[];
  totalSpent: number;
  totalBudget: number;
  totalRemaining: number;
  totalStatus: Status;
  hasCategories: boolean;
  isPro: boolean;
};

/** Loads everything the dashboard needs for one month. */
export async function getMonthSummary(supabase: SupabaseClient, month: string): Promise<MonthSummary> {
  const start = monthStart(month);
  const end = nextMonthStart(month);

  const [categoriesRes, budgetsRes, transactionsRes, profileRes] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order").order("name"),
    supabase.from("category_budgets").select("category_id, amount").eq("month", start),
    supabase.from("transactions").select("category_id, amount").gte("date", start).lt("date", end),
    supabase.from("profiles").select("monthly_budget, is_pro").single(),
  ]);

  const allCategories = (categoriesRes.data ?? []) as Category[];
  const budgetFor = new Map<string, number>(
    (budgetsRes.data ?? []).map((b) => [b.category_id, Number(b.amount)]),
  );
  const spentFor = new Map<string, number>();
  for (const t of transactionsRes.data ?? []) {
    spentFor.set(t.category_id, (spentFor.get(t.category_id) ?? 0) + Number(t.amount));
  }

  const categories = allCategories
    // Show a category if it existed and was active this month, or if it has
    // spending or a saved budget for this month (e.g. archived later).
    .filter((c) => {
      const existed = c.created_at.slice(0, 10) < end;
      return (existed && !c.archived) || spentFor.has(c.id) || budgetFor.has(c.id);
    })
    .map((c) => {
      const budget = budgetFor.get(c.id) ?? Number(c.monthly_budget);
      const spent = round(spentFor.get(c.id) ?? 0);
      return { ...c, budget, spent, remaining: round(budget - spent), status: budgetStatus(spent, budget) };
    });

  const totalSpent = round(categories.reduce((sum, c) => sum + c.spent, 0));
  const overall = profileRes.data?.monthly_budget;
  const totalBudget =
    overall != null ? Number(overall) : round(categories.reduce((sum, c) => sum + c.budget, 0));

  return {
    categories,
    totalSpent,
    totalBudget,
    totalRemaining: round(totalBudget - totalSpent),
    totalStatus: budgetStatus(totalSpent, totalBudget),
    hasCategories: allCategories.length > 0,
    isPro: Boolean(profileRes.data?.is_pro),
  };
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
