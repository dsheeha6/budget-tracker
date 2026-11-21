"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { today } from "@/lib/dates";
import { parseMoney } from "@/lib/money";
import { requireUser } from "@/lib/supabase/server";

export type FormState = { error?: string } | null;

/** Creates a goal, or updates one when the form includes an id. */
export async function saveGoal(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim() || "🎯";
  const color = String(formData.get("color") ?? "#10b981");
  const target = parseMoney(formData.get("target_amount"));
  const targetDate = String(formData.get("target_date") ?? "").trim() || null;
  const startInput = String(formData.get("starting_amount") ?? "").trim();
  const starting = startInput === "" ? 0 : parseMoney(startInput);

  if (!name) return { error: "Give the goal a name." };
  if (name.length > 50) return { error: "Name is too long (50 characters max)." };
  if (icon.length > 16) return { error: "Use a single emoji for the icon." };
  if (!/^#[0-9a-f]{6}$/i.test(color)) return { error: "Pick a color." };
  if (Number.isNaN(target) || target <= 0) return { error: "Enter how much you want to save." };
  if (targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) return { error: "That date doesn't look right." };
  if (Number.isNaN(starting) || starting < 0) return { error: "Already saved must be a positive number." };

  const fields = { name, icon, color, target_amount: target, target_date: targetDate };

  if (id) {
    const { error } = await supabase.from("savings_goals").update(fields).eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/", "layout");
    redirect(`/goals/${id}`);
  }

  const { count } = await supabase.from("savings_goals").select("id", { count: "exact", head: true });
  const { data, error } = await supabase
    .from("savings_goals")
    .insert({ ...fields, sort_order: count ?? 0 })
    .select("id")
    .single();
  if (error) return { error: error.message };

  if (starting > 0) {
    const { error: cErr } = await supabase
      .from("goal_contributions")
      .insert({ goal_id: data.id, amount: starting, date: today(), note: "Already saved" });
    if (cErr) return { error: cErr.message };
  }

  revalidatePath("/", "layout");
  redirect(`/goals/${data.id}`);
}

export async function deleteGoal(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from("savings_goals").delete().eq("id", String(formData.get("id")));
  revalidatePath("/", "layout");
  redirect("/goals");
}

export async function setGoalArchived(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  await supabase
    .from("savings_goals")
    .update({ archived: formData.get("archived") === "true" })
    .eq("id", id);
  revalidatePath("/", "layout");
  redirect(`/goals/${id}`);
}

/** Puts money in (or takes it out, when kind = "out") of a goal. */
export async function addContribution(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const goalId = String(formData.get("goal_id") ?? "");
  const amount = parseMoney(formData.get("amount"));
  const out = formData.get("kind") === "out";
  const date = String(formData.get("date") ?? "").trim() || today();
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!goalId) return { error: "Goal not found." };
  if (Number.isNaN(amount) || amount <= 0) return { error: "Enter an amount." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "That date doesn't look right." };

  const { error } = await supabase
    .from("goal_contributions")
    .insert({ goal_id: goalId, amount: out ? -amount : amount, date, note });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

export async function deleteContribution(formData: FormData) {
  const { supabase } = await requireUser();
  const goalId = String(formData.get("goal_id"));
  await supabase.from("goal_contributions").delete().eq("id", String(formData.get("id")));
  revalidatePath("/", "layout");
  redirect(`/goals/${goalId}`);
}
