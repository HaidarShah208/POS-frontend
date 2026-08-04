"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { WifiOff, Wifi } from "lucide-react";
import { useState, useEffect } from "react";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-amber-500 text-white overflow-hidden z-50"
        >
          <div className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>You are offline. Some features may be limited. Orders will sync when reconnected.</span>
          </div>
        </motion.div>
      )}
      {showReconnected && isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-emerald-500 text-white overflow-hidden z-50"
        >
          <div className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium">
            <Wifi className="h-4 w-4 shrink-0" />
            <span>Back online! Syncing pending data...</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
