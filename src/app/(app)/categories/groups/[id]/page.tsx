import { notFound } from "next/navigation";
import GroupForm from "@/components/GroupForm";
import PageHeader from "@/components/PageHeader";
import SubmitButton from "@/components/SubmitButton";
import { requireUser } from "@/lib/supabase/server";
import type { CategoryGroup } from "@/lib/types";
import { deleteGroup } from "../../actions";

export default async function EditGroupPage({ params }: PageProps<"/categories/groups/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const { data } = await supabase.from("category_groups").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const group = data as CategoryGroup;

  return (
    <div className="space-y-4">
      <PageHeader title="Edit folder" back="/categories" />
      <div className="card">
        <GroupForm group={group} />
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
