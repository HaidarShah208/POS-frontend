"use client";

import { cn } from "@/lib/utils";
import { UtensilsCrossed, ShoppingBag, Truck } from "lucide-react";
import type { OrderType } from "@/types";

const ORDER_TYPES: {
  value: OrderType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "dine-in", label: "Dine in", icon: UtensilsCrossed },
  { value: "takeaway", label: "Takeaway", icon: ShoppingBag },
  { value: "delivery", label: "Delivery", icon: Truck },
];

interface OrderTypeSelectorProps {
  value: OrderType;
  onChange: (value: OrderType) => void;
  className?: string;
}

export function OrderTypeSelector({ value, onChange, className }: OrderTypeSelectorProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {ORDER_TYPES.map((opt) => {
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
