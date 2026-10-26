import Link from "next/link";
import MonthSwitcher from "@/components/MonthSwitcher";
import { currentMonth, dayLabel, monthParam, monthStart, nextMonthStart } from "@/lib/dates";
import { money } from "@/lib/money";
import { requireUser } from "@/lib/supabase/server";
import type { Category, Transaction } from "@/lib/types";

export default async function TransactionsPage({ searchParams }: PageProps<"/transactions">) {
  const { supabase } = await requireUser();
  const params = await searchParams;
  const month = monthParam(params.m);
  const categoryFilter = typeof params.c === "string" ? params.c : "";

  let query = supabase
    .from("transactions")
    .select("*")
    .gte("date", monthStart(month))
    .lt("date", nextMonthStart(month))
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (categoryFilter) query = query.eq("category_id", categoryFilter);

  const [txRes, catRes] = await Promise.all([
    query,
    supabase.from("categories").select("*").order("sort_order").order("name"),
  ]);
  const transactions = (txRes.data ?? []) as Transaction[];
  const categories = (catRes.data ?? []) as Category[];
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  // Group by day, newest first (already sorted by the query).
  const days: { date: string; total: number; items: Transaction[] }[] = [];
  for (const t of transactions) {
    let day = days[days.length - 1];
    if (!day || day.date !== t.date) {
      day = { date: t.date, total: 0, items: [] };
      days.push(day);
    }
    day.items.push(t);
    day.total += Number(t.amount);
  }
  const monthTotal = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  // Link helper that keeps the month and swaps the category filter.
  const filterHref = (c: string) => {
    const q = new URLSearchParams();
    if (month !== currentMonth()) q.set("m", month);
    if (c) q.set("c", c);
    const qs = q.toString();
    return qs ? `/transactions?${qs}` : "/transactions";
  };
  const chipCategories = categories.filter((c) => !c.archived || c.id === categoryFilter);

  return (
    <div className="space-y-4">
      <MonthSwitcher month={month} basePath="/transactions" params={categoryFilter ? { c: categoryFilter } : {}} />

      {/* Category filter chips */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip href={filterHref("")} active={!categoryFilter}>All</Chip>
        {chipCategories.map((c) => (
          <Chip key={c.id} href={filterHref(c.id)} active={c.id === categoryFilter}>
            {c.icon} {c.name}
          </Chip>
        ))}
      </div>

      <div className="flex justify-between px-1 text-sm text-zinc-500">
        <span>{transactions.length} {transactions.length === 1 ? "purchase" : "purchases"}</span>
        <span className="font-semibold text-foreground">{money(monthTotal)}</span>
      </div>

      {days.length === 0 ? (
        <p className="card text-center text-zinc-500">Nothing logged here yet.</p>
      ) : (
        days.map((day) => (
          <section key={day.date}>
            <div className="mb-1 flex justify-between px-1 text-sm font-medium text-zinc-500">
              <span>{dayLabel(day.date)}</span>
              <span>{money(day.total)}</span>
            </div>
            <ul className="card divide-y divide-zinc-200 p-0 dark:divide-zinc-800">
              {day.items.map((t) => {
                const c = categoryById.get(t.category_id);
                return (
                  <li key={t.id}>
                    <Link href={`/transactions/${t.id}`} className="flex items-center gap-3 px-4 py-3 active:opacity-70">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg"
                        style={{ backgroundColor: `${c?.color ?? "#71717a"}26` }}
                      >
                        {c?.icon ?? "💸"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{t.merchant || c?.name || "Purchase"}</div>
                        <div className="truncate text-xs text-zinc-500">
                          {[t.merchant ? c?.name : null, t.note].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <span className={`shrink-0 font-semibold ${t.amount < 0 ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                        {t.amount < 0 ? `+${money(-t.amount)}` : money(t.amount)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`no-callout shrink-0 rounded-full px-4 py-2 text-sm whitespace-nowrap ${
        active ? "bg-foreground text-background" : "bg-card text-zinc-600 dark:text-zinc-300"
      }`}
    >
      {children}
    </Link>
  );
}
