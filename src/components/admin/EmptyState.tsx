"use client";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState(props: EmptyStateProps) {
  const { title, description, icon, action, className } = props;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)]/30 py-12 px-4 text-center",
        className
      )}
    >
      {icon && <div className="mb-4 text-[var(--muted-foreground)]">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-[var(--muted-foreground)] max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
