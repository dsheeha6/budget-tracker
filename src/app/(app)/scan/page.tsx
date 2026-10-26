import { redirect } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import ReceiptScanner from "@/components/ReceiptScanner";
import { today } from "@/lib/dates";
import { requireUser } from "@/lib/supabase/server";
import type { Category, CategoryGroup } from "@/lib/types";

export default async function ScanPage() {
  const { supabase } = await requireUser();
  const [{ data: profile }, { data }, { data: groups }] = await Promise.all([
    supabase.from("profiles").select("is_pro").single(),
    supabase.from("categories").select("*").eq("archived", false).order("sort_order").order("name"),
    supabase.from("category_groups").select("*").order("sort_order").order("name"),
  ]);
  const categories = (data ?? []) as Category[];

  if (!profile?.is_pro) {
    return (
      <div className="space-y-4">
        <PageHeader title="Scan receipt" back="/" />
        <div className="card space-y-2 text-center">
          <div className="text-4xl">✨</div>
          <h2 className="text-lg font-semibold">A Pro feature</h2>
          <p className="text-sm text-zinc-500">
            Receipt scanning reads the store, items, and total from a photo. It&apos;s part of Pro.
          </p>
        </div>
      </div>
    );
  }
  if (categories.length === 0) redirect("/categories/new");

  return (
    <div className="space-y-4">
      <PageHeader title="Scan receipt" back="/" />
      <ReceiptScanner categories={categories} groups={(groups ?? []) as CategoryGroup[]} today={today()} />
    </div>
  );
}
