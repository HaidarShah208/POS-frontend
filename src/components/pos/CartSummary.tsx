"use client";

import { formatCurrency } from "@/lib/utils";

interface CartSummaryProps {
  subtotal: number;
  tax: number;
  discountAmount: number;
  grandTotal: number;
  className?: string;
}

export function CartSummary({ subtotal, tax, discountAmount, grandTotal, className }: CartSummaryProps) {
  return (
    <div className={className}>
      <div className="flex justify-between text-sm">
        <span className="text-(--muted-foreground)">Subtotal</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-(--muted-foreground)">Tax</span>
        <span>{formatCurrency(tax)}</span>
      </div>
      {discountAmount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-(--muted-foreground)">Discount</span>
          <span className="text-(--destructive)">-{formatCurrency(discountAmount)}</span>
        </div>
      )}
      <div className="flex justify-between font-semibold text-lg pt-2 border-t border-(--border) mt-2">
        <span>Total</span>
        <span>{formatCurrency(grandTotal)}</span>
      </div>
    </div>
  );
}
