"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  selectCartItems,
  selectCartTotals,
  selectCartIsEmpty,
} from "@/redux/selectors";
import { useAppSelector } from "@/hooks/redux";
import {
  useIncreaseQtyMutation,
  useDecreaseQtyMutation,
  useRemoveFromCartMutation,
  useClearCartMutation,
} from "@/redux/api/cart";
import { ClearCartModal } from "./ClearCartModal";

type CartPanelProps = {
  onCheckoutClick?: () => void;
};

export function CartPanel({ onCheckoutClick }: CartPanelProps) {
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [increaseQty] = useIncreaseQtyMutation();
  const [decreaseQty] = useDecreaseQtyMutation();
  const [removeFromCart] = useRemoveFromCartMutation();
  const [clearCart] = useClearCartMutation();
  const items = useAppSelector(selectCartItems);
  const { subtotal, tax, discountAmount, grandTotal } = useAppSelector(selectCartTotals);
  const isEmpty = useAppSelector(selectCartIsEmpty);

  return (
    <div className="flex h-full flex-col border-l border-[var(--border)] bg-[var(--background)]">
      <div className="border-b border-[var(--border)] p-4">
        <h2 className="text-lg font-semibold">Order Summary</h2>
      </div>
      <div className="flex-1 overflow-y-auto scroll-area-thin p-4">
        {isEmpty ? (
          <p className="text-sm text-[var(--muted-foreground)]">Cart is empty. Add items from the menu.</p>
        ) : (
          <ul className="space-y-3">
            <AnimatePresence mode="popLayout">
              {items.map((item) => {
                const modTotal = item.modifiers?.reduce((s, m) => s + m.price, 0) ?? 0;
                const lineTotal = (item.price + modTotal) * item.quantity;
                return (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-lg border border-[var(--border)] p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {formatCurrency(item.price)} × {item.quantity}
                          <span className="ml-1.5 font-medium text-[var(--foreground)]">
                            = {formatCurrency(lineTotal)}
                          </span>
                        </p>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.modifiers.map((mod) => (
                              <span
                                key={mod.id}
                                className="inline-flex items-center rounded-md bg-[var(--muted)] px-1.5 py-0.5 text-[10px] text-[var(--muted-foreground)]"
                              >
                                {mod.name} +{formatCurrency(mod.price)}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.note && (
                          <p className="mt-1 text-[11px] italic text-[var(--muted-foreground)] truncate">
                            {item.note}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="pos-touch h-8 w-8 shrink-0 text-[var(--destructive)]"
                        onClick={() => removeFromCart(item.id)}
                      >
                        ×
                      </Button>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="pos-touch h-9 w-9 min-h-[36px] min-w-[36px]"
                        onClick={() => decreaseQty(item.id)}
                      >
                        −
                      </Button>
                      <span className="min-w-[2rem] text-center text-sm font-medium select-none">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="pos-touch h-9 w-9 min-h-[36px] min-w-[36px]"
                        onClick={() => increaseQty(item.id)}
                      >
                        +
                      </Button>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
      <div className="border-t border-[var(--border)] p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--muted-foreground)]">Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--muted-foreground)]">Tax</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-[var(--muted-foreground)]">Discount</span>
            <span className="text-[var(--destructive)]">-{formatCurrency(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-lg pt-2">
          <span>Total</span>
          <span>{formatCurrency(grandTotal)}</span>
        </div>
        <Button
          className="w-full mt-4"
          size="lg"
          variant="outline"
          disabled={isEmpty}
          onClick={() => setClearModalOpen(true)}
        >
          Clear cart
        </Button>
      </div>
      <div className="p-4 border-t border-[var(--border)] sticky bottom-0 bg-[var(--background)]">
        <Button
          className="w-full pos-touch min-h-[48px]"
          size="xl"
          variant="accent"
          disabled={isEmpty}
          onClick={onCheckoutClick}
        >
          Checkout — {formatCurrency(grandTotal)}
        </Button>
        <p className="mt-2 text-center text-xs text-[var(--muted-foreground)] hidden lg:block">
          F2 Checkout · F3 Cart · Ctrl+Enter Pay
        </p>
      </div>
      <ClearCartModal
        open={clearModalOpen}
        onOpenChange={setClearModalOpen}
        onConfirm={() => clearCart()}
      />
    </div>
  );
}
