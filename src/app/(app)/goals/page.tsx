import Link from "next/link";
import GoalCard from "@/components/GoalCard";
import { getGoals } from "@/lib/goals";
import { money, moneyShort } from "@/lib/money";
import { requireUser } from "@/lib/supabase/server";

export default async function GoalsPage() {
  const { supabase } = await requireUser();
  const goals = await getGoals(supabase);
  const active = goals.filter((g) => !g.archived);
  const archived = goals.filter((g) => g.archived);
  const saved = active.reduce((sum, g) => sum + g.saved, 0);
  const target = active.reduce((sum, g) => sum + g.target_amount, 0);
  const thisMonth = active.reduce((sum, g) => sum + g.savedThisMonth, 0);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Goals</h1>
        <Link href="/goals/new" className="rounded-xl bg-accent px-3 py-2 font-semibold text-white dark:text-zinc-950">
          + Goal
        </Link>
      </header>

      {active.length === 0 ? (
        <section className="card space-y-3 text-center">
          <div className="text-4xl">🎯</div>
          <div>
            <h2 className="text-lg font-semibold">Save up for something</h2>
            <p className="text-sm text-zinc-500">
              An emergency fund, a trip, a new car. Set the amount and a date, and track what you put aside.
            </p>
          </div>
          <Link href="/goals/new" className="btn-primary block">
            Create a goal
          </Link>
        </section>
      ) : (
        <>
          <div className="card flex items-end justify-between">
            <div>
              <div className="text-sm text-zinc-500">Saved toward goals</div>
              <div className="text-3xl font-bold tracking-tight">{money(saved)}</div>
            </div>
            <div className="text-right text-sm text-zinc-500">
              <div>of {moneyShort(target)}</div>
              <div>{money(thisMonth)} this month</div>
            </div>
          </div>
          <div className="space-y-2 lg:grid lg:grid-cols-2 lg:items-start lg:gap-3 lg:space-y-0">
            {active.map((g) => (
              <GoalCard key={g.id} goal={g} />
            ))}
          </div>
        </>
      )}

      {archived.length > 0 && (
        <section className="space-y-2">
          <h2 className="px-1 text-sm font-semibold text-zinc-500">Archived</h2>
          <div className="space-y-2 opacity-70 lg:grid lg:grid-cols-2 lg:items-start lg:gap-3 lg:space-y-0">
            {archived.map((g) => (
              <GoalCard key={g.id} goal={g} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
