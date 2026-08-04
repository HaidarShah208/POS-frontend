"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ProductCard } from "./ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { Package, Plus } from "lucide-react";
import type { Product, Category, InventoryItem } from "@/types/api/index";

type ViewMode = "grid" | "list";

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  activeCategoryId: string | null;
  categoryIdToScroll: string | null;
  onAddToCart: (product: Product) => void;
  loading?: boolean;
  viewMode?: ViewMode;
  inventoryMap?: Record<string, InventoryItem>;
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

function ProductListSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
      <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

function ProductListItem({
  product,
  onAdd,
  stock,
}: {
  product: Product;
  onAdd: (p: Product) => void;
  stock?: InventoryItem;
}) {
  const isOut = stock && stock.currentStock <= 0;
  const isLow =
    stock &&
    !isOut &&
    stock.currentStock <= (stock.lowStockThreshold ?? 10);

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.1 }}
      onClick={() => !isOut && onAdd(product)}
      disabled={!!isOut}
      className={cn(
        "flex items-center gap-3 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-left transition-all",
        isOut
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-[var(--muted)] hover:border-[var(--accent)]/40 active:shadow-sm"
      )}
    >
      <div className="h-10 w-10 rounded-lg bg-[var(--muted)] shrink-0 overflow-hidden flex items-center justify-center">
        {product.image ? (
          <img src={product.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <Package className="h-4 w-4 text-[var(--muted-foreground)]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{product.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {isOut && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
              Out of stock
            </Badge>
          )}
          {isLow && (
            <Badge variant="warning" className="text-[10px] px-1.5 py-0 h-4">
              {stock!.currentStock} left
            </Badge>
          )}
          {product.modifiers && product.modifiers.length > 0 && (
            <span className="text-[11px] text-[var(--muted-foreground)]">
              {product.modifiers.length} modifier{product.modifiers.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
      <span className="text-sm font-bold text-[var(--accent)] tabular-nums shrink-0">
        {formatCurrency(product.price)}
      </span>
      {!isOut && (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] shrink-0">
          <Plus className="h-4 w-4" />
        </div>
      )}
    </motion.button>
  );
}

export function ProductGrid({
  products,
  categories,
  activeCategoryId,
  categoryIdToScroll,
  onAddToCart,
  loading,
  viewMode = "grid",
  inventoryMap,
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
          {viewMode === "grid" ? (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductListSkeleton key={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (Object.keys(byCategory).length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <Package className="h-10 w-10 mx-auto mb-3 text-[var(--muted-foreground)]" />
          <p className="text-sm font-medium text-[var(--muted-foreground)]">No products found</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">Try a different search term</p>
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
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            {categoryName(categories, categoryId)}
            <span className="ml-1.5 text-xs font-normal normal-case">({items.length})</span>
          </h2>
          {viewMode === "grid" ? (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={onAddToCart}
                  stock={inventoryMap?.[product.id]}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((product) => (
                <ProductListItem
                  key={product.id}
                  product={product}
                  onAdd={onAddToCart}
                  stock={inventoryMap?.[product.id]}
                />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
