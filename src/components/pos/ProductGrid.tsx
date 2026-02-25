"use client";

import { useRef, useEffect } from "react";
import { ProductCard } from "./ProductCard";
import type { Product, Category } from "@/types";

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  activeCategoryId: string | null;
  categoryIdToScroll: string | null;
  onAddToCart: (product: Product) => void;
}

const categoryName = (categories: Category[], id: string) =>
  categories.find((c) => c.id === id)?.name ?? id;

export function ProductGrid({
  products,
  categories,
  activeCategoryId,
  categoryIdToScroll,
  onAddToCart,
}: ProductGridProps) {
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (categoryIdToScroll && sectionRefs.current[categoryIdToScroll]) {
      sectionRefs.current[categoryIdToScroll]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [categoryIdToScroll]);

  const byCategory = products.reduce<Record<string, Product[]>>((acc, p) => {
    if (!acc[p.categoryId]) acc[p.categoryId] = [];
    acc[p.categoryId].push(p);
    return acc;
  }, {});

  return (
    <div className="pos-touch-area flex flex-1 flex-col overflow-y-auto scroll-area-thin p-4">
      {Object.entries(byCategory).map(([categoryId, items]) => (
        <section
          key={categoryId}
          ref={(el) => {
            sectionRefs.current[categoryId] = el;
          }}
          className="mb-8"
        >
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            {categoryName(categories, categoryId)}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={onAddToCart} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
