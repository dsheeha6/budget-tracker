import Link from "next/link";
import MonthSwitcher from "@/components/MonthSwitcher";
import ProgressBar, { statusColors } from "@/components/ProgressBar";
import SubmitButton from "@/components/SubmitButton";
import { getMonthSummary, type CategorySummary, type Status } from "@/lib/budget";
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

          {/* Category cards */}
          <section className="space-y-2">
            {summary.categories.map((c) => (
              <CategoryCard key={c.id} category={c} month={month} />
            ))}
          </section>
        </>
      )}

      {/* Quick add */}
      {summary.hasCategories && (
        <Link
          href={isCurrent ? "/transactions/new" : `/transactions/new?m=${month}`}
          aria-label="Add a purchase"
          className="fixed right-5 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-10 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-4xl leading-none text-white shadow-lg active:scale-95 dark:text-zinc-950"
        >
          +
        </Link>
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
