import type { Status } from "@/lib/budget";

export const statusColors: Record<Status, { bar: string; text: string }> = {
  none: { bar: "bg-zinc-400", text: "text-zinc-500" },
  green: { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  yellow: { bar: "bg-amber-400", text: "text-amber-600 dark:text-amber-400" },
  red: { bar: "bg-red-500", text: "text-red-600 dark:text-red-400" },
};

export default function ProgressBar({ spent, budget, status }: { spent: number; budget: number; status: Status }) {
  const pct = budget > 0 ? Math.min(100, Math.max(0, (spent / budget) * 100)) : spent > 0 ? 100 : 0;
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
      <div className={`h-full rounded-full ${statusColors[status].bar}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
