import Link from "next/link";

// Screen title with an optional back arrow (44×44 tap target, iOS guideline).
export default function PageHeader({ title, back }: { title: string; back?: string }) {
  return (
    <header className="flex items-center gap-1">
      {back && (
        <Link
          href={back}
          aria-label="Back"
          className="no-callout -ml-3 flex h-11 w-11 items-center justify-center text-3xl text-zinc-500 active:opacity-60"
        >
          ‹
        </Link>
      )}
      <h1 className="text-2xl font-bold">{title}</h1>
    </header>
  );
}
