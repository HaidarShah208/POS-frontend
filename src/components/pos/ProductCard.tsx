"use client";

import { motion } from "framer-motion";
import { cn, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import type { Product, InventoryItem } from "@/types/api/index";

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
  stock?: InventoryItem;
}

export function ProductCard({ product, onAdd, stock }: ProductCardProps) {
  const isOut = stock && stock.currentStock <= 0;
  const isLow =
    stock &&
    !isOut &&
    stock.currentStock <= (stock.lowStockThreshold ?? 10);
  const modifierCount = product.modifiers?.length ?? 0;

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.12 }}
      disabled={!!isOut}
      className={cn(
        "pos-touch pos-touch-area w-full text-left rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-sm)] overflow-hidden min-h-[112px] flex flex-col select-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 hover:border-[var(--accent)]/40 hover:shadow-md active:shadow-sm transition-all duration-200",
        isOut && "opacity-50 cursor-not-allowed hover:shadow-[var(--shadow-sm)] hover:border-[var(--border)]"
      )}
      onClick={() => !isOut && onAdd(product)}
    >
      <div className="relative h-20 w-full bg-[var(--muted)]/60 shrink-0">
        {product.image ? (
          <img
            src={product.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[var(--muted-foreground)]/50">
            <Package className="h-8 w-8" />
          </div>
        )}
        {isOut && (
          <Badge
            variant="destructive"
            className="absolute top-1.5 right-1.5 text-[10px] px-1.5 py-0 h-4"
          >
            Out of stock
          </Badge>
        )}
        {isLow && (
          <Badge
            variant="warning"
            className="absolute top-1.5 right-1.5 text-[10px] px-1.5 py-0 h-4"
          >
            {stock!.currentStock} left
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-3">
        <p className="font-semibold text-sm text-[var(--foreground)] leading-tight line-clamp-2">
          {product.name}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-base font-bold text-[var(--accent)] tabular-nums">
            {formatCurrency(product.price)}
          </span>
          {modifierCount > 0 && (
            <span className="text-[11px] text-[var(--muted-foreground)]">
              +{modifierCount} opt
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
