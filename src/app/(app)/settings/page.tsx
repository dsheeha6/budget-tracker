import IncomeForm from "@/components/IncomeForm";
import OverallBudgetForm from "@/components/OverallBudgetForm";
import SubmitButton from "@/components/SubmitButton";
import { requireUser } from "@/lib/supabase/server";
import { signOut } from "./actions";

export default async function SettingsPage() {
  const { supabase } = await requireUser();
  const [{ data: profile }, { data: userData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("is_pro, monthly_budget, pay_amount, pay_frequency, retirement_per_paycheck, tax_per_paycheck")
      .single(),
    supabase.auth.getUser(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>

      {profile && (
        <section className="card">
          <IncomeForm profile={profile} />
        </section>
      )}

      <section className="card">
        <OverallBudgetForm current={profile?.monthly_budget != null ? Number(profile.monthly_budget) : null} />
      </section>

      <section className="card space-y-3">
        <div className="flex justify-between">
          <span className="text-zinc-500">Signed in as</span>
          <span className="truncate pl-4 font-medium">{userData.user?.email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Plan</span>
          <span className="font-medium">{profile?.is_pro ? "Pro ✨" : "Free"}</span>
        </div>
      </section>

      <form action={signOut}>
        <SubmitButton className="btn-secondary w-full" pendingText="Signing out…">
          Sign out
        </SubmitButton>
      </form>
    </div>
  );
}
