import Link from "next/link";
import { addMonths, currentMonth, monthLabel } from "@/lib/dates";

const arrowClass =
  "no-callout flex h-11 w-11 items-center justify-center rounded-full text-3xl text-zinc-500 active:bg-zinc-200 dark:active:bg-zinc-800";

// ‹ October 2026 › — links keep any other query params (like a category filter).
export default function MonthSwitcher({
  month,
  basePath,
  params = {},
}: {
  month: string;
  basePath: string;
  params?: Record<string, string>;
}) {
  const href = (m: string) => {
    const query = new URLSearchParams(params);
    if (m !== currentMonth()) query.set("m", m);
    const qs = query.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const isCurrent = month === currentMonth();

  return (
    <div className="flex items-center justify-between">
      <Link href={href(addMonths(month, -1))} className={arrowClass} aria-label="Previous month">
        ‹
      </Link>
      <div className="text-center">
        <div className="text-lg font-semibold">{monthLabel(month)}</div>
        {!isCurrent && (
          <Link href={href(currentMonth())} className="text-xs text-accent">
            Back to this month
          </Link>
        )}
      </div>
      <Link href={href(addMonths(month, 1))} className={arrowClass} aria-label="Next month">
        ›
      </Link>
    </div>
  );
}
