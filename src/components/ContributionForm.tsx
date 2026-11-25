"use client";

import { useEffect, useRef, useState } from "react";
import { addContribution, type FormState } from "@/app/(app)/goals/actions";
import SubmitButton from "@/components/SubmitButton";
import { useFormAction } from "@/lib/useFormAction";

// Quick "put money in" form on a goal's screen. Clears itself after each save.
export default function ContributionForm({ goalId, defaultDate }: { goalId: string; defaultDate: string }) {
  const { state, pending, onSubmit } = useFormAction<FormState>(addContribution, null);
  const [kind, setKind] = useState<"in" | "out">("in");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && !state.error) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="goal_id" value={goalId} />
      <input type="hidden" name="kind" value={kind} />

      <div className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-200 p-1 text-sm font-semibold dark:bg-zinc-800">
        {(["in", "out"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-lg py-2 ${kind === k ? "bg-card shadow-sm" : "text-zinc-500"}`}
          >
            {k === "in" ? "Add money" : "Take out"}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <label className="label" htmlFor="amount">Amount</label>
          <input id="amount" name="amount" inputMode="decimal" required placeholder="$100" autoComplete="off" className="input" />
        </div>
        <div className="min-w-0 flex-1">
          <label className="label" htmlFor="date">Date</label>
          <input id="date" name="date" type="date" defaultValue={defaultDate} className="input" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="note">Note (optional)</label>
        <input id="note" name="note" maxLength={100} placeholder="Paycheck transfer" className="input" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton pending={pending}>{kind === "in" ? "Add to goal" : "Take out of goal"}</SubmitButton>
    </form>
  );
}
