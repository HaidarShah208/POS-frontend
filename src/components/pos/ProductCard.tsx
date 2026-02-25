"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.1 }}
    >
      <Card
        className="pos-touch pos-touch-area cursor-pointer overflow-hidden transition-shadow hover:shadow-md active:scale-[0.98] min-h-[120px] flex flex-col select-none"
        onClick={() => onAdd(product)}
      >
        <CardContent className="flex flex-1 flex-col justify-center p-4">
          <p className="font-semibold text-[var(--foreground)]">{product.name}</p>
          <p className="mt-1 text-lg font-bold text-[var(--accent)]">
            {formatCurrency(product.price)}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
