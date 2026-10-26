"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addMonths, currentMonth, monthStart } from "@/lib/dates";
import { parseMoney } from "@/lib/money";
import { requireUser } from "@/lib/supabase/server";

export type FormState = { error?: string } | null;

const STARTERS = [
  { name: "Groceries", icon: "🛒", color: "#10b981" },
  { name: "Dining Out", icon: "🍔", color: "#f97316" },
  { name: "Gas & Transport", icon: "⛽", color: "#3b82f6" },
  { name: "Shopping", icon: "🛍️", color: "#ec4899" },
  { name: "Fun", icon: "🎉", color: "#a855f7" },
  { name: "Bills", icon: "💡", color: "#eab308" },
];

export async function addStarterCategories() {
  const { supabase } = await requireUser();
  await supabase.from("categories").insert(STARTERS.map((s, i) => ({ ...s, sort_order: i })));
  revalidatePath("/", "layout");
  redirect("/categories");
}

/** Creates a category, or updates one when the form includes an id. */
export async function saveCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim() || "💸";
  const color = String(formData.get("color") ?? "#6366f1");
  const budgetInput = String(formData.get("monthly_budget") ?? "").trim();
  const monthlyBudget = budgetInput === "" ? 0 : parseMoney(budgetInput);

  if (!name) return { error: "Give the category a name." };
  if (name.length > 50) return { error: "Name is too long (50 characters max)." };
  if (icon.length > 16) return { error: "Use a single emoji for the icon." };
  if (!/^#[0-9a-f]{6}$/i.test(color)) return { error: "Pick a color." };
  if (Number.isNaN(monthlyBudget) || monthlyBudget < 0) return { error: "Budget must be a positive number." };

  const fields = { name, icon, color, monthly_budget: monthlyBudget };

  if (id) {
    const { data: existing } = await supabase
      .from("categories")
      .select("monthly_budget, created_at")
      .eq("id", id)
      .single();
    if (!existing) return { error: "Category not found." };

    // Budget changed: save the old amount for past months so their history
    // doesn't change. Months that already have a saved amount are left alone.
    if (Number(existing.monthly_budget) !== monthlyBudget) {
      const snapshots = [];
      const thisMonth = currentMonth();
      for (let m = existing.created_at.slice(0, 7); m < thisMonth; m = addMonths(m, 1)) {
        snapshots.push({ category_id: id, month: monthStart(m), amount: Number(existing.monthly_budget) });
      }
      if (snapshots.length) {
        const { error } = await supabase
          .from("category_budgets")
          .upsert(snapshots, { onConflict: "category_id,month", ignoreDuplicates: true });
        if (error) return { error: error.message };
      }
    }

    const { error } = await supabase.from("categories").update(fields).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { count } = await supabase.from("categories").select("id", { count: "exact", head: true });
    const { error } = await supabase.from("categories").insert({ ...fields, sort_order: count ?? 0 });
    if (error) return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/categories");
}

/** Deletes a category, or archives it if it has transactions (keeps history). */
export async function deleteCategory(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error?.code === "23503") {
    // Still referenced by transactions → archive instead.
    await supabase.from("categories").update({ archived: true }).eq("id", id);
  }

  revalidatePath("/", "layout");
  redirect("/categories");
}

export async function setArchived(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  const archived = formData.get("archived") === "true";
  await supabase.from("categories").update({ archived }).eq("id", id);
  revalidatePath("/", "layout");
  redirect("/categories");
}
