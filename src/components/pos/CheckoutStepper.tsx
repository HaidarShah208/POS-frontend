"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export const CHECKOUT_STEPS = [
  "Order Review",
  "Order Type",
  "Payment Method",
  "Payment Summary",
  "Processing",
  "Success",
] as const;

export type CheckoutStep = (typeof CHECKOUT_STEPS)[number];

const VISIBLE_STEPS = CHECKOUT_STEPS.slice(0, 4);

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
  const visibleCount = Math.min(steps.length, 4);

  return (
    <nav aria-label="Checkout progress" className={cn("space-y-2", className)}>
      <div className="flex items-center gap-1">
        {steps.slice(0, visibleCount).map((label, i) => (
          <div key={label} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-center">
              <motion.div
                className={cn(
                  "flex-1 h-1.5 rounded-full transition-colors",
                  i < currentStep
                    ? "bg-emerald-500"
                    : i === currentStep
                      ? "bg-[var(--accent)]"
                      : "bg-[var(--border)]"
                )}
                initial={false}
                animate={{
                  backgroundColor:
                    i < currentStep
                      ? "var(--color-emerald-500)"
                      : i === currentStep
                        ? "var(--accent)"
                        : "var(--border)",
                }}
                transition={{ duration: 0.3 }}
                aria-current={i === currentStep ? "step" : undefined}
              />
            </div>
            <span
              className={cn(
                "text-[10px] font-medium transition-colors hidden sm:block",
                i === currentStep
                  ? "text-[var(--foreground)]"
                  : i < currentStep
                    ? "text-emerald-600"
                    : "text-[var(--muted-foreground)]"
              )}
            >
              {i < currentStep ? (
                <span className="inline-flex items-center gap-0.5">
                  <Check className="h-2.5 w-2.5" /> {label}
                </span>
              ) : (
                label
              )}
            </span>
          </div>
        ))}
      </div>
    </nav>
  );
}
