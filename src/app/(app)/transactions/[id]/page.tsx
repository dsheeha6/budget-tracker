import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import SubmitButton from "@/components/SubmitButton";
import TransactionForm from "@/components/TransactionForm";
import { requireUser } from "@/lib/supabase/server";
import type { Category, CategoryGroup, Transaction } from "@/lib/types";
import { deleteTransaction } from "../actions";

export default async function EditTransactionPage({ params }: PageProps<"/transactions/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();

  const [txRes, catRes, groupRes] = await Promise.all([
    supabase.from("transactions").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("*").order("sort_order").order("name"),
    supabase.from("category_groups").select("*").order("sort_order").order("name"),
  ]);
  if (!txRes.data) notFound();
  const transaction = txRes.data as Transaction;
  // Active categories, plus this transaction's own category even if archived.
  const categories = ((catRes.data ?? []) as Category[]).filter(
    (c) => !c.archived || c.id === transaction.category_id,
  );
  const back = `/transactions?m=${transaction.date.slice(0, 7)}`;

  // Scanned purchases link to their receipt photo (private; link expires in an hour).
  let receiptUrl: string | null = null;
  if (transaction.receipt_id) {
    const { data: receipt } = await supabase
      .from("receipts")
      .select("image_path")
      .eq("id", transaction.receipt_id)
      .maybeSingle();
    if (receipt?.image_path) {
      const { data: signed } = await supabase.storage.from("receipts").createSignedUrl(receipt.image_path, 3600);
      receiptUrl = signed?.signedUrl ?? null;
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Edit purchase" back={back} />
      <TransactionForm
        categories={categories}
        groups={(groupRes.data ?? []) as CategoryGroup[]}
        transaction={transaction}
        defaultDate={transaction.date}
        back={back}
      />
      {receiptUrl && (
        <a href={receiptUrl} target="_blank" rel="noreferrer" className="card flex items-center gap-3 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- signed private URL */}
          <img src={receiptUrl} alt="Receipt" className="h-14 w-10 rounded object-cover" />
          <span className="flex-1 font-medium">View receipt</span>
          <span className="text-zinc-400">›</span>
        </a>
      )}
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
