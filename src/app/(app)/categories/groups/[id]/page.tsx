import { notFound } from "next/navigation";
import GroupForm from "@/components/GroupForm";
import PageHeader from "@/components/PageHeader";
import SubmitButton from "@/components/SubmitButton";
import { requireUser } from "@/lib/supabase/server";
import type { Category, CategoryGroup } from "@/lib/types";
import { deleteGroup } from "../../actions";

export default async function EditGroupPage({ params }: PageProps<"/categories/groups/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const [catRes, groupRes] = await Promise.all([
    supabase.from("categories").select("*").eq("archived", false).is("parent_id", null).order("sort_order").order("name"),
    supabase.from("category_groups").select("*").order("sort_order").order("name"),
  ]);
  const groups = (groupRes.data ?? []) as CategoryGroup[];
  const group = groups.find((g) => g.id === id);
  if (!group) notFound();

  return (
    <div className="space-y-4">
      <PageHeader title="Edit folder" back="/categories" />
      <div className="card">
        <GroupForm group={group} categories={(catRes.data ?? []) as Category[]} groups={groups} />
      </div>
      <form action={deleteGroup}>
        <input type="hidden" name="id" value={group.id} />
        <SubmitButton
          className="btn-danger w-full"
          pendingText="Deleting…"
          confirmMessage={`Delete the "${group.name}" folder? The categories in it are kept, just no longer in a folder.`}
        >
          Delete folder
        </SubmitButton>
      </form>
    </div>
  );
}
