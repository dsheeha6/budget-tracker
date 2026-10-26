"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseMoney } from "@/lib/money";
import { requireUser } from "@/lib/supabase/server";

export type FormState = { error?: string } | null;

/** Only allow redirects to paths inside this app. */
function safeBack(value: FormDataEntryValue | null) {
  const back = String(value ?? "/");
  return back.startsWith("/") && !back.startsWith("//") ? back : "/";
}

/** Creates a transaction, or updates one when the form includes an id. */
export async function saveTransaction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();

  const id = String(formData.get("id") ?? "");
  const amount = parseMoney(formData.get("amount"));
  const isRefund = formData.get("refund") === "on";
  const categoryId = String(formData.get("category_id") ?? "");
  const date = String(formData.get("date") ?? "");
  const merchant = String(formData.get("merchant") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (Number.isNaN(amount) || amount <= 0) return { error: "Enter an amount." };
  if (amount >= 10_000_000) return { error: "That amount is too large." };
  if (!categoryId) return { error: "Pick a category." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Pick a date." };

  const fields = {
    amount: isRefund ? -amount : amount,
    category_id: categoryId,
    date,
    merchant,
    note,
  };

  const { error } = id
    ? await supabase.from("transactions").update(fields).eq("id", id)
    : await supabase.from("transactions").insert(fields);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect(safeBack(formData.get("back")));
}

export async function deleteTransaction(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from("transactions").delete().eq("id", String(formData.get("id")));
  revalidatePath("/", "layout");
  redirect(safeBack(formData.get("back")));
}
