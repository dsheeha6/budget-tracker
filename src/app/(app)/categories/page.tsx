import Link from "next/link";
import SubmitButton from "@/components/SubmitButton";
import { moneyShort } from "@/lib/money";
import { requireUser } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import { setArchived } from "./actions";

export default async function CategoriesPage() {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("categories").select("*").order("sort_order").order("name");
  const categories = (data ?? []) as Category[];
  const active = categories.filter((c) => !c.archived);
  const archived = categories.filter((c) => c.archived);
  const total = active.reduce((sum, c) => sum + Number(c.monthly_budget), 0);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <Link href="/categories/new" className="rounded-xl bg-accent px-4 py-2 font-semibold text-white dark:text-zinc-950">
          + New
        </Link>
      </header>

      {active.length === 0 ? (
        <p className="card text-center text-zinc-500">No categories yet.</p>
      ) : (
        <ul className="card divide-y divide-zinc-200 p-0 dark:divide-zinc-800">
          {active.map((c) => (
            <li key={c.id}>
              <Link href={`/categories/${c.id}`} className="flex items-center gap-3 px-4 py-3 active:opacity-70">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
                  style={{ backgroundColor: `${c.color}26` }}
                >
                  {c.icon}
                </span>
                <span className="flex-1 truncate font-medium">{c.name}</span>
                <span className="text-zinc-500">{c.monthly_budget > 0 ? moneyShort(Number(c.monthly_budget)) : "No budget"}</span>
                <span className="text-zinc-400">›</span>
              </Link>
            </li>
          ))}
          <li className="flex justify-between px-4 py-3 text-sm font-semibold">
            <span>Total per month</span>
            <span>{moneyShort(total)}</span>
          </li>
        </ul>
      )}

      {archived.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-zinc-500">Archived</h2>
          <ul className="card divide-y divide-zinc-200 p-0 dark:divide-zinc-800">
            {archived.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-2">
                <span className="text-lg opacity-60">{c.icon}</span>
                <span className="flex-1 truncate text-zinc-500">{c.name}</span>
                <form action={setArchived}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="archived" value="false" />
                  <SubmitButton className="py-2 text-sm font-semibold text-accent" pendingText="…">
                    Restore
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
