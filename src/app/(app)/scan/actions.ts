"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { itemsNote, splitByCategory } from "@/lib/receiptSplit";
import { requireUser } from "@/lib/supabase/server";

export type SaveState = { error?: string } | null;

const SaveSchema = z.object({
  receiptId: z.uuid(),
  merchant: z.string().trim().max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date."),
  total: z.number().positive("Enter the receipt total.").max(1_000_000),
  mode: z.enum(["single", "split"]),
  categoryId: z.string(),
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(200),
        price: z.number().finite(),
        categoryId: z.string().nullable(),
      }),
    )
    .max(200),
});

export type SaveReceiptInput = z.infer<typeof SaveSchema>;

/** Saves a reviewed receipt as one transaction, or one per category. */
export async function saveReceipt(input: SaveReceiptInput): Promise<SaveState> {
  const { supabase } = await requireUser();

  const parsed = SaveSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the receipt details." };
  const r = parsed.data;
  const merchant = r.merchant || null;

  // RLS limits this to the user's own receipts.
  const { data: receipt } = await supabase.from("receipts").select("id").eq("id", r.receiptId).maybeSingle();
  if (!receipt) return { error: "Receipt not found. Try scanning again." };
  const { count: alreadySaved } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("receipt_id", r.receiptId);
  if (alreadySaved) return { error: "This receipt was already saved." };

  let transactions;
  let itemRows;
  if (r.mode === "single") {
    if (!r.categoryId) return { error: "Pick a category." };
    transactions = [
      {
        amount: r.total,
        category_id: r.categoryId,
        merchant,
        date: r.date,
        note: r.items.length ? itemsNote(r.items.map((i) => i.name)) : null,
        receipt_id: r.receiptId,
      },
    ];
    itemRows = r.items.map((i) => ({ ...i, categoryId: r.categoryId }));
  } else {
    if (r.items.length === 0) return { error: "Add at least one item to split." };
    if (r.items.some((i) => !i.categoryId)) return { error: "Pick a category for every item." };
    const splitItems = r.items.map((i) => ({ name: i.name, price: i.price, categoryId: i.categoryId! }));
    transactions = splitByCategory(splitItems, r.total).map((share) => ({
      amount: share.amount,
      category_id: share.categoryId,
      merchant,
      date: r.date,
      note: itemsNote(share.itemNames),
      receipt_id: r.receiptId,
    }));
    itemRows = splitItems;
  }

  const { error } = await supabase.from("transactions").insert(transactions);
  if (error) return { error: error.message };

  await Promise.all([
    supabase.from("receipts").update({ merchant, total: r.total }).eq("id", r.receiptId),
    itemRows.length
      ? supabase.from("receipt_items").insert(
          itemRows.map((i) => ({ receipt_id: r.receiptId, name: i.name, price: i.price, category_id: i.categoryId })),
        )
      : null,
  ]);

  revalidatePath("/", "layout");
  redirect(`/?m=${r.date.slice(0, 7)}`);
}
