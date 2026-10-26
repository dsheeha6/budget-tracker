"use client";

import { saveIncome, type FormState } from "@/app/(app)/settings/actions";
import SubmitButton from "@/components/SubmitButton";
import { PAY_FREQUENCIES } from "@/lib/income";
import type { Profile } from "@/lib/types";
import { useFormAction } from "@/lib/useFormAction";

type IncomeFields = Pick<Profile, "pay_amount" | "pay_frequency" | "retirement_per_paycheck" | "tax_per_paycheck">;

export default function IncomeForm({ profile }: { profile: IncomeFields }) {
  const { state, pending, onSubmit } = useFormAction<FormState>(saveIncome, null);

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <h2 className="font-semibold">Income</h2>
      <MoneyField name="pay_amount" label="Take-home per paycheck" value={profile.pay_amount} placeholder="After taxes & 401k" />
      <div>
        <label className="label" htmlFor="pay_frequency">Paid</label>
        <select id="pay_frequency" name="pay_frequency" defaultValue={profile.pay_frequency} className="input">
          {PAY_FREQUENCIES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <MoneyField name="retirement_per_paycheck" label="Roth / 401k" value={profile.retirement_per_paycheck} placeholder="0" />
        <MoneyField name="tax_per_paycheck" label="Taxes" value={profile.tax_per_paycheck} placeholder="0" />
      </div>
      <p className="text-xs text-zinc-500">
        Roth and taxes come out before take-home. They&apos;re shown for reference, not counted as spending.
      </p>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.saved && <p className="text-sm text-emerald-600">Saved.</p>}
      <SubmitButton pending={pending}>Save income</SubmitButton>
    </form>
  );
}

function MoneyField({
  name,
  label,
  value,
  placeholder,
}: {
  name: string;
  label: string;
  value: number | null;
  placeholder: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <div className="relative">
        <span className="absolute top-1/2 left-4 -translate-y-1/2 text-zinc-500">$</span>
        <input
          id={name}
          name={name}
          inputMode="decimal"
          defaultValue={value ? Number(value).toFixed(2) : ""}
          placeholder={placeholder}
          className="input pl-8"
        />
      </div>
    </div>
  );
}
