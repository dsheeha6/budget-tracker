import { redirect } from "next/navigation";
import PageHeader from "@/components/PageHeader";
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
  const back = month ? `/?m=${month}` : "/";

  return (
    <div className="space-y-4">
      <PageHeader title="Add purchase" back={back} />
      <TransactionForm categories={categories} defaultDate={defaultDate} back={back} />
    </div>
  );
}
