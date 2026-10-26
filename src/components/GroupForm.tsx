"use client";

import { saveGroup, type FormState } from "@/app/(app)/categories/actions";
import SubmitButton from "@/components/SubmitButton";
import type { CategoryGroup } from "@/lib/types";
import { useFormAction } from "@/lib/useFormAction";

export default function GroupForm({ group }: { group?: CategoryGroup }) {
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
      <p className="text-xs text-zinc-500">
        A folder&apos;s budget is the total of the categories in it. Put a category in a folder from the category&apos;s
        edit screen.
      </p>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton pending={pending}>{group ? "Save" : "Create folder"}</SubmitButton>
    </form>
  );
}
