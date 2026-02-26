"use client";

import { cn } from "@/lib/utils";

interface TokenDisplayProps {
  token: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function TokenDisplay({ token, size = "lg", className }: TokenDisplayProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-bold bg-(--accent) text-(--accent-foreground)",
        size === "sm" && "text-2xl px-4 py-2",
        size === "md" && "text-4xl px-6 py-3",
        size === "lg" && "text-5xl px-8 py-4",
        className
      )}
    >
      {token}
    </div>
  );
}
