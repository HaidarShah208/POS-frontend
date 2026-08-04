"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import { markAsRead, markAllAsRead, removeNotification, clearAll } from "@/redux/slices/notificationSlice";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NotificationType } from "@/types/notification";
import {
  Bell, Check, CheckCheck, Trash2, X, ShoppingCart, ChefHat,
  AlertTriangle, Info, CheckCircle2, XCircle, Package,
} from "lucide-react";

const TYPE_CONFIG: Record<NotificationType, { icon: React.ReactNode; color: string }> = {
  order: { icon: <ShoppingCart className="h-4 w-4" />, color: "text-blue-600 bg-blue-100" },
  kitchen: { icon: <ChefHat className="h-4 w-4" />, color: "text-amber-600 bg-amber-100" },
  inventory: { icon: <Package className="h-4 w-4" />, color: "text-purple-600 bg-purple-100" },
  system: { icon: <Info className="h-4 w-4" />, color: "text-slate-600 bg-slate-100" },
  success: { icon: <CheckCircle2 className="h-4 w-4" />, color: "text-emerald-600 bg-emerald-100" },
  error: { icon: <XCircle className="h-4 w-4" />, color: "text-red-600 bg-red-100" },
  warning: { icon: <AlertTriangle className="h-4 w-4" />, color: "text-amber-600 bg-amber-100" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function NotificationCenter() {
  const dispatch = useAppDispatch();
  const { notifications, unreadCount } = useAppSelector((s) => s.notifications);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="icon" className="relative h-9 w-9" onClick={() => setOpen(!open)}>
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-lg)] z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => dispatch(markAllAsRead())}>
                    <CheckCheck className="h-3 w-3" />Read all
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-red-500 hover:text-red-600" onClick={() => dispatch(clearAll())}>
                    <Trash2 className="h-3 w-3" />Clear
                  </Button>
                )}
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="h-8 w-8 text-[var(--muted-foreground)] mb-2" />
                  <p className="text-sm font-medium">No notifications</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">You&apos;re all caught up</p>
                </div>
              ) : (
                <div>
                  {notifications.map((notif) => {
                    const cfg = TYPE_CONFIG[notif.type];
                    return (
                      <div key={notif.id}
                        className={cn("flex gap-3 px-4 py-3 transition-colors hover:bg-[var(--muted)]/30 border-b border-[var(--border)] last:border-0",
                          !notif.read && "bg-[var(--primary)]/[0.03]")}>
                        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5", cfg.color)}>
                          {cfg.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className={cn("text-sm truncate", !notif.read ? "font-semibold" : "font-medium")}>{notif.title}</p>
                              <p className="text-xs text-[var(--muted-foreground)] mt-0.5 line-clamp-2">{notif.message}</p>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              {!notif.read && (
                                <button type="button" onClick={() => dispatch(markAsRead(notif.id))}
                                  className="p-1 rounded hover:bg-[var(--muted)] transition-colors" title="Mark as read">
                                  <Check className="h-3 w-3 text-[var(--muted-foreground)]" />
                                </button>
                              )}
                              <button type="button" onClick={() => dispatch(removeNotification(notif.id))}
                                className="p-1 rounded hover:bg-[var(--muted)] transition-colors" title="Remove">
                                <X className="h-3 w-3 text-[var(--muted-foreground)]" />
                              </button>
                            </div>
                          </div>
                          <p className="text-[10px] text-[var(--muted-foreground)] mt-1">{timeAgo(notif.createdAt)}</p>
                        </div>
                        {!notif.read && <span className="flex h-2 w-2 rounded-full bg-[var(--primary)] shrink-0 mt-2" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
