"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const Drawer = Dialog.Root;
const DrawerTrigger = Dialog.Trigger;
const DrawerClose = Dialog.Close;
const DrawerPortal = Dialog.Portal;

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof Dialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof Dialog.Overlay> & { side?: "left" | "right" }
>(({ className, side = "right", ...props }, ref) => (
  <Dialog.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DrawerOverlay.displayName = "DrawerOverlay";

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  React.ComponentPropsWithoutRef<typeof Dialog.Content> & {
    side?: "left" | "right";
    className?: string;
  }
>(({ className, children, side = "right", ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay side={side} />
    <Dialog.Content
      ref={ref}
      className={cn(
        "fixed z-50 flex h-full w-full max-w-sm flex-col border border-[var(--border)] bg-[var(--background)] shadow-lg",
        side === "right" && "right-0 top-0",
        side === "left" && "left-0 top-0",
        "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        side === "right" &&
          "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
        side === "left" &&
          "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
        className
      )}
      {...props}
    >
      {children}
    </Dialog.Content>
  </DrawerPortal>
));
DrawerContent.displayName = "DrawerContent";

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 p-4 border-b border-[var(--border)]", className)} {...props} />
);
const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-2 p-4 border-t border-[var(--border)] mt-auto", className)} {...props} />
);
const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof Dialog.Title>,
  React.ComponentPropsWithoutRef<typeof Dialog.Title>
>(({ className, ...props }, ref) => (
  <Dialog.Title ref={ref} className={cn("text-lg font-semibold", className)} {...props} />
));
DrawerTitle.displayName = "DrawerTitle";

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
};
