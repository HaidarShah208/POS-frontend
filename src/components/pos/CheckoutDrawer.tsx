"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { CartSummary } from "./CartSummary";
import { OrderTypeSelector } from "./OrderTypeSelector";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { TokenDisplay } from "./TokenDisplay";
import { CheckoutStepper, type CheckoutStep } from "./CheckoutStepper";
import { useAppSelector } from "@/hooks/redux";
import {
  selectCartItems,
  selectCartTotals,
  selectCartCheckoutMeta,
} from "@/redux/selectors";
import {
  useSetOrderTypeMutation,
  useSetPaymentMethodMutation,
  useClearCartMutation,
} from "@/redux/api/cart";
import { usePlaceOrderMutation, useGetOrderByIdQuery } from "@/redux/api/ordersEndpoints";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { SettingsState } from "@/types/settings";
import type { Order } from "@/types/api/index";
import { Cross, CrossIcon, X } from "lucide-react";

interface CheckoutDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccessClose?: () => void;
}

const STEP_ORDER: CheckoutStep[] = [
  "Order Review",
  "Order Type",
  "Payment Method",
  "Payment Summary",
  "Processing",
  "Success",
];

type PlacedOrderSummary = {
  subtotal: number;
  tax: number;
  discountAmount: number;
  grandTotal: number;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildReceiptHtml(order: Order, settings: SettingsState, summary: PlacedOrderSummary | null): string {
  const general = settings.general;
  const receipt = settings.receipt;
  const businessName = escapeHtml(general.businessName || "Restaurant POS");
  const headerText = escapeHtml(receipt.headerText || "");
  const footerMessage = escapeHtml(receipt.footerMessage || "");
  const createdAt = new Date(order.createdAt);
  const dateStr = `${String(createdAt.getDate()).padStart(2, "0")}-${String(createdAt.getMonth() + 1).padStart(2, "0")}-${createdAt.getFullYear()}`;
  const timeStr = createdAt.toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const itemsRows = (order.items ?? [])
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.name)}</td><td style=\"text-align:right;\">${item.quantity}</td><td style=\"text-align:right;\">${formatCurrency(
          item.price * item.quantity
        )}</td></tr>`
    )
    .join("");

  const useSummary = summary ?? {
    subtotal: order.subtotal,
    tax: order.tax,
    discountAmount: order.discount,
    grandTotal: order.grandTotal,
  };

  const paperWidth = receipt.paperSize === "a4" ? "80mm" : "58mm";

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charSet="utf-8" />
    <title>Receipt ${escapeHtml(order.orderNumber)}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 10px; }
      .receipt { width: ${paperWidth}; margin: 0 auto; font-size: 11px; color: #111827; }
      .center { text-align: center; }
      .muted { color: #6b7280; }
      .header { margin-bottom: 6px; }
      .logo { max-height: 40px; margin: 0 auto 4px; object-fit: contain; display: block; }
      table { width: 100%; border-collapse: collapse; margin-top: 6px; }
      td { padding: 2px 0; }
      .totals td { padding-top: 4px; }
      .totals tr:nth-child(odd) td { border-top: 1px solid #e5e7eb; }
      .qr { width: 48px; height: 48px; margin: 6px auto 0; background: #e5e7eb; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #6b7280; }
      @media print {
        body { padding: 0; }
      }
    </style>
  </head>
  <body>
    <div class="receipt">
      <div class="header center">
        ${receipt.logoUrl ? `<img src="${receipt.logoUrl}" alt="Logo" class="logo" />` : ""}
        <div style="font-weight:600; margin-bottom:2px;">${businessName}</div>
        ${headerText ? `<div class="muted" style="margin-bottom:4px;">${headerText}</div>` : ""}
        <div class="muted">${escapeHtml(order.orderNumber)} · ${escapeHtml(order.orderType)}</div>
        <div class="muted">${dateStr} ${timeStr}</div>
      </div>
      <table>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
      <table class="totals">
        <tbody>
          <tr><td>Subtotal</td><td style="text-align:right;">${formatCurrency(useSummary.subtotal)}</td></tr>
          <tr><td>Tax</td><td style="text-align:right;">${formatCurrency(useSummary.tax)}</td></tr>
          ${useSummary.discountAmount ? `<tr><td>Discount</td><td style="text-align:right;">-${formatCurrency(useSummary.discountAmount)}</td></tr>` : ""}
          <tr><td style="font-weight:600;">Total</td><td style="text-align:right;font-weight:600;">${formatCurrency(useSummary.grandTotal)}</td></tr>
        </tbody>
      </table>
      ${receipt.showQrCode ? '<div class="qr">QR</div>' : ""}
      ${footerMessage ? `<p class="muted center" style="margin-top:6px;">${footerMessage}</p>` : ""}
    </div>
  </body>
</html>`;
}

function openReceiptPrintWindow(order: Order, settings: SettingsState, summary: PlacedOrderSummary | null) {
  if (typeof window === "undefined") return;
  const html = buildReceiptHtml(order, settings, summary);
  const w = window.open("", "_blank", "width=400,height=600");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}

