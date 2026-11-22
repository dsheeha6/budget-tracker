"use client";

import { useEffect } from "react";
import Penny from "@/components/Penny";
import ProgressBar from "@/components/ProgressBar";
import { money, moneyShort } from "@/lib/money";

export type Overspend = {
  category: string;
  spent: number;
  budget: number;
  amount: number;
};

// Penny checks in before a purchase lands in a category that's already over,
// or would tip it over. It never blocks: "Add it anyway" goes ahead.
export default function OverspendAlert({
  info,
  onCancel,
  onConfirm,
}: {
  info: Overspend;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const alreadyOver = info.spent >= info.budget;
  const overAfter = info.spent + info.amount - info.budget;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
      <button type="button" aria-label="Close" onClick={onCancel} className="absolute inset-0 bg-black/45 dark:bg-black/60" />
      <div role="alertdialog" aria-modal="true" aria-labelledby="overspend-title" className="relative w-full max-w-sm pt-14">
        <Penny mood="worried" size={116} className="absolute top-0 left-1/2 z-10 -translate-x-1/2" />
        <div className="card space-y-3 p-5 pt-16" style={{ "--ink-radius": "26px" } as React.CSSProperties}>
          <h2 id="overspend-title" className="text-2xl leading-tight">
            {alreadyOver ? `Whoa, ${info.category} is already over` : `This tips ${info.category} over`}
          </h2>
          <p className="font-note text-[1.7rem] leading-[1.05] text-brand-red">
            {alreadyOver
              ? "“hey Danny… I thought we were gonna stay within budget here?”"
              : "“hmm, are we sure about this one? we were so close!”"}
          </p>
          <div
            className="ink space-y-2 px-3.5 py-3"
            style={{ "--ink-fill": "var(--red-tint)", "--ink-shadow": "0px", "--ink-width": "2px", "--ink-radius": "14px" } as React.CSSProperties}
          >
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-ink-soft">{info.category} this month</span>
              <span className="font-bold">
                {money(info.spent)} / {moneyShort(info.budget)}
              </span>
            </div>
            <ProgressBar spent={info.spent} budget={info.budget} status={alreadyOver ? "red" : "yellow"} />
            <p className="text-[15px] font-semibold text-brand-red">
              This {money(info.amount)} would put you {money(overAfter)} over.
            </p>
          </div>
          <button type="button" onClick={onCancel} className="btn-primary w-full" autoFocus>
            Never mind
          </button>
          <button type="button" onClick={onConfirm} className="w-full py-2 text-base font-semibold text-ink-soft">
            Add it anyway
          </button>
        </div>
      </div>
    </div>
  );
}
