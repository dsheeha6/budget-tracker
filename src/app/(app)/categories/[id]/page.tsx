import Link from "next/link";
import { notFound } from "next/navigation";
import CategoryForm from "@/components/CategoryForm";
import PageHeader from "@/components/PageHeader";
import SubmitButton from "@/components/SubmitButton";
import { moneyShort } from "@/lib/money";
import { requireUser } from "@/lib/supabase/server";
import type { Category, CategoryGroup } from "@/lib/types";
import { deleteCategory } from "../actions";

export default async function EditCategoryPage({ params }: PageProps<"/categories/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const [{ data }, { data: groups }] = await Promise.all([
    supabase.from("categories").select("*").eq("archived", false).order("sort_order").order("name"),
    supabase.from("category_groups").select("*").order("sort_order").order("name"),
  ]);
  const active = (data ?? []) as Category[];
  let category = active.find((c) => c.id === id);
  if (!category) {
    // Archived categories can still be opened by link.
    const { data: archived } = await supabase.from("categories").select("*").eq("id", id).maybeSingle();
    if (!archived) notFound();
    category = archived as Category;
  }
  const subs = active.filter((c) => c.parent_id === id);
  const mains = active.filter((c) => !c.parent_id && c.id !== id);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PageHeader title="Edit category" back="/categories" />
      {!category.parent_id && (
        <section className="card space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Sub categories</h2>
            <Link
              href={`/categories/new?parent=${category.id}`}
              className="rounded-xl bg-zinc-200 px-3 py-2 text-sm font-semibold dark:bg-zinc-800"
            >
              + Sub category
            </Link>
          </div>
          {subs.length > 0 ? (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {subs.map((s) => (
                <li key={s.id}>
                  <Link href={`/categories/${s.id}`} className="flex items-center gap-2 py-2 active:opacity-70">
                    <span>{s.icon}</span>
                    <span className="flex-1 truncate">{s.name}</span>
                    <span className="text-zinc-500">
                      {Number(s.monthly_budget) > 0 ? moneyShort(Number(s.monthly_budget)) : "No budget"}
                    </span>
                    <span className="text-zinc-400">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">Split this up, like Coffee under Food. Their budgets add to this one.</p>
          )}
        </section>
      )}
      <div className="card">
        <CategoryForm
          category={category}
          groups={(groups ?? []) as CategoryGroup[]}
          mains={mains}
          hasSubs={subs.length > 0}
        />
      </div>
      <form action={deleteCategory}>
        <input type="hidden" name="id" value={category.id} />
        <SubmitButton
          className="btn-danger w-full"
          pendingText="Deleting…"
          confirmMessage={`Delete "${category.name}"? If it has transactions it will be archived instead, so your history stays intact. Any sub categories are kept as regular categories.`}
        >
          Delete category
        </SubmitButton>
      </form>
    </div>
  );
}
