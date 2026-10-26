import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import SubmitButton from "@/components/SubmitButton";
import TransactionForm from "@/components/TransactionForm";
import { requireUser } from "@/lib/supabase/server";
import type { Category, Transaction } from "@/lib/types";
import { deleteTransaction } from "../actions";

export default async function EditTransactionPage({ params }: PageProps<"/transactions/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();

  const [txRes, catRes] = await Promise.all([
    supabase.from("transactions").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("*").order("sort_order").order("name"),
  ]);
  if (!txRes.data) notFound();
  const transaction = txRes.data as Transaction;
  // Active categories, plus this transaction's own category even if archived.
  const categories = ((catRes.data ?? []) as Category[]).filter(
    (c) => !c.archived || c.id === transaction.category_id,
  );
  const back = `/transactions?m=${transaction.date.slice(0, 7)}`;

  return (
    <div className="space-y-4">
      <PageHeader title="Edit purchase" back={back} />
      <TransactionForm categories={categories} transaction={transaction} defaultDate={transaction.date} back={back} />
      <form action={deleteTransaction}>
        <input type="hidden" name="id" value={transaction.id} />
        <input type="hidden" name="back" value={back} />
        <SubmitButton className="btn-danger w-full" pendingText="Deleting…" confirmMessage="Delete this purchase?">
          Delete purchase
        </SubmitButton>
      </form>
    </div>
  );
}
