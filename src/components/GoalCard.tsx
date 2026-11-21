import Link from "next/link";
import { targetLabel, type GoalProgress } from "@/lib/goals";
import { money, moneyShort } from "@/lib/money";

// One goal: icon, saved / target, a bar in the goal's color, and the monthly pace.
export default function GoalCard({ goal: g, compact = false }: { goal: GoalProgress; compact?: boolean }) {
  return (
    <Link href={`/goals/${g.id}`} className={`block space-y-2 active:opacity-80 ${compact ? "" : "card"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg"
            style={{ backgroundColor: `${g.color}26` }}
          >
            {g.icon}
          </span>
          <span className="truncate font-medium">{g.name}</span>
        </div>
        <div className="shrink-0 text-right text-sm">
          <span className="font-semibold">{money(g.saved)}</span>
          <span className="text-zinc-500"> / {moneyShort(g.target_amount)}</span>
        </div>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div className="h-full rounded-full" style={{ width: `${g.pct}%`, backgroundColor: g.color }} />
      </div>
      <div className="flex justify-between gap-2 text-sm">
        <GoalPace goal={g} />
        <span className="shrink-0 text-zinc-500">{Math.floor(g.pct)}%</span>
      </div>
    </Link>
  );
}

export function GoalPace({ goal: g }: { goal: GoalProgress }) {
  if (g.done) return <span className="font-medium text-emerald-600 dark:text-emerald-400">Goal reached 🎉</span>;
  if (g.overdue)
    return (
      <span className="font-medium text-red-600 dark:text-red-400">
        {money(g.remaining)} to go · was due {targetLabel(g.target_date!)}
      </span>
    );
  if (g.perMonth !== null && g.target_date) {
    const onTrack = g.savedThisMonth >= g.perMonth;
    return (
      <span className={`font-medium ${onTrack ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-600 dark:text-zinc-300"}`}>
        {onTrack ? "On track this month" : `${money(g.perMonth - Math.max(0, g.savedThisMonth))} more this month`}
        <span className="font-normal text-zinc-500"> · by {targetLabel(g.target_date)}</span>
      </span>
    );
  }
  return <span className="text-zinc-500">{money(g.remaining)} to go</span>;
}
