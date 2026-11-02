"use client";

import { saveGroup, type FormState } from "@/app/(app)/categories/actions";
import SubmitButton from "@/components/SubmitButton";
import type { Category, CategoryGroup } from "@/lib/types";
import { useFormAction } from "@/lib/useFormAction";

export default function GroupForm({
  group,
  categories,
  groups,
}: {
  group?: CategoryGroup;
  categories: Category[];
  groups: CategoryGroup[];
}) {
  const { state, pending, onSubmit } = useFormAction<FormState>(saveGroup, null);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {group && <input type="hidden" name="id" value={group.id} />}
      <div className="flex gap-3">
        <div className="w-20">
          <label className="label" htmlFor="icon">Icon</label>
          <input id="icon" name="icon" defaultValue={group?.icon ?? "📁"} maxLength={16} className="input text-center text-2xl" />
        </div>
        <div className="flex-1">
          <label className="label" htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            required
            maxLength={50}
            defaultValue={group?.name}
            placeholder="Subscriptions"
            className="input"
            autoFocus={!group}
          />
        </div>
      </div>
      {categories.length > 0 && (
        <fieldset>
          <legend className="label">Categories in this folder</legend>
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {categories.map((c) => {
              const otherFolder = c.group_id !== group?.id ? groups.find((g) => g.id === c.group_id) : undefined;
              return (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2">
                    <input
                      type="checkbox"
                      name="category_ids"
                      value={c.id}
                      defaultChecked={c.group_id === group?.id}
                      className="h-5 w-5 shrink-0 accent-accent"
                    />
                    <span>{c.icon}</span>
                    <span className="flex-1 truncate">{c.name}</span>
                    {otherFolder && <span className="shrink-0 text-xs text-zinc-400">in {otherFolder.name}</span>}
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}
      <p className="text-xs text-zinc-500">
        A folder&apos;s budget is the total of the categories in it. Ticking one that&apos;s in another folder moves it
        here.
      </p>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton pending={pending}>{group ? "Save" : "Create folder"}</SubmitButton>
    </form>
  );
}
