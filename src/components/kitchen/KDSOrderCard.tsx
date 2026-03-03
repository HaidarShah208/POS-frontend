"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TokenDisplay } from "@/components/pos/TokenDisplay";
import type { KitchenOrder, KitchenOrderStatus } from "@/types/api";
import { cn } from "@/lib/utils";

type KDSOrderCardProps = {
  order: KitchenOrder;
  onStatusChange: (orderId: string, status: KitchenOrderStatus) => void;
};

function formatElapsed(createdAt: string): string {
  const sec = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const STATUS_CONFIG: Record<
  KitchenOrderStatus,
  { label: string; border: string; header: string; pulse?: boolean }
> = {
  NEW: {
    label: "New",
    border: "border-amber-500/80",
    header: "bg-amber-500 text-white",
    pulse: true,
  },
  PREPARING: {
    label: "Preparing",
    border: "border-blue-500/80",
    header: "bg-blue-500 text-white",
  },
  READY: {
    label: "Ready",
    border: "border-emerald-600/80",
    header: "bg-emerald-600 text-white",
  },
};

const ORDER_TYPE_LABELS: Record<string, string> = {
  "dine-in": "Dine-in",
  takeaway: "Takeaway",
  delivery: "Delivery",
};

export function KDSOrderCard(props: KDSOrderCardProps) {
  const { order, onStatusChange } = props;
  const next = order.status === "NEW" ? "PREPARING" : order.status === "PREPARING" ? "READY" : null;
  const elapsed = formatElapsed(order.createdAt);
  const config = STATUS_CONFIG[order.status];
  const orderTypeLabel = ORDER_TYPE_LABELS[order.orderType] ?? order.orderType;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex min-h-[200px] flex-col overflow-hidden rounded-2xl border-2 bg-[var(--card)] shadow-md transition-shadow hover:shadow-lg",
        config.border
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3",
          config.header,
          config.pulse && "animate-pulse"
        )}
      >
        <TokenDisplay token={order.token} size="sm" className="!bg-transparent !text-inherit !font-bold" />
        <div className="flex flex-col items-center gap-2">
          {/* <span className="rounded bg-black/15 px-2 py-0.5 font-mono text-xs tabular-nums">
            {elapsed}
          </span> */}
          <span className="text-xs font-bold opacity-90">{config.label}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--muted)]/20 px-4 py-2">
        <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium capitalize text-[var(--foreground)]">
          {orderTypeLabel}
        </span>
      </div>

      <ul className="flex-1 space-y-2 px-4 py-3 text-sm">
        {order.items.map((item, i) => (
          <li key={i} className="flex flex-wrap gap-x-1 gap-y-0.5">
            <span className="font-semibold text-[var(--foreground)]">{item.name}</span>
            {item.quantity > 1 && (
              <span className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-xs font-medium">
                ×{item.quantity}
              </span>
            )}
            {item.modifiers?.length ? (
              <span className="text-[var(--muted-foreground)]">+ {item.modifiers.join(", ")}</span>
            ) : null}
            {item.note ? (
              <span className="block w-full text-xs italic text-[var(--muted-foreground)]">
                Note: {item.note}
              </span>
            ) : null}
          </li>
        ))}
      </ul>

      {next && (
        <div className="border-t border-[var(--border)] p-3">
          <Button
            size="sm"
            className="h-11 w-full font-semibold"
            onClick={() => onStatusChange(order.id, next)}
          >
            {next === "PREPARING" ? "Start preparing" : "Mark ready"}
          </Button>
        </div>
      )}
    </motion.article>
  );
}
