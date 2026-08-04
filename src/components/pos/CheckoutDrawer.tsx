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
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
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
import { ReceiptPreview } from "@/components/receipt/ReceiptPreview";
import { printReceipt, downloadReceiptPDF } from "@/lib/receipt";
import { addNotification } from "@/redux/slices/notificationSlice";
import { X, Printer, PlusCircle, ShoppingCart, Download, Eye, EyeOff } from "lucide-react";
import { svg } from "framer-motion/client";

interface CheckoutDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccessClose?: () => void;
}

const STEP_ORDER: CheckoutStep[] = [
  "Order Review",
  "Order Type",
  "Payment Method",
  "Payment",
  "Processing",
  "Success",
];

type PlacedOrderSummary = {
  subtotal: number;
  tax: number;
  discountAmount: number;
  grandTotal: number;
};

export function CheckoutDrawer({ open, onOpenChange, onSuccessClose }: CheckoutDrawerProps) {
  const [step, setStep] = useState(0);
  const [placedToken, setPlacedToken] = useState<string | null>(null);
  const [placedSummary, setPlacedSummary] = useState<PlacedOrderSummary | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const dispatch = useAppDispatch();
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
      const sanitizedItems = items.map((item) => {
        const basePrice = Number(item.price);
        const safePrice = Number.isFinite(basePrice) && basePrice >= 0 ? basePrice : 0;
        return { ...item, price: safePrice };
      });

      const result = await placeOrder({
        ...(user?.branchId && { branchId: user.branchId }),
        items: sanitizedItems,
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
      dispatch(addNotification({ type: "order", title: "Order Placed", message: `Order #${result.tokenNumber} placed successfully — ${formatCurrency(grandTotal)}`, priority: "medium" }));
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
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingCart className="h-4 w-4 text-[var(--muted-foreground)]" />
                  <span className="text-sm font-medium text-[var(--muted-foreground)]">
                    {items.length} item{items.length !== 1 ? "s" : ""} in cart
                  </span>
                </div>
                <ul className="space-y-2">
                  {items.map((item) => {
                    const modTotal = item.modifiers?.reduce((s, m) => s + m.price, 0) ?? 0;
                    const lineTotal = (item.price + modTotal) * item.quantity;
                    return (
                      <li
                        key={item.id}
                        className="flex justify-between text-sm rounded-lg border border-[var(--border)] p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-[var(--muted-foreground)] ml-1">× {item.quantity}</span>
                          {item.modifiers && item.modifiers.length > 0 && (
                            <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                              {item.modifiers.map((m) => m.name).join(", ")}
                            </p>
                          )}
                          {item.note && (
                            <p className="text-[11px] italic text-[var(--muted-foreground)] mt-0.5">
                              {item.note}
                            </p>
                          )}
                        </div>
                        <span className="font-medium shrink-0 ml-2">{formatCurrency(lineTotal)}</span>
                      </li>
                    );
                  })}
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

            {currentStepName === "Payment" && (
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
                {!showReceipt ? (
                  <CartSummary
                    subtotal={placedSummary?.subtotal ?? subtotal}
                    tax={placedSummary?.tax ?? tax}
                    discountAmount={placedSummary?.discountAmount ?? discountAmount}
                    grandTotal={placedSummary?.grandTotal ?? grandTotal}
                    className="w-full mt-4"
                  />
                ) : placedOrder ? (
                  <div className="w-full mt-4 rounded-xl border border-[var(--border)] p-4 bg-white">
                    <ReceiptPreview order={placedOrder} settings={settings} summary={placedSummary} />
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {step === 5 && placedToken && (
          <div className="shrink-0 border-t border-[var(--border)] bg-[var(--card)] p-4 space-y-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setShowReceipt(!showReceipt)}
              >
                {showReceipt ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showReceipt ? "Hide" : "Preview"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => placedOrder && printReceipt(placedOrder, settings, placedSummary)}
                disabled={!placedOrder}
              >
                <Printer className="h-3.5 w-3.5" />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => placedOrder && downloadReceiptPDF(placedOrder, settings, placedSummary)}
                disabled={!placedOrder}
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            </div>
            <Button className="w-full gap-2" onClick={handleNewOrder}>
              <PlusCircle className="h-4 w-4" />
              New Order
            </Button>
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
