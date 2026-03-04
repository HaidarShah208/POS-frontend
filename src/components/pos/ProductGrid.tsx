"use client";

import { useRef, useEffect } from "react";
import { ProductCard } from "./ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product, Category } from "@/types/api/index";

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  activeCategoryId: string | null;
  categoryIdToScroll: string | null;
  onAddToCart: (product: Product) => void;
  loading?: boolean;
}

const categoryName = (categories: Category[], id: string) =>
  categories.find((c) => c.id === id)?.name ?? id;

function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] overflow-hidden min-h-[112px] flex flex-col">
      <Skeleton className="h-16 w-full shrink-0 rounded-none" />
      <div className="flex-1 p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export function ProductGrid({
  products,
  categories,
  activeCategoryId,
  categoryIdToScroll,
  onAddToCart,
  loading,
}: ProductGridProps) {
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

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

  if (loading) {
    return (
      <div className="pos-touch-area flex flex-1 flex-col overflow-y-auto scroll-area-thin p-4">
        <div className="mb-6">
          <Skeleton className="h-4 w-24 mb-3" />
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
        <div className="mb-6">
          <Skeleton className="h-4 w-32 mb-3" />
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

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
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-(--muted-foreground)">
            {categoryName(categories, categoryId)}
          </h2>
          <div className="grid gap-3 grid-cols-1 lg:grid-cols-4">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={onAddToCart} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
