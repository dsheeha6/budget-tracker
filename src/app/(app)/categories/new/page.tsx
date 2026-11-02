import CategoryForm from "@/components/CategoryForm";
import PageHeader from "@/components/PageHeader";
import { requireUser } from "@/lib/supabase/server";
import type { Category, CategoryGroup } from "@/lib/types";

export default async function NewCategoryPage({ searchParams }: PageProps<"/categories/new">) {
  const { supabase } = await requireUser();
  const { group, parent } = await searchParams;
  const [groupRes, mainRes] = await Promise.all([
    supabase.from("category_groups").select("*").order("sort_order").order("name"),
    supabase.from("categories").select("*").eq("archived", false).is("parent_id", null).order("sort_order").order("name"),
  ]);
  const defaultParentId = typeof parent === "string" ? parent : undefined;

  return (
    <div className="space-y-4">
      <PageHeader
        title={defaultParentId ? "New sub category" : "New category"}
        back={defaultParentId ? `/categories/${defaultParentId}` : "/categories"}
      />
      <div className="card">
        <CategoryForm
          groups={(groupRes.data ?? []) as CategoryGroup[]}
          defaultGroupId={typeof group === "string" ? group : undefined}
          mains={(mainRes.data ?? []) as Category[]}
          defaultParentId={defaultParentId}
        />
      </div>
    </div>
  );
}
