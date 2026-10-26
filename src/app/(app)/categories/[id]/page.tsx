import { notFound } from "next/navigation";
import CategoryForm from "@/components/CategoryForm";
import PageHeader from "@/components/PageHeader";
import SubmitButton from "@/components/SubmitButton";
import { requireUser } from "@/lib/supabase/server";
import type { Category, CategoryGroup } from "@/lib/types";
import { deleteCategory } from "../actions";

export default async function EditCategoryPage({ params }: PageProps<"/categories/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const [{ data }, { data: groups }] = await Promise.all([
    supabase.from("categories").select("*").eq("id", id).maybeSingle(),
    supabase.from("category_groups").select("*").order("sort_order").order("name"),
  ]);
  if (!data) notFound();
  const category = data as Category;

  return (
    <div className="space-y-4">
      <PageHeader title="Edit category" back="/categories" />
      <div className="card">
        <CategoryForm category={category} groups={(groups ?? []) as CategoryGroup[]} />
      </div>
      <form action={deleteCategory}>
        <input type="hidden" name="id" value={category.id} />
        <SubmitButton
          className="btn-danger w-full"
          pendingText="Deleting…"
          confirmMessage={`Delete "${category.name}"? If it has transactions it will be archived instead, so your history stays intact.`}
        >
          Delete category
        </SubmitButton>
      </form>
    </div>
  );
}
