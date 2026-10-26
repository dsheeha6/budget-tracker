import Link from "next/link";
import MonthSwitcher from "@/components/MonthSwitcher";
import ProgressBar, { statusColors } from "@/components/ProgressBar";
import SubmitButton from "@/components/SubmitButton";
import { getMonthSummary, type CategorySummary, type GroupSummary, type Status } from "@/lib/budget";
import type { MonthlyIncome } from "@/lib/income";
import { currentMonth, daysLeft, monthParam } from "@/lib/dates";
import { money, moneyShort } from "@/lib/money";
import { requireUser } from "@/lib/supabase/server";
import { addStarterCategories } from "./categories/actions";

export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  const { supabase } = await requireUser();
  const month = monthParam((await searchParams).m);
  const summary = await getMonthSummary(supabase, month);
  const days = daysLeft(month);
  const isCurrent = month === currentMonth();

  return (
    <div className="space-y-4">
      <MonthSwitcher month={month} basePath="/" />

      {!summary.hasCategories ? (
        <EmptyState />
      ) : (
        <>
          {/* Total card */}
          <section className="card space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-sm text-zinc-500">Spent</div>
                <div className="text-4xl font-bold tracking-tight">{money(summary.totalSpent)}</div>
              </div>
              <div className="text-right text-sm text-zinc-500">
                of {moneyShort(summary.totalBudget)}
              </div>
            </div>
            <ProgressBar spent={summary.totalSpent} budget={summary.totalBudget} status={summary.totalStatus} />
            <div className="flex justify-between text-sm">
              <StatusText status={summary.totalStatus} remaining={summary.totalRemaining} />
              {isCurrent && (
                <span className="text-zinc-500">
                  {days} {days === 1 ? "day" : "days"} left
                  {summary.totalRemaining > 0 && days > 0 && ` · ${money(summary.totalRemaining / days)}/day`}
                </span>
              )}
            </div>
          </section>

          {summary.income && <IncomeCard income={summary.income} budget={summary.totalBudget} spent={summary.totalSpent} />}

          {/* Categories and folders */}
          <section className="space-y-2">
            {summary.sections.map((s) =>
              s.kind === "category" ? (
                <CategoryCard key={s.category.id} category={s.category} month={month} />
              ) : (
                <GroupCard key={s.group.id} group={s.group} month={month} />
              ),
            )}
          </section>
          {/* Room to scroll the last card above the floating buttons */}
          <div className="h-24" aria-hidden />
        </>
      )}

      {/* Quick add (+ scan for Pro) */}
      {summary.hasCategories && (
        <div className="fixed right-5 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-10 flex flex-col items-center gap-3">
          {summary.isPro && (
            <Link
              href="/scan"
              aria-label="Scan a receipt"
              className="no-callout flex h-12 w-12 items-center justify-center rounded-full bg-card text-2xl shadow-lg active:scale-95"
            >
              📷
            </Link>
          )}
          <Link
            href={isCurrent ? "/transactions/new" : `/transactions/new?m=${month}`}
            aria-label="Add a purchase"
            className="no-callout flex h-16 w-16 items-center justify-center rounded-full bg-accent text-4xl leading-none text-white shadow-lg active:scale-95 dark:text-zinc-950"
          >
            +
          </Link>
        </div>
      )}
    </div>
  );
}

function CategoryCard({ category: c, month }: { category: CategorySummary; month: string }) {
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
          <span className="truncate font-medium">
            {c.name}
            {c.archived && <span className="ml-1 text-xs text-zinc-400">(archived)</span>}
          </span>
        </div>
        <div className="shrink-0 text-right text-sm">
          <span className="font-semibold">{money(c.spent)}</span>
          {c.budget > 0 && <span className="text-zinc-500"> / {moneyShort(c.budget)}</span>}
        </div>
      </div>
      <ProgressBar spent={c.spent} budget={c.budget} status={c.status} />
      <div className="text-sm">
        <StatusText status={c.status} remaining={c.remaining} />
      </div>
    </Link>
  );
}

// A folder (e.g. Subscriptions): totals on the outside, tap to see each one.
function GroupCard({ group, month }: { group: GroupSummary; month: string }) {
  return (
    <details className="card group/folder p-0">
      <summary className="block cursor-pointer list-none space-y-2 p-4 [&::-webkit-details-marker]:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-lg dark:bg-zinc-800">
              {group.icon}
            </span>
            <span className="truncate font-medium">{group.name}</span>
            <span className="shrink-0 text-xs text-zinc-400">{group.categories.length}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-sm">
            <span>
              <span className="font-semibold">{money(group.spent)}</span>
              {group.budget > 0 && <span className="text-zinc-500"> / {moneyShort(group.budget)}</span>}
            </span>
            <span className="text-zinc-400 transition-transform group-open/folder:rotate-90">›</span>
          </div>
        </div>
        <ProgressBar spent={group.spent} budget={group.budget} status={group.status} />
        <div className="text-sm">
          <StatusText status={group.status} remaining={group.remaining} />
        </div>
      </summary>
      <ul className="divide-y divide-zinc-200 border-t border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {group.categories.map((c) => (
          <li key={c.id}>
            <Link href={`/transactions?c=${c.id}&m=${month}`} className="block space-y-1.5 px-4 py-3 active:opacity-70">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">
                  {c.icon} {c.name}
                </span>
                <span className="shrink-0">
                  <span className="font-semibold">{money(c.spent)}</span>
                  {c.budget > 0 && <span className="text-zinc-500"> / {moneyShort(c.budget)}</span>}
                </span>
              </div>
              <ProgressBar spent={c.spent} budget={c.budget} status={c.status} />
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

function StatusText({ status, remaining }: { status: Status; remaining: number }) {
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
  return <span className={`font-medium ${statusColors[status].text}`}>{text}</span>;
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
