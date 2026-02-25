"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

const Modal = Dialog.Root;
const ModalTrigger = Dialog.Trigger;
const ModalClose = Dialog.Close;
const ModalPortal = Dialog.Portal;

const ModalOverlay = React.forwardRef<
  React.ElementRef<typeof Dialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof Dialog.Overlay>
>(({ className, ...props }, ref) => (
  <Dialog.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/50", className)}
    {...props}
  />
));
ModalOverlay.displayName = "ModalOverlay";

const ModalContent = React.forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  React.ComponentPropsWithoutRef<typeof Dialog.Content>
>(({ className, children, ...props }, ref) => (
  <ModalPortal>
    <ModalOverlay />
    <Dialog.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border border-[var(--border)] bg-[var(--background)] p-6 shadow-lg rounded-xl",
        className
      )}
      {...props}
    >
      {children}
    </Dialog.Content>
  </ModalPortal>
));
ModalContent.displayName = "ModalContent";

const ModalHeader = (props: React.HTMLAttributes<HTMLDivElement>) => (
  <div className="flex flex-col space-y-1.5 text-center sm:text-left" {...props} />
);
const ModalFooter = (props: React.HTMLAttributes<HTMLDivElement>) => (
  <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2" {...props} />
);

const ModalTitle = React.forwardRef<
  React.ElementRef<typeof Dialog.Title>,
  React.ComponentPropsWithoutRef<typeof Dialog.Title>
>(({ className, ...props }, ref) => (
  <Dialog.Title ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
));
ModalTitle.displayName = "ModalTitle";

const ModalDescription = React.forwardRef<
  React.ElementRef<typeof Dialog.Description>,
  React.ComponentPropsWithoutRef<typeof Dialog.Description>
>(({ className, ...props }, ref) => (
  <Dialog.Description ref={ref} className={cn("text-sm text-[var(--muted-foreground)]", className)} {...props} />
));
ModalDescription.displayName = "ModalDescription";

export {
  Modal,
  ModalPortal,
  ModalOverlay,
  ModalTrigger,
  ModalClose,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
};
