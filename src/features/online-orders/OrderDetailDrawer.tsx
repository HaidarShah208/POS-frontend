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
import type { OnlineOrder, OnlineOrderStatus } from "@/types/online-orders";
import { useUpdateOrderStatusMutation } from "@/redux/api/onlineOrders";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_BADGE: Record<OnlineOrderStatus, "warning" | "info" | "secondary" | "purple" | "success" | "destructive"> = {
  pending: "warning",
  accepted: "info",
  preparing: "secondary",
  out_for_delivery: "purple",
  delivered: "success",
  rejected: "destructive",
};

type OrderDetailDrawerProps = {
  order: OnlineOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function OrderDetailDrawer({ order, open, onOpenChange }: OrderDetailDrawerProps) {
  const [updateStatus, { isLoading }] = useUpdateOrderStatusMutation();

  const handleStatus = async (status: OnlineOrderStatus) => {
    if (!order) return;
    await updateStatus({ orderId: order.id, status });
  };

  if (!order) return null;

  const canAccept = order.status === "pending";
  const canReject = order.status === "pending";
  const canPreparing = order.status === "accepted";
  const canOutForDelivery = order.status === "preparing";
  const canDelivered = order.status === "out_for_delivery";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="right" className="max-w-full sm:max-w-md flex flex-col max-h-full">
        <DrawerHeader className="flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <DrawerTitle>{order.orderId} · {order.customerName}</DrawerTitle>
            <Badge variant={STATUS_BADGE[order.status]}>{order.status.replace(/_/g, " ")}</Badge>
          </div>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Customer info */}
          <section>
            <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2">Customer</h4>
            <div className="text-sm text-[var(--muted-foreground)] space-y-1">
              <p>{order.customerName}</p>
              {order.customerPhone && <p>{order.customerPhone}</p>}
              {order.customerAddress && <p>{order.customerAddress}</p>}
              <p className="capitalize">{order.deliveryType}</p>
            </div>
          </section>

          {/* Items */}
          <section>
            <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2">Items</h4>
            <ul className="space-y-2">
              {order.items.map((item, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span>{item.name} × {item.quantity}</span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Payment summary */}
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
                <span className="text-[var(--muted-foreground)]">Delivery</span>
                <span>{formatCurrency(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t border-[var(--border)]">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
              <Badge variant={order.paymentStatus === "paid" ? "success" : "warning"} className="mt-2">
                {order.paymentStatus}
              </Badge>
            </div>
          </section>

          {/* Order timeline */}
          <section>
            <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2">Timeline</h4>
            <ul className="space-y-2">
              {order.timeline.map((entry, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Badge variant={STATUS_BADGE[entry.status]} className="shrink-0">{entry.label}</Badge>
                  <span className="text-[var(--muted-foreground)]">
                    {new Date(entry.at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Assign rider (UI only) */}
          <section>
            <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2">Rider</h4>
            <Button variant="outline" size="sm" className="w-full" disabled>
              {order.riderId ? `Rider #${order.riderId}` : "Assign rider"}
            </Button>
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
                <Button variant="destructive" onClick={() => handleStatus("rejected")} disabled={isLoading}>Reject</Button>
              </motion.div>
            )}
            {canPreparing && (
              <motion.div key="preparing" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <Button onClick={() => handleStatus("preparing")} disabled={isLoading}>Mark preparing</Button>
              </motion.div>
            )}
            {canOutForDelivery && (
              <motion.div key="out" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <Button onClick={() => handleStatus("out_for_delivery")} disabled={isLoading}>Out for delivery</Button>
              </motion.div>
            )}
            {canDelivered && (
              <motion.div key="delivered" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <Button onClick={() => handleStatus("delivered")} disabled={isLoading}>Mark delivered</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
