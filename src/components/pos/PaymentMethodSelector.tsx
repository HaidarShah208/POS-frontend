"use client";

import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/types";

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "mobile", label: "Mobile" },
];

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (v: PaymentMethod) => void;
  className?: string;
}

export function PaymentMethodSelector({ value, onChange, className }: PaymentMethodSelectorProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      {METHODS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "pos-touch rounded-lg border px-3 py-2.5 text-sm font-medium",
            value === opt.value
              ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "border-[var(--border)] hover:bg-[var(--muted)]"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
