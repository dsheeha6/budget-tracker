"use client";

import { saveCategory, type FormState } from "@/app/(app)/categories/actions";
import SubmitButton from "@/components/SubmitButton";
import type { Category, CategoryGroup } from "@/lib/types";
import { useFormAction } from "@/lib/useFormAction";

const COLORS = ["#10b981", "#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#ef4444", "#f97316", "#eab308", "#64748b"];

export default function CategoryForm({
  category,
  groups,
  defaultGroupId,
}: {
  category?: Category;
  groups: CategoryGroup[];
  defaultGroupId?: string;
}) {
  const { state, pending, onSubmit } = useFormAction<FormState>(saveCategory, null);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {category && <input type="hidden" name="id" value={category.id} />}

      <div className="flex gap-3">
        <div className="w-20">
          <label className="label" htmlFor="icon">Icon</label>
          <input
            id="icon"
            name="icon"
            defaultValue={category?.icon ?? "💸"}
            maxLength={16}
            className="input text-center text-2xl"
          />
        </div>
        <div className="flex-1">
          <label className="label" htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            required
            maxLength={50}
            defaultValue={category?.name}
            placeholder="Groceries"
            className="input"
            autoFocus={!category}
          />
        </div>
      </div>

      {groups.length > 0 && (
        <div>
          <label className="label" htmlFor="group_id">Folder</label>
          <select
            id="group_id"
            name="group_id"
            defaultValue={category?.group_id ?? defaultGroupId ?? ""}
            className="input"
          >
            <option value="">No folder</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.icon} {g.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="label" htmlFor="monthly_budget">Monthly budget</label>
        <div className="relative">
          <span className="absolute top-1/2 left-4 -translate-y-1/2 text-zinc-500">$</span>
          <input
            id="monthly_budget"
            name="monthly_budget"
            inputMode="decimal"
            defaultValue={category?.monthly_budget || ""}
            placeholder="0"
            className="input pl-8"
          />
        </div>
        {category && (
          <p className="mt-1 text-xs text-zinc-500">Changes apply to this month onward. Past months keep their budget.</p>
        )}
      </div>

      <fieldset>
        <legend className="label">Color</legend>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <label key={c} className="cursor-pointer">
              <input
                type="radio"
                name="color"
                value={c}
                defaultChecked={(category?.color ?? "#6366f1") === c}
                className="peer sr-only"
              />
              <span
                className="block h-9 w-9 rounded-full ring-offset-2 ring-offset-background peer-checked:ring-2 peer-checked:ring-foreground"
                style={{ backgroundColor: c }}
              />
            </label>
          ))}
        </div>
      </fieldset>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <SubmitButton pending={pending}>{category ? "Save" : "Add category"}</SubmitButton>
    </form>
  );
}
