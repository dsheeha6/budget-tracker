import Link from "next/link";
import GoalCard from "@/components/GoalCard";
import MonthSwitcher from "@/components/MonthSwitcher";
import { getGoals, type GoalProgress } from "@/lib/goals";
import Logo from "@/components/Logo";
import Penny from "@/components/Penny";
import ProgressBar, { pastInBudget, statusColors, stayedInBudget } from "@/components/ProgressBar";
import SubmitButton from "@/components/SubmitButton";
import { getMonthSummary, type CategorySummary, type CategoryTotal, type GroupSummary, type Status } from "@/lib/budget";
import type { MonthlyIncome } from "@/lib/income";
import { currentMonth, daysLeft, monthParam } from "@/lib/dates";
import { money, moneyShort } from "@/lib/money";
import { requireUser } from "@/lib/supabase/server";
import { addStarterCategories } from "./categories/actions";

export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  const { supabase } = await requireUser();
  const month = monthParam((await searchParams).m);
  const [summary, goals] = await Promise.all([getMonthSummary(supabase, month), getGoals(supabase)]);
  const activeGoals = goals.filter((g) => !g.archived);
  const days = daysLeft(month);
  const isCurrent = month === currentMonth();
  const past = month < currentMonth();
  // This month, anything that's over budget floats to the top.
  const isOver = (s: (typeof summary.sections)[number]) =>
    (s.kind === "category" ? s.category.status : s.group.status) === "red";
  const sections = isCurrent
    ? [...summary.sections.filter(isOver), ...summary.sections.filter((s) => !isOver(s))]
    : summary.sections;
  const overCount = summary.categories.filter((c) => c.status === "red").length;
  const inBudgetCount = summary.categories.filter((c) => c.budget > 0 && c.status !== "red").length;
  const budgetedCount = summary.categories.filter((c) => c.budget > 0).length;

  return (
    <div className="space-y-4">
      {/* Wordmark on phones; desktop has it in the sidebar. */}
      <Logo size={34} className="lg:hidden" />
      <MonthSwitcher month={month} basePath="/" />

      {!summary.hasCategories ? (
        <EmptyState />
      ) : (
        <>
          {/* Side by side on desktop: totals on the left, categories on the right */}
          <div className="space-y-4 lg:grid lg:grid-cols-3 lg:items-start lg:gap-4 lg:space-y-0">
            <div className="space-y-4">
              {/* Total card */}
              <section className="card space-y-3" style={{ "--ink-radius": "24px" } as React.CSSProperties}>
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <div className="font-hand font-semibold text-ink-soft">{past ? "Spent that month" : "Spent so far"}</div>
                    <div className="text-4xl font-bold tracking-tight">{money(summary.totalSpent)}</div>
                    <div className="text-sm font-medium text-ink-soft">of {moneyShort(summary.totalBudget)} budget</div>
                  </div>
                  {past && summary.totalBudget > 0 && summary.totalStatus !== "red" ? (
                    <MonthStamp />
                  ) : (
                    <Penny size={88} mood={summary.totalStatus === "red" ? "worried" : "happy"} />
                  )}
                </div>
                <ProgressBar
                  spent={summary.totalSpent}
                  budget={summary.totalBudget}
                  status={summary.totalStatus}
                  past={past}
                  size="lg"
                />
                <div className="flex justify-between gap-2 text-sm">
                  <StatusText status={summary.totalStatus} remaining={summary.totalRemaining} past={past} />
                  {isCurrent && (
                    <span className="text-right text-zinc-500">
                      {days} {days === 1 ? "day" : "days"} left
                      {summary.totalRemaining > 0 && days > 0 && ` · ${money(summary.totalRemaining / days)}/day`}
                    </span>
                  )}
                  {past && budgetedCount > 0 && (
                    <span className="text-right text-zinc-500">
                      {inBudgetCount} of {budgetedCount} in budget
                    </span>
                  )}
                </div>
                <PennyLine
                  status={summary.totalStatus}
                  past={past}
                  overCount={overCount}
                  hasBudget={summary.totalBudget > 0}
                />
              </section>

              {summary.income && <IncomeCard income={summary.income} budget={summary.totalBudget} spent={summary.totalSpent} />}

              <GoalsSummary goals={activeGoals} />
            </div>

            {/* Categories and folders */}
            <section className="space-y-2 lg:col-span-2 lg:grid lg:grid-cols-2 lg:items-start lg:gap-3 lg:space-y-0">
              {sections.map((s) =>
                s.kind === "category" ? (
                  <CategoryCard key={s.category.id} category={s.category} month={month} past={past} />
                ) : (
                  <GroupCard key={s.group.id} group={s.group} month={month} past={past} />
                ),
              )}
            </section>
          </div>
          {/* Room to scroll the last card above the floating buttons */}
          <div className="h-24" aria-hidden />
        </>
      )}

      {/* Quick add (+ scan for Pro) */}
      {summary.hasCategories && (
        <div className="fixed right-5 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-10 flex lg:right-8 lg:bottom-8 flex-col items-center gap-3">
          {summary.isPro && (
            <Link
              href="/scan"
              aria-label="Scan a receipt"
              className="no-callout btn-secondary h-12 w-12 p-0 text-2xl"
              style={{ "--ink-radius": "999px" } as React.CSSProperties}
            >
              📷
            </Link>
          )}
          <Link
            href={isCurrent ? "/transactions/new" : `/transactions/new?m=${month}`}
            aria-label="Add a purchase"
            className="no-callout btn-primary h-16 w-16 p-0"
            style={{ "--ink-radius": "999px" } as React.CSSProperties}
          >
            <svg viewBox="0 0 30 30" className="h-8 w-8" fill="none" aria-hidden>
              <path
                d="M15 4.5c.4 7 .2 14 .3 21M4.8 15.2c7-.4 13.6-.3 20.6 0"
                stroke="currentColor"
                strokeWidth={4}
                strokeLinecap="round"
              />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}

function CategoryCard({ category: c, month, past }: { category: CategoryTotal; month: string; past: boolean }) {
  if (c.subs.length > 0) {
    return (
      <ExpandingCard
        icon={c.icon}
        iconColor={c.color}
        name={c.name}
        count={c.subs.length}
        totals={c}
        rows={[{ row: c.own, isSub: false }, ...c.subs.map((row) => ({ row, isSub: true }))]}
        month={month}
        past={past}
      />
    );
  }
  return (
    <Link href={`/transactions?c=${c.id}&m=${month}`} className="card block space-y-2 active:opacity-80">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg"
            style={{ backgroundColor: `${c.color}26` }}
          >
            {c.icon}
          </span>
          <span className="truncate font-hand font-bold">
            {c.name}
            {c.archived && <span className="ml-1 text-xs text-zinc-400">(archived)</span>}
          </span>
        </div>
        <div className="shrink-0 text-right text-sm">
          <span className="font-semibold">{money(c.spent)}</span>
          {c.budget > 0 && <span className="text-zinc-500"> / {moneyShort(c.budget)}</span>}
        </div>
      </div>
      <ProgressBar spent={c.spent} budget={c.budget} status={c.status} past={past} />
      <div className="text-sm">
        <StatusText status={c.status} remaining={c.remaining} past={past} />
      </div>
    </Link>
  );
}

function GroupCard({ group, month, past }: { group: GroupSummary; month: string; past: boolean }) {
  return (
    <ExpandingCard
      icon={group.icon}
      name={group.name}
      count={group.categories.length}
      totals={group}
      rows={group.categories.flatMap((c) => [
        { row: c.own, isSub: false },
        ...c.subs.map((row) => ({ row, isSub: true })),
      ])}
      month={month}
      past={past}
    />
  );
}

// A folder (e.g. Subscriptions) or a category with subs (e.g. Food): totals on
// the outside, tap to see each one.
function ExpandingCard({
  icon,
  iconColor,
  name,
  count,
  totals,
  rows,
  month,
  past,
}: {
  icon: string;
  iconColor?: string;
  name: string;
  count: number;
  totals: { spent: number; budget: number; remaining: number; status: Status };
  rows: { row: CategorySummary; isSub: boolean }[];
  month: string;
  past: boolean;
}) {
  return (
    <details className="card group/folder p-0">
      <summary className="block cursor-pointer list-none space-y-2 p-4 [&::-webkit-details-marker]:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-lg dark:bg-zinc-800"
              style={iconColor ? { backgroundColor: `${iconColor}26` } : undefined}
            >
              {icon}
            </span>
            <span className="truncate font-hand font-bold">{name}</span>
            <span className="shrink-0 text-xs text-zinc-400">{count}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-sm">
            <span>
              <span className="font-semibold">{money(totals.spent)}</span>
              {totals.budget > 0 && <span className="text-zinc-500"> / {moneyShort(totals.budget)}</span>}
            </span>
            <span className="text-zinc-400 transition-transform group-open/folder:rotate-90">›</span>
          </div>
        </div>
        <ProgressBar spent={totals.spent} budget={totals.budget} status={totals.status} past={past} />
        <div className="text-sm">
          <StatusText status={totals.status} remaining={totals.remaining} past={past} />
        </div>
      </summary>
      <ul className="divide-y divide-zinc-200 border-t border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {rows.map(({ row: c, isSub }) => (
          <li key={c.id}>
            <Link
              href={`/transactions?c=${c.id}&m=${month}`}
              className={`block space-y-1.5 py-3 pr-4 active:opacity-70 ${isSub ? "pl-8" : "pl-4"}`}
            >
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">
                  {c.icon} {c.name}
                </span>
                <span className="shrink-0">
                  <span className="font-semibold">{money(c.spent)}</span>
                  {c.budget > 0 && <span className="text-zinc-500"> / {moneyShort(c.budget)}</span>}
                </span>
              </div>
              <ProgressBar spent={c.spent} budget={c.budget} status={c.status} past={past} />
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

// Paycheck money vs. what's budgeted and spent this month.
function IncomeCard({ income, budget, spent }: { income: MonthlyIncome; budget: number; spent: number }) {
  const unplanned = income.takeHome - budget;
  const leftOver = income.takeHome - spent;
  return (
    <section className="card space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-sm text-zinc-500">Take-home this month</div>
          <div className="text-2xl font-bold tracking-tight">
            {income.isAverage && <span className="text-zinc-400">≈</span>}
            {money(income.takeHome)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-zinc-500">Left after spending</div>
          <div className={`text-xl font-semibold ${leftOver < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
            {money(leftOver)}
          </div>
        </div>
      </div>
      <div className="flex justify-between text-sm text-zinc-500">
        <span>Budgeted {moneyShort(budget)}</span>
        <span className={unplanned < 0 ? "text-red-600 dark:text-red-400" : ""}>
          {unplanned >= 0 ? `${money(unplanned)} not budgeted` : `Over-budgeted by ${money(-unplanned)}`}
        </span>
      </div>
      {(income.retirement > 0 || income.taxes > 0) && (
        <p className="border-t border-zinc-200 pt-2 text-xs text-zinc-500 dark:border-zinc-800">
          Taken out before take-home:{" "}
          {[income.retirement > 0 && `${money(income.retirement)} to Roth`, income.taxes > 0 && `${money(income.taxes)} taxes`]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
    </section>
  );
}

// Savings goals at a glance, or a nudge to make the first one.
function GoalsSummary({ goals }: { goals: GoalProgress[] }) {
  if (goals.length === 0) {
    return (
      <Link href="/goals/new" className="card flex items-center gap-3 active:opacity-80">
        <span className="text-2xl">🎯</span>
        <span className="flex-1">
          <span className="block font-medium">Set a savings goal</span>
          <span className="block text-sm text-zinc-500">Track money put aside for a trip, a car, a cushion.</span>
        </span>
        <span className="text-zinc-400">›</span>
      </Link>
    );
  }
  const thisMonth = goals.reduce((sum, g) => sum + g.savedThisMonth, 0);
  return (
    <section className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Goals</h2>
        <Link href="/goals" className="text-sm text-zinc-500">
          {money(thisMonth)} saved this month ›
        </Link>
      </div>
      {goals.slice(0, 3).map((g) => (
        <GoalCard key={g.id} goal={g} compact />
      ))}
      {goals.length > 3 && (
        <Link href="/goals" className="block text-center text-sm font-semibold text-accent">
          See all {goals.length} goals
        </Link>
      )}
    </section>
  );
}

function StatusText({ status, remaining, past = false }: { status: Status; remaining: number; past?: boolean }) {
  if (stayedInBudget(status, past)) {
    return (
      <span className={`font-semibold ${pastInBudget.text}`}>
        Stayed in budget{remaining > 0 && ` · ${money(remaining)} to spare`}
      </span>
    );
  }
  const text =
    status === "none"
      ? "No budget set"
      : status === "red"
        ? remaining === 0
          ? "Budget used up"
          : `Over by ${money(-remaining)}`
        : status === "yellow"
          ? `Getting close · ${money(remaining)} left`
          : `${money(remaining)} left`;
  return <span className={`font-semibold ${statusColors[status].text}`}>{text}</span>;
}

// Penny's one-liner under the month total.
function PennyLine({
  status,
  past,
  overCount,
  hasBudget,
}: {
  status: Status;
  past: boolean;
  overCount: number;
  hasBudget: boolean;
}) {
  if (!hasBudget) return null;
  let line: string;
  let color = "text-brand-blue";
  if (past) {
    if (status === "red") {
      line = "that one got away from us. new month, new start.";
      color = "text-brand-red";
    } else {
      line = overCount === 0 ? "nailed it. every category in budget!" : "nailed it overall. nice work.";
      color = "text-brand-green";
    }
  } else if (status === "red") {
    line = "oops, we’re over. no stress, we’ll fix it.";
    color = "text-brand-red";
  } else if (overCount > 0) {
    line = overCount === 1 ? "mostly good! one category’s a bit over" : `mostly good! ${overCount} categories are over`;
  } else if (status === "yellow") {
    line = "getting close. easy does it this week";
    color = "text-ink-soft";
  } else {
    line = "we’re good! keep it up";
  }
  return <p className={`font-note text-2xl leading-none ${color}`}>{line}</p>;
}

// "Month closed · in budget" stamp for a finished month that stayed under.
function MonthStamp() {
  return (
    <div
      className="ink shrink-0 -rotate-6 px-3 py-1.5 text-center text-brand-green"
      style={
        {
          "--ink-fill": "var(--green-tint)",
          "--ink-radius": "12px",
          "--ink-shadow": "0px",
          "--ink-width": "2.5px",
          "--ink": "var(--green)",
        } as React.CSSProperties
      }
    >
      <div className="text-[11px] font-bold tracking-[0.15em]">MONTH</div>
      <div className="font-hand text-lg leading-tight font-bold">CLOSED</div>
      <div className="font-note text-lg leading-none">in budget ✓</div>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="card space-y-4 text-center">
      <div className="text-4xl">👋</div>
      <div>
        <h2 className="text-lg font-semibold">Set up your budget</h2>
        <p className="text-sm text-zinc-500">
          Start with a few common categories (you can rename, delete, and set budgets after), or make your own.
        </p>
      </div>
      <form action={addStarterCategories}>
        <SubmitButton pendingText="Adding…">Add starter categories</SubmitButton>
      </form>
      <Link href="/categories/new" className="btn-secondary block">
        Create my own
      </Link>
    </section>
  );
}
