"use client";

import type { Category, CategoryGroup } from "@/lib/types";

// Grid of big category buttons; one tap picks. Categories in folders are
// listed under the folder's name.
export default function CategoryPicker({
  categories,
  groups = [],
  value,
  onChange,
}: {
  categories: Category[];
  groups?: CategoryGroup[];
  value: string;
  onChange: (id: string) => void;
}) {
  const groupIds = new Set(groups.map((g) => g.id));
  const loose = categories.filter((c) => !c.group_id || !groupIds.has(c.group_id));
  const sections = [
    { key: "loose", title: null as string | null, items: loose },
    ...groups.map((g) => ({
      key: g.id,
      title: `${g.icon} ${g.name}`,
      items: categories.filter((c) => c.group_id === g.id),
    })),
  ].filter((s) => s.items.length > 0);

  return (
    <div className="space-y-3">
      {sections.map((section) => (
        <div key={section.key}>
          {section.title && <div className="mb-1 px-1 text-xs font-medium text-zinc-500">{section.title}</div>}
          <div className="grid grid-cols-3 gap-2">
            {section.items.map((c) => {
              const selected = c.id === value;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onChange(c.id)}
                  aria-pressed={selected}
                  className={`flex min-h-16 flex-col items-center justify-center rounded-xl border-2 px-1 py-2 text-xs font-medium ${
                    selected ? "border-accent bg-accent/10" : "border-transparent bg-card"
                  }`}
                >
                  <span className="text-2xl">{c.icon}</span>
                  <span className="line-clamp-1">{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
