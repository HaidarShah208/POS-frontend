"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.12 }}
      className="pos-touch pos-touch-area w-full text-left rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-sm)] overflow-hidden min-h-[112px] flex flex-col select-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 hover:border-[var(--accent)]/40 hover:shadow-md active:shadow-sm transition-all duration-200"
      onClick={() => onAdd(product)}
    >
      {/* Image or placeholder */}
      <div className="relative h-16 w-full bg-[var(--muted)]/60 shrink-0">
        {product.image ? (
          <img
            src={product.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[var(--muted-foreground)]/50">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-3">
        <p className="font-semibold text-sm text-[var(--foreground)] leading-tight line-clamp-2">
          {product.name}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-base font-bold text-[var(--accent)] tabular-nums">
            {formatCurrency(product.price)}
          </span>
           
        </div>
      </div>
    </motion.button>
  );
}
