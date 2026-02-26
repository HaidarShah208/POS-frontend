"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { CategoryList } from "@/components/pos/CategoryList";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { CartPanel } from "@/components/pos/CartPanel";
import { CartDrawer } from "@/components/pos/CartDrawer";
import { CheckoutDrawer } from "@/components/pos/CheckoutDrawer";
import { Button } from "@/components/ui/button";
import { MOCK_CATEGORIES } from "@/lib/mock-data";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { useAppDispatch } from "@/hooks/redux";
import { addToCart } from "@/redux/api/cart";
import { usePosKeyboardShortcuts } from "@/hooks/usePosKeyboardShortcuts";
import type { Product } from "@/types";

export default function POSPage() {
  const dispatch = useAppDispatch();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(MOCK_CATEGORIES[0]?.id ?? null);
  const [categoryIdToScroll, setCategoryIdToScroll] = useState<string | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

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
      dispatch(
        addToCart({
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
        })
      );
    },
    [dispatch]
  );

  return (
    <>
      {/* md and up: 3-panel layout with categories, products, order summary */}
      <div className="hidden h-full w-full md:flex">
        <aside className="sticky top-0 flex h-full w-44 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--background)] md:w-48">
          <div className="p-3 border-b border-[var(--border)]">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">← Back</Link>
            </Button>
          </div>
          <CategoryList
            categories={MOCK_CATEGORIES}
            activeId={activeCategoryId}
            onSelect={handleCategorySelect}
          />
        </aside>
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <ProductGrid
            products={MOCK_PRODUCTS}
            categories={MOCK_CATEGORIES}
            activeCategoryId={activeCategoryId}
            categoryIdToScroll={categoryIdToScroll}
            onAddToCart={handleAddToCart}
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
              categories={MOCK_CATEGORIES}
              activeId={activeCategoryId}
              onSelect={handleCategorySelect}
            />
          </aside>
          <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <ProductGrid
              products={MOCK_PRODUCTS}
              categories={MOCK_CATEGORIES}
              activeCategoryId={activeCategoryId}
              categoryIdToScroll={categoryIdToScroll}
              onAddToCart={handleAddToCart}
            />
          </section>
        </div>
      </div>
    </>
  );
}
