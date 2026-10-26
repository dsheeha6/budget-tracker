import type { SupabaseClient } from "@supabase/supabase-js";
import { monthStart, nextMonthStart } from "./dates";
import { monthlyIncome, type MonthlyIncome } from "./income";
import type { Category, CategoryGroup, Profile } from "./types";

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

export type GroupSummary = CategoryGroup & {
  categories: CategorySummary[];
  budget: number;
  spent: number;
  remaining: number;
  status: Status;
};

/** What the dashboard lists, in order: loose categories and folders mixed by sort order. */
export type Section = { kind: "category"; category: CategorySummary } | { kind: "group"; group: GroupSummary };

export type MonthSummary = {
  categories: CategorySummary[];
  sections: Section[];
  totalSpent: number;
  totalBudget: number;
  totalRemaining: number;
  totalStatus: Status;
  hasCategories: boolean;
  isPro: boolean;
  income: MonthlyIncome | null;
};

/** Loads everything the dashboard needs for one month. */
export async function getMonthSummary(supabase: SupabaseClient, month: string): Promise<MonthSummary> {
  const start = monthStart(month);
  const end = nextMonthStart(month);

  const [categoriesRes, groupsRes, budgetsRes, transactionsRes, profileRes] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order").order("name"),
    supabase.from("category_groups").select("*").order("sort_order").order("name"),
    supabase.from("category_budgets").select("category_id, amount").eq("month", start),
    supabase.from("transactions").select("category_id, amount").gte("date", start).lt("date", end),
    supabase
      .from("profiles")
      .select("monthly_budget, is_pro, pay_amount, pay_frequency, retirement_per_paycheck, tax_per_paycheck")
      .single(),
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

  // Folders: totals of the categories inside them. Empty folders are skipped.
  const groups = ((groupsRes.data ?? []) as CategoryGroup[])
    .map((g) => {
      const inside = categories.filter((c) => c.group_id === g.id);
      const budget = round(inside.reduce((sum, c) => sum + c.budget, 0));
      const spent = round(inside.reduce((sum, c) => sum + c.spent, 0));
      return { ...g, categories: inside, budget, spent, remaining: round(budget - spent), status: budgetStatus(spent, budget) };
    })
    .filter((g) => g.categories.length > 0);
  const groupIds = new Set(groups.map((g) => g.id));

  const sections: Section[] = [
    ...categories
      .filter((c) => !c.group_id || !groupIds.has(c.group_id))
      .map((category) => ({ kind: "category" as const, category, order: category.sort_order })),
    ...groups.map((group) => ({ kind: "group" as const, group, order: group.sort_order })),
  ]
    .sort((a, b) => a.order - b.order)
    .map((s) => (s.kind === "category" ? { kind: s.kind, category: s.category } : { kind: s.kind, group: s.group }));

  return {
    categories,
    sections,
    income: profileRes.data ? monthlyIncome(profileRes.data as Profile) : null,
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
