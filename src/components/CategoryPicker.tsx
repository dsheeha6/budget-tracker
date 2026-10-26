"use client";

import type { Category } from "@/lib/types";

// Grid of big category buttons; one tap picks.
export default function CategoryPicker({
  categories,
  value,
  onChange,
}: {
  categories: Category[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {categories.map((c) => {
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
  );
}
