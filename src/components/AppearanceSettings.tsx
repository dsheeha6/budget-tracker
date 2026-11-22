"use client";

import { useState } from "react";
import { THEME_COOKIE, WARN_COOKIE, type ThemeChoice } from "@/lib/theme";

const YEAR = 60 * 60 * 24 * 365;
const setCookie = (name: string, value: string) => {
  document.cookie = `${name}=${value}; path=/; max-age=${YEAR}; samesite=lax`;
};

const OPTIONS: { value: ThemeChoice; label: string; icon: React.ReactNode }[] = [
  {
    value: "system",
    label: "Match phone",
    icon: <path d="M8 3.5h8c.8 0 1.5.7 1.5 1.5v14c0 .8-.7 1.5-1.5 1.5H8c-.8 0-1.5-.7-1.5-1.5V5c0-.8.7-1.5 1.5-1.5zM11 17.5h2" />,
  },
  {
    value: "light",
    label: "Light",
    icon: (
      <path d="M12 8.2a3.8 3.8 0 1 0 .1 0zM12 2.8v2.2M12 19v2.2M2.8 12H5M19 12h2.2M5.5 5.5l1.6 1.6M16.9 16.9l1.6 1.6M5.5 18.5l1.6-1.6M16.9 7.1l1.6-1.6" />
    ),
  },
  { value: "dark", label: "Dark", icon: <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" /> },
];

/** Match phone / Light / Dark. Saved on this device; the page reloads to repaint. */
export function AppearancePicker({ current }: { current: ThemeChoice }) {
  return (
    <section className="card space-y-3">
      <h2 className="text-lg">Appearance</h2>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((o) => {
          const selected = o.value === current;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                if (selected) return;
                setCookie(THEME_COOKIE, o.value);
                window.location.reload();
              }}
              className={`ink flex flex-col items-center gap-1 px-1 py-3 text-center text-[13px] leading-tight ${
                selected ? "font-hand font-bold" : "font-medium text-ink-soft"
              }`}
              style={
                {
                  "--ink-fill": selected ? "var(--blue-tint)" : "var(--card)",
                  "--ink-shadow": selected ? "3px" : "0px",
                  "--ink-width": selected ? "2.5px" : "1.8px",
                  "--ink-radius": "14px",
                } as React.CSSProperties
              }
            >
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                strokeWidth={selected ? 2.2 : 1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                {o.icon}
              </svg>
              {o.label}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-ink-soft">Follows your phone&apos;s light or dark setting. Pick Light or Dark to lock it.</p>
    </section>
  );
}

/** Penny's check-in before adding to a category that's over (or about to go over). */
export function WarnToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  return (
    <section className="card">
      <h2 className="mb-2 text-lg">Penny</h2>
      <label className="flex cursor-pointer items-center gap-3">
        <span className="flex-1">
          <span className="block font-semibold">Warn me before I go over</span>
          <span className="block text-sm text-ink-soft">Penny checks in when a purchase would bust a category.</span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          onClick={() => {
            setOn(!on);
            setCookie(WARN_COOKIE, on ? "off" : "on");
          }}
          className="ink h-8 w-14 shrink-0"
          style={
            {
              "--ink-fill": on ? "var(--blue)" : "var(--card)",
              "--ink-radius": "999px",
              "--ink-shadow": "0px",
              "--ink-width": "2px",
            } as React.CSSProperties
          }
        >
          <span
            className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-ink transition-all ${
              on ? "left-[calc(100%-1.6rem)] bg-on-accent" : "left-1.5 bg-ink-soft"
            }`}
          />
        </button>
      </label>
    </section>
  );
}
