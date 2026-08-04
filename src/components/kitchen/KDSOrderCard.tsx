"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TokenDisplay } from "@/components/pos/TokenDisplay";
import type { KitchenOrder, KitchenOrderStatus } from "@/types/api";
import { cn } from "@/lib/utils";
import {
  ChefHat,
  CheckCircle2,
  Flame,
  UtensilsCrossed,
  ShoppingBag,
  Truck,
  Clock,
  StickyNote,
} from "lucide-react";

type KDSOrderCardProps = {
  order: KitchenOrder;
  onStatusChange: (orderId: string, status: KitchenOrderStatus) => void;
};

function useElapsed(createdAt: string) {
  const [elapsed, setElapsed] = useState("");
  useEffect(() => {
    function calc() {
      const sec = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
      if (sec < 60) return `${sec}s`;
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}:${String(s).padStart(2, "0")}`;
    }
    setElapsed(calc());
    const id = setInterval(() => setElapsed(calc()), 1000);
    return () => clearInterval(id);
  }, [createdAt]);
  return elapsed;
}

const STATUS_CONFIG: Record<
  KitchenOrderStatus,
  { label: string; border: string; header: string; bg: string; icon: React.ReactNode }
> = {
  NEW: {
    label: "New",
    border: "border-amber-400",
    header: "bg-amber-500 text-white",
    bg: "bg-amber-50",
    icon: <Flame className="h-4 w-4" />,
  },
  PREPARING: {
    label: "Preparing",
    border: "border-blue-400",
    header: "bg-blue-500 text-white",
    bg: "bg-blue-50",
    icon: <ChefHat className="h-4 w-4" />,
  },
  READY: {
    label: "Ready",
    border: "border-emerald-400",
    header: "bg-emerald-500 text-white",
    bg: "bg-emerald-50",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
};

const ORDER_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  "dine-in": { label: "Dine-in", icon: <UtensilsCrossed className="h-3 w-3" /> },
  takeaway: { label: "Takeaway", icon: <ShoppingBag className="h-3 w-3" /> },
  delivery: { label: "Delivery", icon: <Truck className="h-3 w-3" /> },
};

const NEXT_BUTTON: Record<string, { label: string; className: string }> = {
  PREPARING: { label: "Start Preparing", className: "bg-blue-500 hover:bg-blue-600 text-white" },
  READY: { label: "Mark Ready", className: "bg-emerald-500 hover:bg-emerald-600 text-white" },
};

export function KDSOrderCard(props: KDSOrderCardProps) {
  const { order, onStatusChange } = props;
  const next = order.status === "NEW" ? "PREPARING" : order.status === "PREPARING" ? "READY" : null;
  const elapsed = useElapsed(order.createdAt);
  const config = STATUS_CONFIG[order.status];
  const typeConfig = ORDER_TYPE_CONFIG[order.orderType] ?? { label: order.orderType, icon: null };
  const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);
  const isUrgent = order.status === "NEW" && (() => {
    const sec = (Date.now() - new Date(order.createdAt).getTime()) / 1000;
    return sec > 300;
  })();

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border-2 bg-[var(--card)] shadow-sm transition-shadow hover:shadow-md",
        config.border,
        isUrgent && "ring-2 ring-red-400 ring-offset-1"
      )}
    >
      <div className={cn("flex items-center justify-between px-4 py-2.5", config.header)}>
        <TokenDisplay token={order.token} size="sm" className="!bg-transparent !text-inherit !font-bold !text-xl !px-0 !py-0" />
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-white/20 px-2 py-0.5 font-mono text-xs tabular-nums backdrop-blur-sm">
            <Clock className="mr-1 inline h-3 w-3 -mt-px" />
            {elapsed}
          </span>
          <span className="flex items-center gap-1 text-xs font-bold opacity-90">
            {config.icon}
            {config.label}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--muted)]/15 px-4 py-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--foreground)]">
          {typeConfig.icon}
          <span>{typeConfig.label}</span>
        </div>
        <span className="text-xs text-[var(--muted-foreground)]">
          {totalItems} item{totalItems !== 1 ? "s" : ""}
        </span>
      </div>

      <ul className="min-h-0 flex-1 divide-y divide-[var(--border)]/50 overflow-y-auto px-4 text-sm sm:max-h-[35vh]">
        {order.items.map((item, i) => (
          <li key={i} className="py-2.5 first:pt-3 last:pb-3">
            <div className="flex items-start gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--muted)] text-xs font-bold tabular-nums">
                {item.quantity}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug">{item.name}</p>
                {item.modifiers && item.modifiers.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {item.modifiers.map((m) => (
                      <Badge key={m} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                        {m}
                      </Badge>
                    ))}
                  </div>
                )}
                {item.note && (
                  <p className="mt-1 flex items-start gap-1 text-xs text-amber-600">
                    <StickyNote className="h-3 w-3 mt-0.5 shrink-0" />
                    <span className="italic">{item.note}</span>
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {next ? (
        <div className="shrink-0 border-t border-[var(--border)] p-3">
          <Button
            size="sm"
            className={cn("h-11 w-full font-semibold text-sm", NEXT_BUTTON[next].className)}
            onClick={() => onStatusChange(order.id, next)}
          >
            {NEXT_BUTTON[next].label}
          </Button>
        </div>
      ) : (
        <div className="shrink-0 border-t border-[var(--border)] bg-emerald-50 px-4 py-3 text-center">
          <span className="flex items-center justify-center gap-1.5 text-sm font-semibold text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            Ready for pickup
          </span>
        </div>
      )}
    </motion.article>
  );
}