export function CheckoutDrawer({ open, onOpenChange, onSuccessClose }: CheckoutDrawerProps) {
  const [step, setStep] = useState(0);
  const [placedToken, setPlacedToken] = useState<string | null>(null);
  const [placedSummary, setPlacedSummary] = useState<PlacedOrderSummary | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [setOrderType] = useSetOrderTypeMutation();
  const [setPaymentMethod] = useSetPaymentMethodMutation();
  const [clearCart] = useClearCartMutation();
  const items = useAppSelector(selectCartItems);
  const { subtotal, tax, discountAmount, grandTotal } = useAppSelector(selectCartTotals);
  const { orderType, paymentMethod } = useAppSelector(selectCartCheckoutMeta);
  const user = useAppSelector((s) => s.auth?.user);
  const settings = useAppSelector((s) => s.settings) as SettingsState;
  const [placeOrder, { isLoading }] = usePlaceOrderMutation();
  const { data: placedOrder } = useGetOrderByIdQuery(placedOrderId!, { skip: !placedOrderId });

  const canProceed = items.length > 0;
  const currentStepName = STEP_ORDER[step];

  const handleNext = () => {
    if (step === 3) {
      setStep(4);
      handlePlaceOrder();
    } else if (step < STEP_ORDER.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handlePlaceOrder = async () => {
    try {
      const result = await placeOrder({
        ...(user?.branchId && { branchId: user.branchId }),
        items,
        subtotal,
        tax,
        discount: discountAmount,
        grandTotal,
        orderType,
        paymentMethod,
      }).unwrap();
      setPlacedSummary({ subtotal, tax, discountAmount, grandTotal });
      setPlacedToken(result.tokenNumber);
      setPlacedOrderId(result.orderId);
      clearCart();
      setStep(5);
    } catch (err: unknown) {
      const msg =
        (err as { data?: { error?: string } })?.data?.error ??
        (err as Error)?.message ??
        "Failed to place order";
      toast.error(msg);
      setStep(3);
    }
  };

  const handleNewOrder = () => {
    setPlacedToken(null);
    setPlacedSummary(null);
    setPlacedOrderId(null);
    setStep(0);
    onOpenChange(false);
    onSuccessClose?.();
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && step === 4) return; // block closing during processing
    if (!next && step === 5) {
      handleNewOrder();
      return;
    }
    onOpenChange(next);
  };

  const handleNextRef = useRef(handleNext);
  handleNextRef.current = handleNext;
  useEffect(() => {
    if (!open || step !== 3 || !canProceed || isLoading) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleNextRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step, canProceed, isLoading]);

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent side="right" className="max-w-md flex flex-col">
        <DrawerHeader className="flex flex-row items-center justify-between">
          <DrawerTitle>Checkout</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon"><X className="w-6"/></Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          <CheckoutStepper currentStep={step} steps={STEP_ORDER} className="mb-4" />

          <AnimatePresence mode="wait">
            {currentStepName === "Order Review" && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item.id} className="flex justify-between text-sm">
                      <span>{item.name} × {item.quantity}</span>
                      <span>{formatCurrency((item.price + (item.modifiers?.reduce((s, m) => s + m.price, 0) ?? 0)) * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <CartSummary
                  subtotal={subtotal}
                  tax={tax}
                  discountAmount={discountAmount}
                  grandTotal={grandTotal}
                />
              </motion.div>
            )}

            {currentStepName === "Order Type" && (
              <motion.div
                key="type"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <OrderTypeSelector value={orderType} onChange={(v) => setOrderType(v)} />
              </motion.div>
            )}

            {currentStepName === "Payment Method" && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <PaymentMethodSelector value={paymentMethod} onChange={(v) => setPaymentMethod(v)} />
              </motion.div>
            )}

            {currentStepName === "Payment Summary" && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <CartSummary subtotal={subtotal} tax={tax} discountAmount={discountAmount} grandTotal={grandTotal} />
                <p className="text-sm text-[var(--muted-foreground)] mt-2">Order: {orderType} · Pay: {paymentMethod}</p>
              </motion.div>
            )}

            {currentStepName === "Processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center py-12"
              >
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--accent)]" />
                <p className="mt-4 font-medium">Processing order...</p>
                <div className="mt-6 w-full space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </motion.div>
            )}

            {currentStepName === "Success" && placedToken && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center pb-24"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg"
                >
                  <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </motion.div>
                <p className="text-sm text-[var(--muted-foreground)] mb-2">Order placed</p>
                <TokenDisplay token={placedToken} size="md" className="my-4" />
                <CartSummary
                  subtotal={placedSummary?.subtotal ?? subtotal}
                  tax={placedSummary?.tax ?? tax}
                  discountAmount={placedSummary?.discountAmount ?? discountAmount}
                  grandTotal={placedSummary?.grandTotal ?? grandTotal}
                  className="w-full mt-4"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {step === 5 && placedToken && (
          <div className="shrink-0 border-t border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => placedOrder && openReceiptPrintWindow(placedOrder, settings, placedSummary)}
                disabled={!placedOrder}
              >
                Print
              </Button>
              <Button className="flex-1" onClick={handleNewOrder}>
                New order
              </Button>
            </div>
          </div>
        )}

        {step < 4 && step !== 3 && (
          <div className="flex gap-2 p-4 border-t border-[var(--border)]">
            {step > 0 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Back
              </Button>
            )}
            <Button onClick={handleNext} disabled={!canProceed} className="flex-1">
              {step === 3 ? "Place order" : "Next"}
            </Button>
          </div>
        )}
        {step === 3 && (
          <div className="flex gap-2 p-4 border-t border-[var(--border)]">
            <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
            <Button onClick={handleNext} disabled={!canProceed || isLoading} className="flex-1">Place order</Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
