"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/transactions", label: "Spending", icon: "🧾" },
  { href: "/categories", label: "Budgets", icon: "🗂️" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

// Tab bar along the bottom on phones, sidebar on the left on desktop.
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:w-56 lg:border-t-0 lg:border-r lg:pb-0 dark:border-zinc-800">
      <div className="hidden items-center gap-2 px-6 pt-6 pb-4 text-lg font-bold lg:flex">
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny static icon */}
        <img src="/icon-192.png" alt="" className="h-8 w-8 rounded-lg" />
        Budget
      </div>
      <ul className="mx-auto flex max-w-md lg:max-w-none lg:flex-col lg:gap-1 lg:px-3">
        {tabs.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 py-2 text-xs lg:flex-row lg:gap-3 lg:rounded-xl lg:px-3 lg:py-2.5 lg:text-sm ${
                  active
                    ? "font-semibold text-accent lg:bg-accent/10"
                    : "text-zinc-500 lg:hover:bg-zinc-100 lg:dark:hover:bg-zinc-800"
                }`}
              >
                <span className={`text-xl ${active ? "" : "opacity-60 grayscale"}`}>{tab.icon}</span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
