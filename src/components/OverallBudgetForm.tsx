"use client";

import { saveOverallBudget, type FormState } from "@/app/(app)/settings/actions";
import SubmitButton from "@/components/SubmitButton";
import { useFormAction } from "@/lib/useFormAction";

export default function OverallBudgetForm({ current }: { current: number | null }) {
  const { state, pending, onSubmit } = useFormAction<FormState>(saveOverallBudget, null);

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <label className="label" htmlFor="monthly_budget">Overall monthly budget</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute top-1/2 left-4 -translate-y-1/2 text-zinc-500">$</span>
          <input
            id="monthly_budget"
            name="monthly_budget"
            inputMode="decimal"
            defaultValue={current ?? ""}
            placeholder="Sum of categories"
            className="input pl-8"
          />
        </div>
        <SubmitButton className="btn-primary" pendingText="…" pending={pending}>Save</SubmitButton>
      </div>
      <p className="text-xs text-zinc-500">Leave blank to use the total of your category budgets.</p>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.saved && <p className="text-sm text-emerald-600">Saved.</p>}
    </form>
  );
}
