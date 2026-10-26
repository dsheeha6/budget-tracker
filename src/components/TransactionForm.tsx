"use client";

import { useState } from "react";
import { saveTransaction, type FormState } from "@/app/(app)/transactions/actions";
import SubmitButton from "@/components/SubmitButton";
import type { Category, Transaction } from "@/lib/types";
import { useFormAction } from "@/lib/useFormAction";

// Built for speed: amount is focused on open, one tap picks the category,
// and everything else is optional.
export default function TransactionForm({
  categories,
  transaction,
  defaultDate,
  back,
}: {
  categories: Category[];
  transaction?: Transaction;
  defaultDate: string;
  back: string;
}) {
  const { state, pending, onSubmit } = useFormAction<FormState>(saveTransaction, null);
  const [categoryId, setCategoryId] = useState(transaction?.category_id ?? "");
  const isRefund = transaction ? transaction.amount < 0 : false;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {transaction && <input type="hidden" name="id" value={transaction.id} />}
      <input type="hidden" name="back" value={back} />
      <input type="hidden" name="category_id" value={categoryId} />

      <div className="flex items-center justify-center gap-1 py-2">
        <span className="text-4xl font-semibold text-zinc-400">$</span>
        <input
          name="amount"
          inputMode="decimal"
          autoComplete="off"
          autoFocus={!transaction}
          required
          placeholder="0.00"
          defaultValue={transaction ? Math.abs(transaction.amount).toFixed(2) : ""}
          aria-label="Amount"
          className="w-48 bg-transparent text-center text-5xl font-bold outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
        />
      </div>

      <div>
        <span className="label">Category</span>
        <div className="grid grid-cols-3 gap-2">
          {categories.map((c) => {
            const selected = c.id === categoryId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={`flex min-h-16 flex-col items-center justify-center rounded-xl border-2 px-1 py-2 text-xs font-medium ${
                  selected ? "border-accent bg-accent/10" : "border-transparent bg-card"
                }`}
              >
                <span className="text-2xl">{c.icon}</span>
                <span className="line-clamp-1">{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card space-y-3">
        <div>
          <label className="label" htmlFor="merchant">Store</label>
          <input
            id="merchant"
            name="merchant"
            defaultValue={transaction?.merchant ?? ""}
            placeholder="Optional"
            autoComplete="off"
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="date">Date</label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={transaction?.date ?? defaultDate}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="note">Note</label>
          <input id="note" name="note" defaultValue={transaction?.note ?? ""} placeholder="Optional" className="input" />
        </div>
        <label className="flex items-center gap-3 py-1">
          <input type="checkbox" name="refund" defaultChecked={isRefund} className="h-5 w-5 accent-[var(--accent)]" />
          <span>This is a refund / return</span>
        </label>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <SubmitButton pending={pending}>{transaction ? "Save changes" : "Add purchase"}</SubmitButton>
    </form>
  );
}
