"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";

// Doodle icons, drawn on a 24×24 grid.
const tabs = [
  { href: "/", label: "Home", d: "M4 11.5 12 4.5l8 7M6.5 10v9.5h11V10M10 19.5v-5h4v5" },
  {
    href: "/transactions",
    label: "Spending",
    d: "M6 3.5h12v17l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5zM9 8h6M9 11.5h6M9 15h3.5",
  },
  {
    href: "/categories",
    label: "Budgets",
    d: "M3.5 7.2c0-1.3.8-2.1 2-2.1h4l2 2.2h7c1.2 0 2 .8 2 2v8.5c0 1.2-.8 2-2 2h-13c-1.2 0-2-.8-2-2z",
  },
  {
    href: "/goals",
    label: "Goals",
    d: "M12 3.6a8.4 8.4 0 1 0 .1 0zM12 7.4a4.6 4.6 0 1 0 .1 0zM12 11a1 1 0 1 0 .1 0zM12 12l6.5-6.6M16 4.8l2.6.6.6 2.6",
  },
  { href: "/settings", label: "Settings", d: "M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4" },
];

// Tab bar along the bottom on phones, sidebar on the left on desktop.
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t-[2.5px] border-ink bg-card pb-[env(safe-area-inset-bottom)] lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:w-56 lg:border-t-0 lg:border-r-[2.5px] lg:pb-0">
      <div className="hidden items-center gap-2 px-6 pt-6 pb-4 lg:flex">
        <Logo size={36} />
      </div>
      <ul className="mx-auto flex max-w-md px-1 pt-1 lg:max-w-none lg:flex-col lg:gap-1 lg:px-3">
        {tabs.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`${active ? "ink font-hand font-bold text-ink" : "font-medium text-ink-soft"} mx-0.5 my-1 flex flex-col items-center gap-0.5 py-1.5 text-[11px] lg:flex-row lg:gap-3 lg:px-3 lg:py-2.5 lg:text-sm`}
                style={
                  active
                    ? ({
                        "--ink-fill": "var(--blue-tint)",
                        "--ink-radius": "14px",
                        "--ink-shadow": "0px",
                        "--ink-width": "2px",
                      } as React.CSSProperties)
                    : undefined
                }
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={active ? 2.2 : 1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d={tab.d} />
                </svg>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
