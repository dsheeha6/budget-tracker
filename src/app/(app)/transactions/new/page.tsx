import Link from "next/link";
import { redirect } from "next/navigation";
import TransactionForm from "@/components/TransactionForm";
import { currentMonth, isValidMonth, today } from "@/lib/dates";
import { requireUser } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";

export default async function NewTransactionPage({ searchParams }: PageProps<"/transactions/new">) {
  const { supabase } = await requireUser();
  const { m } = await searchParams;
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("archived", false)
    .order("sort_order")
    .order("name");
  const categories = (data ?? []) as Category[];
  if (categories.length === 0) redirect("/categories/new");

  // Adding from a past month on the dashboard → default to that month.
  const month = typeof m === "string" && isValidMonth(m) && m !== currentMonth() ? m : null;
  const defaultDate = month ? `${month}-01` : today();

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-2">
        <Link href="/" className="px-1 text-2xl text-zinc-500" aria-label="Back">‹</Link>
        <h1 className="text-2xl font-bold">Add purchase</h1>
      </header>
      <TransactionForm categories={categories} defaultDate={defaultDate} back={month ? `/?m=${month}` : "/"} />
    </div>
  );
}
