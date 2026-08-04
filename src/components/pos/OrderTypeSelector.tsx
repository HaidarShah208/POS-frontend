"use client";

import { cn } from "@/lib/utils";
import { UtensilsCrossed, ShoppingBag, Truck, Car } from "lucide-react";
import type { OrderType } from "@/types";

const ORDER_TYPES: {
  value: OrderType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}[] = [
  { value: "dine-in", label: "Dine In", icon: UtensilsCrossed, description: "Eat at restaurant" },
  { value: "takeaway", label: "Takeaway", icon: ShoppingBag, description: "Pick up at counter" },
  { value: "delivery", label: "Delivery", icon: Truck, description: "Deliver to address" },
  { value: "drive-through", label: "Drive Thru", icon: Car, description: "Collect at window" },
];

interface OrderTypeSelectorProps {
  value: OrderType;
  onChange: (value: OrderType) => void;
  className?: string;
}

export function OrderTypeSelector({ value, onChange, className }: OrderTypeSelectorProps) {
  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-2", className)}>
      {ORDER_TYPES.map((opt) => {
        const Icon = opt.icon;
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "pos-touch rounded-xl border px-3 py-4 text-sm font-medium transition-all flex flex-col items-center gap-1.5",
              isActive
                ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                : "border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] hover:border-[var(--muted-foreground)]/20"
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{opt.label}</span>
            <span className={cn("text-[10px]", isActive ? "text-white/70" : "text-[var(--muted-foreground)]")}>
              {opt.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
