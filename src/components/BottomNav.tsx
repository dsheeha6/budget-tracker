"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/transactions", label: "Spending", icon: "🧾" },
  { href: "/categories", label: "Budgets", icon: "🗂️" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-zinc-800">
      <ul className="mx-auto flex max-w-md">
        {tabs.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 py-2 text-xs ${
                  active ? "font-semibold text-accent" : "text-zinc-500"
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
