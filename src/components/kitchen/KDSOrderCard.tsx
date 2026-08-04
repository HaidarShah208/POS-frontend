"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { KitchenOrder, KitchenOrderStatus } from "@/types/api";
import { cn } from "@/lib/utils";
import {
  ChefHat,
  CheckCircle2,
  Flame,
  UtensilsCrossed,
  ShoppingBag,
  Truck,
  Car,
  Timer,
  StickyNote,
  ArrowRight,
  AlertTriangle,
  Ban,
  ConciergeBell,
  Zap,
  Crown,
  XCircle,
} from "lucide-react";

type KDSOrderCardProps = {
  order: KitchenOrder;
  onStatusChange: (orderId: string, status: KitchenOrderStatus) => void;
  onCancel?: (orderId: string) => void;
};

function useElapsed(createdAt: string) {
  const [elapsed, setElapsed] = useState("");
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    function calc() {
      const sec = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
      setSeconds(sec);
      if (sec < 60) return `${sec}s`;
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}:${String(s).padStart(2, "0")}`;
    }
    setElapsed(calc());
    const id = setInterval(() => setElapsed(calc()), 1000);
    return () => clearInterval(id);
  }, [createdAt]);
  return { elapsed, seconds };
}

const STATUS_CONFIG: Record<
  KitchenOrderStatus,
  {
    label: string;
    headerGradient: string;
    accentColor: string;
    borderColor: string;
    icon: React.ReactNode;
  }
> = {
  NEW: {
    label: "New Order",
    headerGradient: "bg-gradient-to-r from-amber-500 to-orange-500",
    accentColor: "text-amber-600",
    borderColor: "border-l-amber-500",
    icon: <Flame className="h-4 w-4" />,
  },
  PREPARING: {
    label: "Preparing",
    headerGradient: "bg-gradient-to-r from-blue-500 to-indigo-500",
    accentColor: "text-blue-600",
    borderColor: "border-l-blue-500",
    icon: <ChefHat className="h-4 w-4" />,
  },
  READY: {
    label: "Ready",
    headerGradient: "bg-gradient-to-r from-emerald-500 to-teal-500",
    accentColor: "text-emerald-600",
    borderColor: "border-l-emerald-500",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  SERVED: {
    label: "Served",
    headerGradient: "bg-gradient-to-r from-slate-500 to-slate-600",
    accentColor: "text-slate-600",
    borderColor: "border-l-slate-400",
    icon: <ConciergeBell className="h-4 w-4" />,
  },
  CANCELLED: {
    label: "Cancelled",
    headerGradient: "bg-gradient-to-r from-red-500 to-rose-600",
    accentColor: "text-red-600",
    borderColor: "border-l-red-500",
    icon: <Ban className="h-4 w-4" />,
  },
};

const ORDER_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  "dine-in": { label: "Dine-in", icon: <UtensilsCrossed className="h-3.5 w-3.5" /> },
  takeaway: { label: "Takeaway", icon: <ShoppingBag className="h-3.5 w-3.5" /> },
  delivery: { label: "Delivery", icon: <Truck className="h-3.5 w-3.5" /> },
  "drive-through": { label: "Drive Thru", icon: <Car className="h-3.5 w-3.5" /> },
};

const NEXT_ACTION: Record<string, { label: string; bg: string; icon: React.ReactNode }> = {
  PREPARING: {
    label: "Start Preparing",
    bg: "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-sm",
    icon: <ChefHat className="h-4 w-4" />,
  },
  READY: {
    label: "Mark Ready",
    bg: "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-sm",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  SERVED: {
    label: "Mark Served",
    bg: "bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white shadow-sm",
    icon: <ConciergeBell className="h-4 w-4" />,
  },
};

const PRIORITY_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  rush: {
    label: "RUSH",
    icon: <Zap className="h-3 w-3" />,
    className: "bg-red-500/20 text-red-100 border border-red-400/30",
  },
  vip: {
    label: "VIP",
    icon: <Crown className="h-3 w-3" />,
    className: "bg-purple-500/20 text-purple-100 border border-purple-400/30",
  },
};

function TimerBadge({ elapsed, seconds, status }: { elapsed: string; seconds: number; status: KitchenOrderStatus }) {
  const isUrgent = (status === "NEW" && seconds > 300) || (status === "PREPARING" && seconds > 600);
  const isWarning = (status === "NEW" && seconds > 120 && seconds <= 300) || (status === "PREPARING" && seconds > 300 && seconds <= 600);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-xs font-semibold tabular-nums",
        isUrgent
          ? "bg-red-500/20 text-red-100 animate-pulse"
          : isWarning
            ? "bg-amber-500/20 text-amber-100"
            : "bg-white/15 text-white/90"
      )}
    >
      <Timer className="h-3 w-3" />
      {elapsed}
    </span>
  );
}

function DelayWarning({ seconds, status }: { seconds: number; status: KitchenOrderStatus }) {
  const isDelayed = (status === "NEW" && seconds > 300) || (status === "PREPARING" && seconds > 600);
  if (!isDelayed) return null;

  const delayMinutes = status === "NEW"
    ? Math.floor((seconds - 300) / 60)
    : Math.floor((seconds - 600) / 60);

  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      <span>Delayed {delayMinutes > 0 ? `by ${delayMinutes}m` : "— action needed"}</span>
    </div>
  );
}

export function KDSOrderCard(props: KDSOrderCardProps) {
  const { order, onStatusChange, onCancel } = props;
  const { elapsed, seconds } = useElapsed(order.createdAt);
  const config = STATUS_CONFIG[order.status];
  const typeConfig = ORDER_TYPE_CONFIG[order.orderType] ?? { label: order.orderType, icon: null };
  const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);
  const isUrgent = (order.status === "NEW" && seconds > 300) || (order.status === "PREPARING" && seconds > 600);
  const priorityConfig = order.priority && order.priority !== "normal" ? PRIORITY_CONFIG[order.priority] : null;

  const next: KitchenOrderStatus | null =
    order.status === "NEW" ? "PREPARING"
      : order.status === "PREPARING" ? "READY"
        : order.status === "READY" ? "SERVED"
          : null;

  const isTerminal = order.status === "SERVED" || order.status === "CANCELLED";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl bg-[var(--card)] shadow-md transition-shadow hover:shadow-lg border border-[var(--border)]",
        isUrgent && "ring-2 ring-red-400/60 ring-offset-2",
        priorityConfig && order.priority === "rush" && "ring-2 ring-red-300/50 ring-offset-1",
        priorityConfig && order.priority === "vip" && "ring-2 ring-purple-300/50 ring-offset-1",
        isTerminal && "opacity-70"
      )}
    >
      <div className={cn("px-3.5 py-2.5", config.headerGradient)}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base font-bold text-white tracking-tight leading-none truncate">
              #{order.token}
            </span>
            {priorityConfig && (
              <span className={cn("inline-flex items-center gap-1 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", priorityConfig.className)}>
                {priorityConfig.icon}
                {priorityConfig.label}
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
            {config.icon}
            {config.label}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-1.5">
          <div className="flex items-center gap-1.5 text-white/80 text-[11px]">
            {typeConfig.icon}
            <span className="font-medium">{typeConfig.label}</span>
            <span className="opacity-60">·</span>
            <span>{totalItems} item{totalItems !== 1 ? "s" : ""}</span>
          </div>
          {!isTerminal && (
            <TimerBadge elapsed={elapsed} seconds={seconds} status={order.status} />
          )}
        </div>
      </div>

      {!isTerminal && <DelayWarning seconds={seconds} status={order.status} />}

      {order.kitchenNotes && (
        <div className="mx-3 mt-2 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
          <StickyNote className="h-3.5 w-3.5 mt-0.5 shrink-0 text-blue-500" />
          <span className="text-xs text-blue-700 font-medium leading-snug">{order.kitchenNotes}</span>
        </div>
      )}

      <ul className={cn("min-h-0 flex-1 overflow-y-auto sm:max-h-[35vh]", config.borderColor, "border-l-4")}>
        {order.items.map((item, i) => (
          <li key={i} className="border-b border-[var(--border)]/40 last:border-0">
            <div className="flex items-start gap-3 px-4 py-3">
              <span className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums text-white",
                order.status === "NEW" ? "bg-amber-500"
                  : order.status === "PREPARING" ? "bg-blue-500"
                    : order.status === "CANCELLED" ? "bg-red-500"
                      : "bg-emerald-500"
              )}>
                {item.quantity}x
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-semibold leading-snug", order.status === "CANCELLED" && "line-through opacity-60")}>
                  {item.name}
                </p>
                {item.modifiers && item.modifiers.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {item.modifiers.map((m) => (
                      <span key={m} className="inline-flex items-center rounded-md bg-[var(--muted)] px-1.5 py-0.5 text-[10px] font-medium">
                        + {m}
                      </span>
                    ))}
                  </div>
                )}
                {item.note && (
                  <div className="mt-1.5 flex items-start gap-1.5 rounded-md bg-amber-50 px-2 py-1.5">
                    <StickyNote className="h-3 w-3 mt-0.5 shrink-0 text-amber-500" />
                    <span className="text-xs text-amber-700 italic leading-snug">{item.note}</span>
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {next && !isTerminal ? (
        <div className="shrink-0 p-3 bg-[var(--muted)]/5 space-y-2">
          <Button
            className={cn("h-12 w-full font-bold text-sm rounded-xl gap-2 transition-all", NEXT_ACTION[next].bg)}
            onClick={() => onStatusChange(order.id, next)}
          >
            {NEXT_ACTION[next].icon}
            {NEXT_ACTION[next].label}
            <ArrowRight className="h-4 w-4 ml-auto" />
          </Button>
          {onCancel && order.status !== "READY" && (
            <Button
              variant="ghost"
              className="h-9 w-full text-xs text-[var(--muted-foreground)] hover:text-red-600 hover:bg-red-50 rounded-lg gap-1.5"
              onClick={() => onCancel(order.id)}
            >
              <XCircle className="h-3.5 w-3.5" />
              Cancel Order
            </Button>
          )}
        </div>
      ) : order.status === "SERVED" ? (
        <div className="shrink-0 bg-slate-50 px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-500 text-white">
              <ConciergeBell className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm font-bold text-slate-600">Served</span>
          </div>
        </div>
      ) : order.status === "CANCELLED" ? (
        <div className="shrink-0 bg-red-50 px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white">
              <Ban className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm font-bold text-red-600">Cancelled</span>
          </div>
        </div>
      ) : (
        <div className="shrink-0 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm font-bold text-emerald-700">Ready for Pickup</span>
          </div>
        </div>
      )}
    </motion.article>
  );
}
