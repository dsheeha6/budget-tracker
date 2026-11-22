import Link from "next/link";
import { redirect } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import TransactionForm from "@/components/TransactionForm";
import { cookies } from "next/headers";
import { currentMonth, isValidMonth, monthStart, nextMonthStart, today } from "@/lib/dates";
import { WARN_COOKIE } from "@/lib/theme";
import { requireUser } from "@/lib/supabase/server";
import type { Category, CategoryGroup } from "@/lib/types";

export default async function NewTransactionPage({ searchParams }: PageProps<"/transactions/new">) {
  const { supabase } = await requireUser();
  const { m } = await searchParams;
  const [{ data }, { data: groups }, { data: profile }] = await Promise.all([
    supabase.from("categories").select("*").eq("archived", false).order("sort_order").order("name"),
    supabase.from("category_groups").select("*").order("sort_order").order("name"),
    supabase.from("profiles").select("is_pro").single(),
  ]);
  const categories = (data ?? []) as Category[];
  if (categories.length === 0) redirect("/categories/new");

  // Adding from a past month on the dashboard → default to that month.
  const month = typeof m === "string" && isValidMonth(m) && m !== currentMonth() ? m : null;
  const defaultDate = month ? `${month}-01` : today();
  const back = month ? `/?m=${month}` : "/";

  // What each category has left this month, so Penny can check in before a
  // purchase goes over (unless that's turned off in Settings).
  const warn = (await cookies()).get(WARN_COOKIE)?.value !== "off";
  const thisMonth = currentMonth();
  const [{ data: snapshots }, { data: spending }] = await Promise.all([
    supabase.from("category_budgets").select("category_id, amount").eq("month", monthStart(thisMonth)),
    supabase
      .from("transactions")
      .select("category_id, amount")
      .gte("date", monthStart(thisMonth))
      .lt("date", nextMonthStart(thisMonth)),
  ]);
  const snapshotFor = new Map((snapshots ?? []).map((b) => [b.category_id, Number(b.amount)]));
  const spentFor = new Map<string, number>();
  for (const t of spending ?? []) spentFor.set(t.category_id, (spentFor.get(t.category_id) ?? 0) + Number(t.amount));
  const monthTotals = Object.fromEntries(
    categories.map((c) => [
      c.id,
      {
        budget: snapshotFor.get(c.id) ?? Number(c.monthly_budget),
        spent: Math.round((spentFor.get(c.id) ?? 0) * 100) / 100,
      },
    ]),
  );

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PageHeader title="Add purchase" back={back} />
      {profile?.is_pro && (
        <Link href="/scan" className="card flex items-center gap-3 py-3 active:opacity-70">
          <span className="text-2xl">📷</span>
          <span className="flex-1 font-medium">Scan a receipt instead</span>
          <span className="text-zinc-400">›</span>
        </Link>
      )}
      <TransactionForm
        categories={categories}
        groups={(groups ?? []) as CategoryGroup[]}
        defaultDate={defaultDate}
        back={back}
        overspend={warn ? { month: thisMonth, totals: monthTotals } : undefined}
      />
    </div>
  );
}
