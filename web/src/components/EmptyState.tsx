import { type ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="card p-8 text-center">
      <p className="font-display text-lg">{title}</p>
      {description && (
        <p className="mt-2 text-sm text-ink-mute max-w-md mx-auto text-pretty">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
