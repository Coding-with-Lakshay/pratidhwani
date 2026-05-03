interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}

export function Logo({ size = 32, withWordmark = false, className }: LogoProps) {
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        aria-hidden="true"
        style={{ display: "block" }}
      >
        <rect width="64" height="64" rx="14" fill="currentColor" opacity="0.06" />
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        >
          <path d="M14 38 Q22 22 32 32 T50 26" />
          <path d="M14 46 Q22 30 32 40 T50 34" opacity="0.6" />
          <path d="M14 30 Q22 14 32 24 T50 18" opacity="0.3" />
        </g>
        <circle cx="50" cy="26" r="3" fill="var(--accent)" />
      </svg>
      {withWordmark && (
        <span className="font-display text-[1.05rem] tracking-tight font-medium leading-none">
          Pratidhwani
        </span>
      )}
    </span>
  );
}
