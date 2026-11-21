import GoalForm from "@/components/GoalForm";
import PageHeader from "@/components/PageHeader";
import { requireUser } from "@/lib/supabase/server";

export default async function NewGoalPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PageHeader title="New goal" back="/goals" />
      <div className="card">
        <GoalForm />
      </div>
    </div>
  );
}
