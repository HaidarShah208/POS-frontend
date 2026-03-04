"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { CategoryList } from "@/components/pos/CategoryList";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { CartPanel } from "@/components/pos/CartPanel";
import { CartDrawer } from "@/components/pos/CartDrawer";
import { CheckoutDrawer } from "@/components/pos/CheckoutDrawer";
import { Button } from "@/components/ui/button";
import { useAddToCartMutation, useGetCartQuery } from "@/redux/api/cart";
import { useGetProductsQuery, useGetCategoriesQuery, useGetInventoryByBranchQuery } from "@/redux/api";
import { usePosKeyboardShortcuts } from "@/hooks/usePosKeyboardShortcuts";
import { useAppSelector } from "@/hooks/redux";
import type { Product, InventoryItem } from "@/types/api/index";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function POSPage() {
  useGetCartQuery(); // Prime cart cache so selectors have data
  const { data: productsResponse, isLoading: productsLoading, isUninitialized: productsUninitialized } = useGetProductsQuery({ limit: 200 });
  const { data: categories = [], isLoading: categoriesLoading, isUninitialized: categoriesUninitialized } = useGetCategoriesQuery();
  const products = productsResponse?.data ?? [];
  const defaultCategoryId = categories[0]?.id ?? null;
  const isLoading = productsLoading || categoriesLoading || productsUninitialized || categoriesUninitialized;
  const [addToCart] = useAddToCartMutation();
  const user = useAppSelector((s) => s.auth?.user);
  const branchId = user?.branchId;
  const { data: inventoryResponse } = useGetInventoryByBranchQuery(
    branchId ? { branchId, limit: 500 } : ({} as { branchId: string }),
    { skip: !branchId }
  );
  const inventoryMap = useMemo(() => {
    const map: Record<string, InventoryItem> = {};
    (inventoryResponse?.data ?? []).forEach((item) => {
      map[item.productId] = item;
    });
    return map;
  }, [inventoryResponse]);

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [categoryIdToScroll, setCategoryIdToScroll] = useState<string | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const effectiveCategoryId = activeCategoryId ?? defaultCategoryId;

  const handleCheckoutClick = useCallback(() => {
    setCartDrawerOpen(false);
    setCheckoutOpen(true);
  }, []);

  usePosKeyboardShortcuts({
    onOpenCheckout: handleCheckoutClick,
    onToggleCart: () => setCartDrawerOpen((prev) => !prev),
    onCloseOverlays: () => {
      setCheckoutOpen(false);
      setCartDrawerOpen(false);
    },
  });

  const handleCategorySelect = useCallback((id: string) => {
    setActiveCategoryId(id);
    setCategoryIdToScroll(id);
  }, []);

  const handleAddToCart = useCallback(
    (product: Product) => {
      const inv = inventoryMap[product.id];
      if (inv && inv.currentStock <= 0) {
        toast.error("This product is out of stock.");
        return;
      }
      addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image ?? undefined,
      });
    },
    [addToCart, inventoryMap]
  );

  return (
    <>
      {/* md and up: 3-panel layout with categories, products, order summary */}
      <div className="hidden h-full w-full md:flex">
        <aside className="sticky top-0 flex h-full w-44 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--background)] md:w-48">
          <div className="p-3 border-b border-[var(--border)]">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard"><ArrowLeft className='w-5'/> Back</Link>
            </Button>
          </div>
          <CategoryList
            categories={categories}
            activeId={effectiveCategoryId}
            onSelect={handleCategorySelect}
            loading={isLoading}
          />
        </aside>
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <ProductGrid
            products={products}
            categories={categories}
            activeCategoryId={effectiveCategoryId}
            categoryIdToScroll={categoryIdToScroll}
            onAddToCart={handleAddToCart}
            loading={isLoading}
          />
        </section>
        {/* Order summary: visible from md (was lg-only); narrower on md, full width on lg */}
        <aside className="sticky top-0 hidden w-80 shrink-0 border-l border-[var(--border)] bg-[var(--background)] md:block lg:w-96">
          <CartPanel onCheckoutClick={handleCheckoutClick} />
        </aside>
      </div>

      <CheckoutDrawer open={checkoutOpen} onOpenChange={setCheckoutOpen} />

      {/* sm and below: header with cart toggle + categories + products; cart in drawer */}
      <div className="flex h-full w-full flex-col md:hidden">
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-3 py-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">← Back</Link>
          </Button>
          <CartDrawer
            open={cartDrawerOpen}
            onOpenChange={setCartDrawerOpen}
            onCheckoutClick={handleCheckoutClick}
          />
        </header>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <aside className="flex w-28 shrink-0 flex-col border-r border-(--border) bg-background sm:w-36">
            <CategoryList
              categories={categories}
              activeId={effectiveCategoryId}
              onSelect={handleCategorySelect}
              loading={isLoading}
            />
          </aside>
          <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <ProductGrid
              products={products}
              categories={categories}
              activeCategoryId={effectiveCategoryId}
              categoryIdToScroll={categoryIdToScroll}
              onAddToCart={handleAddToCart}
              loading={isLoading}
            />
          </section>
        </div>
      </div>
    </>
  );
}
