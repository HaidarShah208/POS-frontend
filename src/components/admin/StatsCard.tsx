"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type TrendDirection = "up" | "down" | "neutral";

type StatsCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: string; direction: TrendDirection };
  animate?: boolean;
  className?: string;
};

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const start = prev.current;
    const end = value;
    const duration = 600;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
      else prev.current = end;
    }

    requestAnimationFrame(tick);
  }, [value]);

  return <>{display.toLocaleString()}</>;
}

export function StatsCard(p: StatsCardProps) {
  const numericValue = typeof p.value === "number" ? p.value : null;

  return (
    <Card
      className={cn(
        "overflow-hidden transition-shadow hover:shadow-[var(--shadow-md)]",
        p.className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--muted-foreground)]">
              {p.title}
            </p>
            <p className="text-2xl font-bold mt-1.5 tracking-tight">
              {p.animate && numericValue !== null ? (
                <AnimatedNumber value={numericValue} />
              ) : (
                p.value
              )}
            </p>
            <div className="flex items-center gap-2 mt-1.5 min-h-[1.125rem]">
              {p.trend && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-xs font-medium",
                    p.trend.direction === "up" && "text-emerald-600",
                    p.trend.direction === "down" && "text-red-500",
                    p.trend.direction === "neutral" && "text-[var(--muted-foreground)]"
                  )}
                >
                  {p.trend.direction === "up" && <TrendingUp className="h-3 w-3" />}
                  {p.trend.direction === "down" && <TrendingDown className="h-3 w-3" />}
                  {p.trend.value}
                </span>
              )}
              {p.subtitle && (
                <p className="text-xs text-[var(--muted-foreground)] truncate">
                  {p.subtitle}
                </p>
              )}
            </div>
          </div>
          {p.icon != null && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)]">
              {p.icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
