"use client";

import { saveGoal, type FormState } from "@/app/(app)/goals/actions";
import SubmitButton from "@/components/SubmitButton";
import type { SavingsGoal } from "@/lib/types";
import { useFormAction } from "@/lib/useFormAction";

const COLORS = ["#10b981", "#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#ef4444", "#f97316", "#eab308", "#64748b"];

export default function GoalForm({ goal }: { goal?: SavingsGoal }) {
  const { state, pending, onSubmit } = useFormAction<FormState>(saveGoal, null);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {goal && <input type="hidden" name="id" value={goal.id} />}
      <div className="flex gap-3">
        <div className="w-20">
          <label className="label" htmlFor="icon">Icon</label>
          <input id="icon" name="icon" defaultValue={goal?.icon ?? "🎯"} maxLength={16} className="input text-center text-2xl" />
        </div>
        <div className="flex-1">
          <label className="label" htmlFor="name">Saving for</label>
          <input
            id="name"
            name="name"
            required
            maxLength={50}
            defaultValue={goal?.name}
            placeholder="Emergency fund"
            className="input"
            autoFocus={!goal}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="target_amount">Goal amount</label>
          <input
            id="target_amount"
            name="target_amount"
            inputMode="decimal"
            required
            placeholder="$5,000"
            defaultValue={goal ? Number(goal.target_amount).toFixed(2) : ""}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="target_date">By (optional)</label>
          <input id="target_date" name="target_date" type="date" defaultValue={goal?.target_date ?? ""} className="input" />
        </div>
      </div>

      {!goal && (
        <div>
          <label className="label" htmlFor="starting_amount">Already saved (optional)</label>
          <input id="starting_amount" name="starting_amount" inputMode="decimal" placeholder="$0" className="input" />
        </div>
      )}

      <fieldset>
        <legend className="label">Color</legend>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <label key={c} className="cursor-pointer">
              <input type="radio" name="color" value={c} defaultChecked={(goal?.color ?? "#10b981") === c} className="peer sr-only" />
              <span
                className="block h-9 w-9 rounded-full ring-offset-2 ring-offset-background peer-checked:ring-2 peer-checked:ring-foreground"
                style={{ backgroundColor: c }}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <p className="text-xs text-zinc-500">With a date, the app works out how much to put aside each month to get there.</p>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton pending={pending}>{goal ? "Save" : "Create goal"}</SubmitButton>
    </form>
  );
}
