interface ApiBadgeProps {
  isLive: boolean;
  isFetching?: boolean;
}

export function ApiBadge({ isLive, isFetching }: ApiBadgeProps) {
  return (
    <span
      className="pill"
      style={{
        color: isLive ? "var(--signal-ok)" : "var(--signal-cost)",
        borderColor: "currentColor",
      }}
      aria-live="polite"
    >
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full"
        style={{
          background: "currentColor",
          animation: isFetching ? "pulseSoft 1.2s ease-in-out infinite" : undefined,
        }}
      />
      {isLive ? "live" : "demo data"}
    </span>
  );
}
