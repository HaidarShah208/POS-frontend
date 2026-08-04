"use client";

import { cn } from "@/lib/utils";
import { Banknote, CreditCard, Smartphone } from "lucide-react";
import type { PaymentMethod } from "@/types";

const METHODS: {
  value: PaymentMethod;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "mobile", label: "Mobile", icon: Smartphone },
];

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (v: PaymentMethod) => void;
  className?: string;
}

export function PaymentMethodSelector({ value, onChange, className }: PaymentMethodSelectorProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {METHODS.map((opt) => {
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "pos-touch rounded-xl border px-3 py-4 text-sm font-medium transition-all flex flex-col items-center gap-2",
              value === opt.value
                ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                : "border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] hover:border-[var(--muted-foreground)]/20"
            )}
          >
            <Icon className="h-5 w-5" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
