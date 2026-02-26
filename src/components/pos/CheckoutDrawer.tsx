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
import { usePlaceOrderMutation } from "@/redux/api/orderSession";
import { useAddOrderMutation } from "@/redux/api/kitchen";
import { buildKitchenOrderFromCart } from "@/lib/mockOrderGenerator";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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

export function CheckoutDrawer({ open, onOpenChange, onSuccessClose }: CheckoutDrawerProps) {
  const [step, setStep] = useState(0);
  const [placedToken, setPlacedToken] = useState<string | null>(null);
  const [setOrderType] = useSetOrderTypeMutation();
  const [setPaymentMethod] = useSetPaymentMethodMutation();
  const [clearCart] = useClearCartMutation();
  const [addOrder] = useAddOrderMutation();
  const items = useAppSelector(selectCartItems);
  const { subtotal, tax, discountAmount, grandTotal } = useAppSelector(selectCartTotals);
  const { orderType, paymentMethod } = useAppSelector(selectCartCheckoutMeta);
  const [placeOrder, { isLoading }] = usePlaceOrderMutation();

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
        items,
        subtotal,
        tax,
        discount: discountAmount,
        grandTotal,
        orderType,
        paymentMethod,
      }).unwrap();
      setPlacedToken(result.token);
      const kitchenOrder = buildKitchenOrderFromCart(items, orderType, result.token, result.orderId);
      addOrder(kitchenOrder);
      clearCart();
      setStep(5);
    } catch {
      setStep(3);
    }
  };

  const handleNewOrder = () => {
    setPlacedToken(null);
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
      <DrawerContent side="right" className="max-w-md">
        <DrawerHeader className="flex flex-row items-center justify-between">
          <DrawerTitle>Checkout</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon">×</Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto p-4">
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
                className="flex flex-col items-center py-6"
              >
                <p className="text-sm text-[var(--muted-foreground)] mb-2">Order placed</p>
                <TokenDisplay token={placedToken} size="lg" className="my-4" />
                <CartSummary subtotal={subtotal} tax={tax} discountAmount={discountAmount} grandTotal={grandTotal} className="w-full mt-4" />
                <div className="flex gap-2 mt-6 w-full">
                  <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                    Print
                  </Button>
                  <Button className="flex-1" onClick={handleNewOrder}>
                    New order
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
