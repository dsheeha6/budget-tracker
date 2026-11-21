import { notFound } from "next/navigation";
import GoalForm from "@/components/GoalForm";
import PageHeader from "@/components/PageHeader";
import SubmitButton from "@/components/SubmitButton";
import { requireUser } from "@/lib/supabase/server";
import type { SavingsGoal } from "@/lib/types";
import { deleteGoal, setGoalArchived } from "../../actions";

export default async function EditGoalPage({ params }: PageProps<"/goals/[id]/edit">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const { data } = await supabase.from("savings_goals").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const goal = data as SavingsGoal;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PageHeader title="Edit goal" back={`/goals/${goal.id}`} />
      <div className="card">
        <GoalForm goal={goal} />
      </div>
      <form action={setGoalArchived}>
        <input type="hidden" name="id" value={goal.id} />
        <input type="hidden" name="archived" value={goal.archived ? "false" : "true"} />
        <SubmitButton className="btn-secondary w-full">{goal.archived ? "Unarchive goal" : "Archive goal"}</SubmitButton>
      </form>
      <form action={deleteGoal}>
        <input type="hidden" name="id" value={goal.id} />
        <SubmitButton
          className="btn-danger w-full"
          pendingText="Deleting…"
          confirmMessage={`Delete "${goal.name}" and everything put toward it? This can't be undone.`}
        >
          Delete goal
        </SubmitButton>
      </form>
    </div>
  );
}
