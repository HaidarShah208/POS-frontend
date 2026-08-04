"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Plus, X, ShoppingCart, ClipboardList, Package,
  Users, LayoutGrid, Banknote,
} from "lucide-react";

const ACTIONS = [
  { id: "pos", label: "New Order", href: "/pos", icon: <ShoppingCart className="h-4 w-4" />, color: "bg-blue-500 text-white" },
  { id: "orders", label: "Orders", href: "/orders", icon: <ClipboardList className="h-4 w-4" />, color: "bg-emerald-500 text-white" },
  { id: "products", label: "Products", href: "/products", icon: <Package className="h-4 w-4" />, color: "bg-violet-500 text-white" },
  { id: "customers", label: "Customers", href: "/customers", icon: <Users className="h-4 w-4" />, color: "bg-amber-500 text-white" },
  { id: "floor", label: "Floor Plan", href: "/floor", icon: <LayoutGrid className="h-4 w-4" />, color: "bg-pink-500 text-white" },
  { id: "cash", label: "Cash Register", href: "/cash-register", icon: <Banknote className="h-4 w-4" />, color: "bg-teal-500 text-white" },
];

export function QuickActionsFAB() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 lg:hidden" ref={ref}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-16 right-0 mb-2 space-y-2"
          >
            {ACTIONS.map((action, i) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                transition={{ delay: i * 0.04 }}
                type="button"
                onClick={() => { router.push(action.href); setOpen(false); }}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <span className="rounded-lg bg-[var(--background)] border border-[var(--border)] shadow-[var(--shadow-md)] px-3 py-1.5 text-xs font-medium">
                  {action.label}
                </span>
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-full shadow-lg", action.color)}>
                  {action.icon}
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen(!open)}
        animate={{ rotate: open ? 45 : 0 }}
        transition={{ duration: 0.2 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xl hover:shadow-2xl transition-shadow"
        aria-label="Quick actions"
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </motion.button>
    </div>
  );
}
