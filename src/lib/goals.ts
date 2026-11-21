import type { SupabaseClient } from "@supabase/supabase-js";
import { currentMonth } from "@/lib/dates";
import type { GoalContribution, SavingsGoal } from "@/lib/types";

export type GoalProgress = SavingsGoal & {
  saved: number;
  remaining: number;
  /** 0–100, capped. */
  pct: number;
  done: boolean;
  savedThisMonth: number;
  /** Months left to the target date, counting this one. Null with no date. */
  monthsLeft: number | null;
  /** What it takes each month to hit the target date. Null with no date or when done. */
  perMonth: number | null;
  /** The target date has passed and the goal isn't reached. */
  overdue: boolean;
};

function monthsBetween(from: string, to: string): number {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

export function goalProgress(goal: SavingsGoal, contributions: GoalContribution[]): GoalProgress {
  const thisMonth = currentMonth();
  const target = Number(goal.target_amount);
  let saved = 0;
  let savedThisMonth = 0;
  for (const c of contributions) {
    const amount = Number(c.amount);
    saved += amount;
    if (c.date.startsWith(thisMonth)) savedThisMonth += amount;
  }
  saved = Math.round(saved * 100) / 100;
  const remaining = Math.max(0, Math.round((target - saved) * 100) / 100);
  const done = remaining === 0;

  let monthsLeft: number | null = null;
  let perMonth: number | null = null;
  let overdue = false;
  if (goal.target_date) {
    const diff = monthsBetween(thisMonth, goal.target_date.slice(0, 7));
    overdue = diff < 0 && !done;
    monthsLeft = Math.max(1, diff + 1);
    // Count what's already been put in this month toward this month's share.
    if (!done) perMonth = Math.round(((remaining + Math.max(0, savedThisMonth)) / monthsLeft) * 100) / 100;
  }

  return {
    ...goal,
    target_amount: target,
    saved,
    remaining,
    pct: target > 0 ? Math.min(100, Math.max(0, (saved / target) * 100)) : 0,
    done,
    savedThisMonth: Math.round(savedThisMonth * 100) / 100,
    monthsLeft,
    perMonth,
    overdue,
  };
}

/** Every goal with its progress, active ones first. */
export async function getGoals(supabase: SupabaseClient): Promise<GoalProgress[]> {
  const [goalRes, contribRes] = await Promise.all([
    supabase.from("savings_goals").select("*").order("sort_order").order("created_at"),
    supabase.from("goal_contributions").select("*"),
  ]);
  const contributions = (contribRes.data ?? []) as GoalContribution[];
  return ((goalRes.data ?? []) as SavingsGoal[])
    .map((g) => goalProgress(g, contributions.filter((c) => c.goal_id === g.id)))
    .sort((a, b) => Number(a.archived) - Number(b.archived));
}

/** "Dec 2026" */
export function targetLabel(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}
