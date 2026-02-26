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

const STATUS_COLORS: Record<KitchenOrderStatus, string> = {
  NEW: "bg-amber-500 text-white",
  PREPARING: "bg-blue-500 text-white",
  READY: "bg-green-600 text-white",
};

export function KDSOrderCard(props: KDSOrderCardProps) {
  const { order, onStatusChange } = props;
  const next = order.status === "NEW" ? "PREPARING" : order.status === "PREPARING" ? "READY" : null;
  const elapsed = formatElapsed(order.createdAt);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border-2 overflow-hidden flex flex-col min-h-[180px]",
        order.status === "NEW" && "border-amber-500",
        order.status === "PREPARING" && "border-blue-500",
        order.status === "READY" && "border-green-600"
      )}
    >
      <div className={cn("p-2 flex items-center justify-between", STATUS_COLORS[order.status])}>
        <TokenDisplay token={order.token} size="sm" className="!bg-transparent !text-inherit" />
        <span className="text-sm font-mono">{elapsed}</span>
      </div>
      <div className="px-3 py-2 text-xs text-[var(--muted-foreground)] uppercase">
        {order.orderType}
      </div>
      <ul className="flex-1 px-3 pb-2 space-y-1 text-sm">
        {order.items.map((item, i) => (
          <li key={i}>
            <span className="font-medium">{item.name}</span>
            {item.quantity > 1 && <span> × {item.quantity}</span>}
            {item.modifiers?.length ? <span> + {item.modifiers.join(", ")}</span> : null}
            {item.note ? <span className="block text-xs italic">Note: {item.note}</span> : null}
          </li>
        ))}
      </ul>
      {next && (
        <div className="p-2 border-t border-[var(--border)]">
          <Button
            size="sm"
            className="w-full min-h-[40px]"
            onClick={() => onStatusChange(order.id, next)}
          >
            Mark {next === "PREPARING" ? "Preparing" : "Ready"}
          </Button>
        </div>
      )}
    </motion.article>
  );
}
