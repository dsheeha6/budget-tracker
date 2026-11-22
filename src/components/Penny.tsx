// Penny, the piggy-bank mascot. Rubber-hose style; keeps her own ink colors so
// she reads the same on light and dark paper.
const INK = "#2A2521";
const BODY = "#DDAA3B";

export default function Penny({
  mood = "happy",
  size = 88,
  className = "",
}: {
  mood?: "happy" | "worried";
  size?: number;
  className?: string;
}) {
  const worried = mood === "worried";
  return (
    <svg
      viewBox="0 0 300 300"
      width={size}
      height={size}
      fill="none"
      className={`penny-sticker shrink-0 ${className}`}
      role="img"
      aria-label={worried ? "Penny looking worried" : "Penny the pig"}
    >
      <g stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M112 228c-4 22-14 34-30 36" />
        <path d="M188 230c6 20 16 30 32 32" />
        <path d="M66 268c6-8 22-10 32-4 4 6-2 10-12 10H70c-6 0-7-3-4-6z" fill={INK} />
        <path d="M206 266c6-8 22-10 32-4 4 6-2 10-12 10h-16c-6 0-7-3-4-6z" fill={INK} />
        <path d="M150 70c58-2 102 34 104 84 2 52-44 84-104 84S44 206 46 152c2-48 46-80 104-82z" fill={BODY} />
        <path d="M84 96 72 56c14 0 30 8 38 24" fill={BODY} />
        <path d="M214 94l14-38c-16 0-30 8-38 22" fill={BODY} />
        <path d="M128 84c8-3 34-3 44 0" />
        <path d="M120 160c-2-14 8-26 30-26s32 12 30 26c-2 14-14 20-30 20s-28-6-30-20z" fill="#F1D3CB" />
        <path d="M140 150v12M160 150v12" />
        {worried ? (
          <>
            <path d="M132 200c10-8 26-8 36 0" />
            <path d="M104 102l24 8M196 102l-24 8" />
            <path d="M54 150c-24-8-30-30-18-46" />
            <circle cx="40" cy="96" r="13" fill="#FFFFFF" />
            <path d="M246 150c24-8 30-30 18-46" />
            <circle cx="260" cy="96" r="13" fill="#FFFFFF" />
            <path d="M234 84c4-10 10-14 16-10-2 8-8 12-16 10z" fill="#8BA7CF" />
          </>
        ) : (
          <>
            <path d="M128 194c12 12 32 12 44 0" />
            <path d="M54 160c-26 2-40-14-36-34" />
            <circle cx="18" cy="118" r="13" fill="#FFFFFF" />
            <path d="M246 156c22-4 32-22 28-42" />
            <circle cx="276" cy="104" r="13" fill="#FFFFFF" />
            <path d="M252 186c18 4 26 16 18 26-6 6-14 0-8-6" />
          </>
        )}
      </g>
      <ellipse cx="118" cy={worried ? 128 : 124} rx="9" ry={worried ? 12 : 13} fill={INK} />
      <ellipse cx="182" cy={worried ? 128 : 124} rx="9" ry={worried ? 12 : 13} fill={INK} />
      <path d={worried ? "M115 121l7-4v9z" : "M115 116l7-4v10z"} fill="#FFFFFF" />
      <path d={worried ? "M179 121l7-4v9z" : "M179 116l7-4v10z"} fill="#FFFFFF" />
      {!worried && <path d="M88 150c6 4 6 10 0 12M212 150c-6 4-6 10 0 12" stroke="#C2553F" strokeWidth={4} strokeLinecap="round" />}
    </svg>
  );
}
