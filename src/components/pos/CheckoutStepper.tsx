"use client";

import { cn } from "@/lib/utils";

export const CHECKOUT_STEPS = [
  "Order Review",
  "Order Type",
  "Payment Method",
  "Payment Summary",
  "Processing",
  "Success",
] as const;

export type CheckoutStep = (typeof CHECKOUT_STEPS)[number];

interface CheckoutStepperProps {
  currentStep: number;
  steps?: readonly string[];
  className?: string;
}

export function CheckoutStepper({
  currentStep,
  steps = CHECKOUT_STEPS,
  className,
}: CheckoutStepperProps) {
  return (
    <nav aria-label="Checkout progress" className={cn("flex items-center gap-1", className)}>
      {steps.map((label, i) => (
        <div
          key={label}
          className={cn(
            "flex-1 h-1 rounded-full transition-colors",
            i <= currentStep ? "bg-[var(--accent)]" : "bg-[var(--border)]"
          )}
          aria-current={i === currentStep ? "step" : undefined}
        />
      ))}
    </nav>
  );
}
