"use client";

import { useState, useEffect, useCallback } from "react";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return isOnline;
}

const OFFLINE_QUEUE_KEY = "pos-offline-queue";

export type OfflineQueueItem = {
  id: string;
  type: "order";
  payload: unknown;
  createdAt: string;
  retries: number;
};

function loadQueue(): OfflineQueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function persistQueue(queue: OfflineQueueItem[]) {
  try { localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue)); } catch {}
}

export function useOfflineQueue() {
  const [queue, setQueue] = useState<OfflineQueueItem[]>(loadQueue);

  const enqueue = useCallback((item: Omit<OfflineQueueItem, "id" | "createdAt" | "retries">) => {
    setQueue((prev) => {
      const next = [...prev, { ...item, id: `oq-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, createdAt: new Date().toISOString(), retries: 0 }];
      persistQueue(next);
      return next;
    });
  }, []);

  const dequeue = useCallback((id: string) => {
    setQueue((prev) => {
      const next = prev.filter((i) => i.id !== id);
      persistQueue(next);
      return next;
    });
  }, []);

  const incrementRetry = useCallback((id: string) => {
    setQueue((prev) => {
      const next = prev.map((i) => i.id === id ? { ...i, retries: i.retries + 1 } : i);
      persistQueue(next);
      return next;
    });
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    persistQueue([]);
  }, []);

  return { queue, enqueue, dequeue, incrementRetry, clearQueue };
}
