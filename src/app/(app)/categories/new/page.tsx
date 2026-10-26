import CategoryForm from "@/components/CategoryForm";
import PageHeader from "@/components/PageHeader";
import { requireUser } from "@/lib/supabase/server";
import type { CategoryGroup } from "@/lib/types";

export default async function NewCategoryPage({ searchParams }: PageProps<"/categories/new">) {
  const { supabase } = await requireUser();
  const { group } = await searchParams;
  const { data } = await supabase.from("category_groups").select("*").order("sort_order").order("name");

  return (
    <div className="space-y-4">
      <PageHeader title="New category" back="/categories" />
      <div className="card">
        <CategoryForm
          groups={(data ?? []) as CategoryGroup[]}
          defaultGroupId={typeof group === "string" ? group : undefined}
        />
      </div>
    </div>
  );
}
