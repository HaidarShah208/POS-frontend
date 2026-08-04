"use client";

import { useEffect, useRef, useCallback } from "react";
import { useOnlineStatus, useOfflineQueue } from "@/hooks/useOnlineStatus";
import { useAppDispatch } from "@/hooks/redux";
import { addNotification } from "@/redux/slices/notificationSlice";
import { toast } from "sonner";

const PRODUCTS_CACHE_KEY = "pos-offline-products";
const CATEGORIES_CACHE_KEY = "pos-offline-categories";
const SYNC_INTERVAL = 30_000;
const MAX_RETRIES = 5;

export function cacheForOffline(key: string, data: unknown) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

export function getOfflineCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export { PRODUCTS_CACHE_KEY, CATEGORIES_CACHE_KEY };

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const isOnline = useOnlineStatus();
  const { queue, dequeue, incrementRetry } = useOfflineQueue();
  const dispatch = useAppDispatch();
  const syncingRef = useRef(false);

  const processQueue = useCallback(async () => {
    if (!isOnline || syncingRef.current || queue.length === 0) return;
    syncingRef.current = true;

    for (const item of queue) {
      if (item.retries >= MAX_RETRIES) {
        toast.error(`Failed to sync order after ${MAX_RETRIES} attempts. Removing from queue.`);
        dispatch(addNotification({ type: "error", title: "Sync Failed", message: `Order queued at ${item.createdAt} could not be synced after ${MAX_RETRIES} retries.`, priority: "high" }));
        dequeue(item.id);
        continue;
      }
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const res = await fetch(`${apiUrl}/api/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload),
        });
        if (res.ok) {
          dequeue(item.id);
          dispatch(addNotification({ type: "success", title: "Order Synced", message: `Offline order synced successfully.`, priority: "medium" }));
          toast.success("Offline order synced successfully");
        } else {
          incrementRetry(item.id);
        }
      } catch {
        incrementRetry(item.id);
      }
    }
    syncingRef.current = false;
  }, [isOnline, queue, dequeue, incrementRetry, dispatch]);

  useEffect(() => {
    if (!isOnline) return;
    processQueue();
    const interval = setInterval(processQueue, SYNC_INTERVAL);
    return () => clearInterval(interval);
  }, [isOnline, processQueue]);

  return <>{children}</>;
}
