"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatsCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
};

export function StatsCard(p: StatsCardProps) {
  return (
    <Card className={cn("overflow-hidden", p.className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-[var(--muted-foreground)]">{p.title}</p>
            <p className="text-2xl font-bold mt-1">{p.value}</p>
            {p.subtitle && <p className="text-xs text-[var(--muted-foreground)] mt-1">{p.subtitle}</p>}
          </div>
          {p.icon != null ? <div className="text-[var(--muted-foreground)]">{p.icon}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}
