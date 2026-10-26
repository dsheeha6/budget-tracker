import Link from "next/link";
import SubmitButton from "@/components/SubmitButton";
import { moneyShort } from "@/lib/money";
import { requireUser } from "@/lib/supabase/server";
import type { Category, CategoryGroup } from "@/lib/types";
import { setArchived } from "./actions";

export default async function CategoriesPage() {
  const { supabase } = await requireUser();
  const [catRes, groupRes] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order").order("name"),
    supabase.from("category_groups").select("*").order("sort_order").order("name"),
  ]);
  const categories = (catRes.data ?? []) as Category[];
  const groups = (groupRes.data ?? []) as CategoryGroup[];
  const active = categories.filter((c) => !c.archived);
  const archived = categories.filter((c) => c.archived);
  const total = active.reduce((sum, c) => sum + Number(c.monthly_budget), 0);
  const groupIds = new Set(groups.map((g) => g.id));
  const loose = active.filter((c) => !c.group_id || !groupIds.has(c.group_id));

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <div className="flex gap-2">
          <Link href="/categories/groups/new" className="rounded-xl bg-zinc-200 px-3 py-2 font-semibold dark:bg-zinc-800">
            + Folder
          </Link>
          <Link href="/categories/new" className="rounded-xl bg-accent px-3 py-2 font-semibold text-white dark:text-zinc-950">
            + Category
          </Link>
        </div>
      </header>

      <div className="card flex justify-between py-3 font-semibold">
        <span>Total per month</span>
        <span>{moneyShort(total)}</span>
      </div>

      {active.length === 0 && <p className="card text-center text-zinc-500">No categories yet.</p>}

      {loose.length > 0 && <CategoryList categories={loose} />}

      {groups.map((g) => {
        const inside = active.filter((c) => c.group_id === g.id);
        const groupTotal = inside.reduce((sum, c) => sum + Number(c.monthly_budget), 0);
        return (
          <section key={g.id}>
            <div className="mb-1 flex items-center justify-between px-1">
              <Link href={`/categories/groups/${g.id}`} className="flex items-center gap-1 py-1 font-semibold">
                <span>{g.icon}</span> {g.name}
                <span className="text-sm font-normal text-zinc-400">· {moneyShort(groupTotal)}</span>
                <span className="ml-1 text-xs font-normal text-accent">Edit</span>
              </Link>
              <Link href={`/categories/new?group=${g.id}`} className="px-2 py-1 text-sm font-semibold text-accent">
                + Add
              </Link>
            </div>
            {inside.length > 0 ? (
              <CategoryList categories={inside} />
            ) : (
              <p className="card py-3 text-sm text-zinc-500">Empty folder. Tap + Add to put a category here.</p>
            )}
          </section>
        );
      })}

      {archived.length > 0 && (
        <section>
          <h2 className="mb-2 px-1 text-sm font-medium text-zinc-500">Archived</h2>
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

function CategoryList({ categories }: { categories: Category[] }) {
  return (
    <ul className="card divide-y divide-zinc-200 p-0 dark:divide-zinc-800">
      {categories.map((c) => (
        <li key={c.id}>
          <Link href={`/categories/${c.id}`} className="flex items-center gap-3 px-4 py-3 active:opacity-70">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
              style={{ backgroundColor: `${c.color}26` }}
            >
              {c.icon}
            </span>
            <span className="flex-1 truncate font-medium">{c.name}</span>
            <span className="text-zinc-500">
              {Number(c.monthly_budget) > 0 ? moneyShort(Number(c.monthly_budget)) : "No budget"}
            </span>
            <span className="text-zinc-400">›</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
