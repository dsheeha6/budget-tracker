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

const FREQUENCIES = ["weekly", "biweekly", "semimonthly", "monthly"];

/** Paycheck settings. Blank take-home turns the income card off. */
export async function saveIncome(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, userId } = await requireUser();
  const amountInput = String(formData.get("pay_amount") ?? "").trim();
  const payAmount = amountInput === "" ? null : parseMoney(amountInput);
  const frequency = String(formData.get("pay_frequency") ?? "");
  const optional = (key: string) => {
    const v = String(formData.get(key) ?? "").trim();
    return v === "" ? 0 : parseMoney(v);
  };
  const retirement = optional("retirement_per_paycheck");
  const tax = optional("tax_per_paycheck");

  if (payAmount !== null && (Number.isNaN(payAmount) || payAmount < 0)) return { error: "Take-home pay must be a positive number." };
  if (!FREQUENCIES.includes(frequency)) return { error: "Pick how often you're paid." };
  if ([retirement, tax].some((n) => Number.isNaN(n) || n < 0)) return { error: "Amounts must be positive numbers." };

  const { error } = await supabase
    .from("profiles")
    .update({ pay_amount: payAmount, pay_frequency: frequency, retirement_per_paycheck: retirement, tax_per_paycheck: tax })
    .eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { saved: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
