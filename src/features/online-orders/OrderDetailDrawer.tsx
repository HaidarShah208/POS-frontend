"use client";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types/api/index";
import { useUpdateOrderStatusMutation } from "@/redux/api/ordersEndpoints";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_BADGE: Record<OrderStatus, "warning" | "info" | "secondary" | "purple" | "success" | "destructive"> = {
  pending: "warning",
  accepted: "info",
  preparing: "secondary",
  ready: "purple",
  completed: "success",
  cancelled: "destructive",
};

type OrderDetailDrawerProps = {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function OrderDetailDrawer({ order, open, onOpenChange }: OrderDetailDrawerProps) {
  const [updateStatus, { isLoading }] = useUpdateOrderStatusMutation();

  const handleStatus = async (status: OrderStatus) => {
    if (!order) return;
    await updateStatus({ id: order.id, status });
  };

  if (!order) return null;

  const canAccept = order.status === "pending";
  const canReject = order.status === "pending";
  const canPreparing = order.status === "accepted";
  const canReady = order.status === "preparing";
  const canCompleted = order.status === "ready";

  const items = order.items ?? [];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="right" className="max-w-full sm:max-w-md flex flex-col max-h-full">
        <DrawerHeader className="flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <DrawerTitle>
              {order.orderNumber} · #{order.tokenNumber}
            </DrawerTitle>
            <Badge variant={STATUS_BADGE[order.status]}>{order.status}</Badge>
          </div>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <section>
            <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2">Customer</h4>
            <div className="text-sm text-[var(--muted-foreground)]">
              <p>{order.user?.name ?? "Walk-in"}</p>
              <p className="capitalize mt-1">{order.orderType} · {order.paymentMethod}</p>
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2">Items</h4>
            <ul className="space-y-2">
              {items.map((item, i) => (
                <li key={item.id ?? i} className="flex justify-between text-sm">
                  <span>{item.name} × {item.quantity}</span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2">Payment</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Tax</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Discount</span>
                <span>{formatCurrency(order.discount)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t border-[var(--border)]">
                <span>Total</span>
                <span>{formatCurrency(order.grandTotal)}</span>
              </div>
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2">Placed</h4>
            <p className="text-sm text-[var(--muted-foreground)]">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </section>
        </div>

        <DrawerFooter className="flex-shrink-0 flex-row flex-wrap gap-2">
          <AnimatePresence mode="wait">
            {canAccept && (
              <motion.div key="accept" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <Button onClick={() => handleStatus("accepted")} disabled={isLoading}>Accept</Button>
              </motion.div>
            )}
            {canReject && (
              <motion.div key="reject" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <Button variant="destructive" onClick={() => handleStatus("cancelled")} disabled={isLoading}>Reject</Button>
              </motion.div>
            )}
            {canPreparing && (
              <motion.div key="preparing" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <Button onClick={() => handleStatus("preparing")} disabled={isLoading}>Mark preparing</Button>
              </motion.div>
            )}
            {canReady && (
              <motion.div key="ready" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <Button onClick={() => handleStatus("ready")} disabled={isLoading}>Mark ready</Button>
              </motion.div>
            )}
            {canCompleted && (
              <motion.div key="completed" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <Button onClick={() => handleStatus("completed")} disabled={isLoading}>Mark completed</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
