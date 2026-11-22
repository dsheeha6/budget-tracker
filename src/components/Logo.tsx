// The "penny" wordmark: groovy ink lettering over a mustard marker swoosh.
export default function Logo({ size = 34, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`relative inline-block leading-none ${className}`} style={{ fontSize: size }}>
      <svg
        viewBox="0 0 200 24"
        preserveAspectRatio="none"
        className="absolute right-[-4%] bottom-[2%] left-[-2%] h-[0.32em] w-[106%] text-brand-yellow"
        fill="none"
        aria-hidden
      >
        <path d="M4 15c40-8 82-10 122-6 26 2 48 3 70-4" stroke="currentColor" strokeWidth={11} strokeLinecap="round" />
      </svg>
      <span className="relative font-logo text-ink">penny</span>
    </span>
  );
}
