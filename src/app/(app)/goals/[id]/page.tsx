import Link from "next/link";
import { notFound } from "next/navigation";
import ContributionForm from "@/components/ContributionForm";
import { GoalPace } from "@/components/GoalCard";
import PageHeader from "@/components/PageHeader";
import SubmitButton from "@/components/SubmitButton";
import { dayLabel, today } from "@/lib/dates";
import { goalProgress, targetLabel } from "@/lib/goals";
import { money, moneyShort } from "@/lib/money";
import { requireUser } from "@/lib/supabase/server";
import type { GoalContribution, SavingsGoal } from "@/lib/types";
import { deleteContribution } from "../actions";

export default async function GoalPage({ params }: PageProps<"/goals/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const [goalRes, contribRes] = await Promise.all([
    supabase.from("savings_goals").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("goal_contributions")
      .select("*")
      .eq("goal_id", id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);
  if (!goalRes.data) notFound();
  const contributions = (contribRes.data ?? []) as GoalContribution[];
  const g = goalProgress(goalRes.data as SavingsGoal, contributions);

  return (
    <div className="mx-auto max-w-xl space-y-4 lg:max-w-5xl">
      <div className="flex items-center justify-between">
        <PageHeader title={`${g.icon} ${g.name}`} back="/goals" />
        <Link href={`/goals/${g.id}/edit`} className="px-2 py-2 font-semibold text-accent">
          Edit
        </Link>
      </div>

      <div className="space-y-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0">
        <div className="space-y-4">
          <section className="card space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-sm text-zinc-500">Saved</div>
                <div className="text-4xl font-bold tracking-tight">{money(g.saved)}</div>
              </div>
              <div className="text-right text-sm text-zinc-500">
                of {moneyShort(g.target_amount)}
                {g.target_date && <div>by {targetLabel(g.target_date)}</div>}
              </div>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div className="h-full rounded-full" style={{ width: `${g.pct}%`, backgroundColor: g.color }} />
            </div>
            <div className="flex justify-between gap-2 text-sm">
              <GoalPace goal={g} />
              <span className="shrink-0 text-zinc-500">{Math.floor(g.pct)}%</span>
            </div>
            {g.perMonth !== null && g.monthsLeft !== null && !g.overdue && (
              <p className="border-t border-zinc-200 pt-2 text-xs text-zinc-500 dark:border-zinc-800">
                Put aside {money(g.perMonth)} a month for {g.monthsLeft} {g.monthsLeft === 1 ? "month" : "months"} to
                reach it.
              </p>
            )}
          </section>

          {!g.archived && (
            <section className="card">
              <ContributionForm goalId={g.id} defaultDate={today()} />
            </section>
          )}
        </div>

        <section className="space-y-2">
          <h2 className="px-1 text-sm font-semibold text-zinc-500">History</h2>
          {contributions.length === 0 ? (
            <p className="card text-center text-sm text-zinc-500">Nothing put in yet.</p>
          ) : (
            <ul className="card divide-y divide-zinc-200 p-0 dark:divide-zinc-800">
              {contributions.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{c.note || (c.amount < 0 ? "Taken out" : "Added")}</div>
                    <div className="text-xs text-zinc-500">{dayLabel(c.date)}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span
                      className={`text-sm font-semibold ${c.amount < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
                    >
                      {c.amount < 0 ? "−" : "+"}
                      {money(Math.abs(c.amount))}
                    </span>
                    <form action={deleteContribution}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="goal_id" value={g.id} />
                      <SubmitButton
                        className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 active:bg-zinc-200 dark:active:bg-zinc-800"
                        pendingText="…"
                        confirmMessage="Remove this entry?"
                      >
                        <span aria-label="Remove">×</span>
                      </SubmitButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
