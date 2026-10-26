import Link from "next/link";
import { notFound } from "next/navigation";
import CategoryForm from "@/components/CategoryForm";
import SubmitButton from "@/components/SubmitButton";
import { requireUser } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import { deleteCategory } from "../actions";

export default async function EditCategoryPage({ params }: PageProps<"/categories/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const { data } = await supabase.from("categories").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const category = data as Category;

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-2">
        <Link href="/categories" className="px-1 text-2xl text-zinc-500" aria-label="Back">‹</Link>
        <h1 className="text-2xl font-bold">Edit category</h1>
      </header>
      <div className="card">
        <CategoryForm category={category} />
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
