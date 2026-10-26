import Link from "next/link";
import { redirect } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import TransactionForm from "@/components/TransactionForm";
import { currentMonth, isValidMonth, today } from "@/lib/dates";
import { requireUser } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";

export default async function NewTransactionPage({ searchParams }: PageProps<"/transactions/new">) {
  const { supabase } = await requireUser();
  const { m } = await searchParams;
  const [{ data }, { data: profile }] = await Promise.all([
    supabase.from("categories").select("*").eq("archived", false).order("sort_order").order("name"),
    supabase.from("profiles").select("is_pro").single(),
  ]);
  const categories = (data ?? []) as Category[];
  if (categories.length === 0) redirect("/categories/new");

  // Adding from a past month on the dashboard → default to that month.
  const month = typeof m === "string" && isValidMonth(m) && m !== currentMonth() ? m : null;
  const defaultDate = month ? `${month}-01` : today();
  const back = month ? `/?m=${month}` : "/";

  return (
    <div className="space-y-4">
      <PageHeader title="Add purchase" back={back} />
      {profile?.is_pro && (
        <Link href="/scan" className="card flex items-center gap-3 py-3 active:opacity-70">
          <span className="text-2xl">📷</span>
          <span className="flex-1 font-medium">Scan a receipt instead</span>
          <span className="text-zinc-400">›</span>
        </Link>
      )}
      <TransactionForm categories={categories} defaultDate={defaultDate} back={back} />
    </div>
  );
}
