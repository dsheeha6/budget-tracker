"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseMoney } from "@/lib/money";
import { createClient, requireUser } from "@/lib/supabase/server";

export type FormState = { error?: string; saved?: boolean } | null;

/** Blank = use the sum of the category budgets. */
export async function saveOverallBudget(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, userId } = await requireUser();
  const input = String(formData.get("monthly_budget") ?? "").trim();
  const amount = input === "" ? null : parseMoney(input);
  if (amount !== null && (Number.isNaN(amount) || amount < 0)) {
    return { error: "Budget must be a positive number." };
  }

  const { error } = await supabase.from("profiles").update({ monthly_budget: amount }).eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { saved: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
