"use client";

import { useEffect, useCallback } from "react";

type PosShortcutsOptions = {
  onOpenCheckout: () => void;
  onToggleCart: () => void;
  onCloseOverlays: () => void;
  /** When checkout is open and on payment summary step, trigger place order */
  onPlaceOrder?: () => void;
  checkoutStep?: number;
  checkoutOpen?: boolean;
};

export function usePosKeyboardShortcuts({
  onOpenCheckout,
  onToggleCart,
  onCloseOverlays,
  onPlaceOrder,
  checkoutStep = -1,
  checkoutOpen = false,
}: PosShortcutsOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        if (e.key !== "Escape") return;
      }

      switch (e.key) {
        case "F2":
          e.preventDefault();
          onOpenCheckout();
          break;
        case "F3":
          e.preventDefault();
          onToggleCart();
          break;
        case "Escape":
          e.preventDefault();
          onCloseOverlays();
          break;
        case "Enter":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (checkoutOpen && checkoutStep === 3 && onPlaceOrder) {
              onPlaceOrder();
            } else if (!checkoutOpen) {
              onOpenCheckout();
            }
          }
          break;
        default:
          break;
      }
    },
    [
      onOpenCheckout,
      onToggleCart,
      onCloseOverlays,
      onPlaceOrder,
      checkoutOpen,
      checkoutStep,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
