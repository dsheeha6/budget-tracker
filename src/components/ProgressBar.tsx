import type { Status } from "@/lib/budget";

// Blue while you're in budget (close or not), red once you're over.
// A finished month you stayed under turns British racing green (`past`).
export const statusColors: Record<Status, { bar: string; text: string }> = {
  none: { bar: "bg-ink-soft", text: "text-ink-soft" },
  green: { bar: "bg-brand-blue", text: "text-brand-blue" },
  yellow: { bar: "bg-brand-blue", text: "text-ink-soft" },
  red: { bar: "bg-brand-red", text: "text-brand-red" },
};
export const pastInBudget = { bar: "bg-brand-green", text: "text-brand-green" };

/** True when a finished month's category stayed within its budget. */
export function stayedInBudget(status: Status, past: boolean) {
  return past && (status === "green" || status === "yellow");
}

// Hand-inked track with a solid fill; the whole bar gets the ink wobble.
export default function ProgressBar({
  spent,
  budget,
  status,
  past = false,
  size = "md",
}: {
  spent: number;
  budget: number;
  status: Status;
  past?: boolean;
  size?: "md" | "lg";
}) {
  const pct = budget > 0 ? Math.min(100, Math.max(0, (spent / budget) * 100)) : spent > 0 ? 100 : 0;
  const color = stayedInBudget(status, past) ? pastInBudget.bar : statusColors[status].bar;
  return (
    <div
      className={`w-full overflow-hidden rounded-full border-[2.5px] border-ink bg-card p-[2px] ${size === "lg" ? "h-7" : "h-5"}`}
      style={{ filter: "url(#ink-wobble)" }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {pct > 0 && (
        <div
          className={`h-full rounded-full ${color} ${pct < 100 ? "border-r-2 border-ink/60" : ""}`}
          style={{ width: `max(${pct}%, 0.75rem)` }}
        />
      )}
    </div>
  );
}
