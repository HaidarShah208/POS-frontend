"use client";

import { cn } from "@/lib/utils";
import type { OrderType } from "@/types";

const ORDER_TYPES: { value: OrderType; label: string }[] = [
  { value: "dine-in", label: "Dine in" },
  { value: "takeaway", label: "Takeaway" },
  { value: "delivery", label: "Delivery" },
];

interface OrderTypeSelectorProps {
  value: OrderType;
  onChange: (value: OrderType) => void;
  className?: string;
}

export function OrderTypeSelector({ value, onChange, className }: OrderTypeSelectorProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {ORDER_TYPES.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "pos-touch rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
            value === opt.value
              ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)]"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
