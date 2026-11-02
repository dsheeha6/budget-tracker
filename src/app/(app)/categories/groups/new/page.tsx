import GroupForm from "@/components/GroupForm";
import PageHeader from "@/components/PageHeader";
import { requireUser } from "@/lib/supabase/server";
import type { Category, CategoryGroup } from "@/lib/types";

export default async function NewGroupPage() {
  const { supabase } = await requireUser();
  const [catRes, groupRes] = await Promise.all([
    supabase.from("categories").select("*").eq("archived", false).is("parent_id", null).order("sort_order").order("name"),
    supabase.from("category_groups").select("*").order("sort_order").order("name"),
  ]);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PageHeader title="New folder" back="/categories" />
      <div className="card">
        <GroupForm categories={(catRes.data ?? []) as Category[]} groups={(groupRes.data ?? []) as CategoryGroup[]} />
      </div>
    </div>
  );
}
