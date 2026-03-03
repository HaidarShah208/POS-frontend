"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TokenDisplay } from "@/components/pos/TokenDisplay";
import { useGetOrdersQuery } from "@/redux/api/ordersEndpoints";
import { formatCurrency } from "@/lib/utils";
import type { Order } from "@/types/api/index";

const DATE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "last_week", label: "Last week" },
  { value: "last_month", label: "Last month" },
  { value: "last_6_months", label: "Last 6 months" },
  { value: "last_year", label: "Last year" },
] as const;

function getDateRange(preset: (typeof DATE_PRESETS)[number]["value"]): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const pad = (n: number) => String(n).padStart(2, "0");
  const toDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  switch (preset) {
    case "today":
      return { dateFrom: toDate(today), dateTo: toDate(tomorrow) };
    case "last_week": {
      const from = new Date(today);
      from.setDate(from.getDate() - 7);
      return { dateFrom: toDate(from), dateTo: toDate(tomorrow) };
    }
    case "last_month": {
      const from = new Date(today);
      from.setMonth(from.getMonth() - 1);
      return { dateFrom: toDate(from), dateTo: toDate(tomorrow) };
    }
    case "last_6_months": {
      const from = new Date(today);
      from.setMonth(from.getMonth() - 6);
      return { dateFrom: toDate(from), dateTo: toDate(tomorrow) };
    }
    case "last_year": {
      const from = new Date(today);
      from.setFullYear(from.getFullYear() - 1);
      return { dateFrom: toDate(from), dateTo: toDate(tomorrow) };
    }
    default:
      return { dateFrom: toDate(new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)), dateTo: toDate(tomorrow) };
  }
}

function filterOrdersBySearch(orders: Order[], search: string): Order[] {
  if (!search.trim()) return orders;
  const q = search.trim().toLowerCase();
  return orders.filter(
    (o) =>
      (o.orderNumber ?? "").toLowerCase().includes(q) ||
      String(o.tokenNumber ?? "").toLowerCase().includes(q)
  );
}

export default function OrdersPage() {
  const [datePreset, setDatePreset] = useState<(typeof DATE_PRESETS)[number]["value"]>("last_month");
  const [search, setSearch] = useState("");

  const { dateFrom, dateTo } = useMemo(() => getDateRange(datePreset), [datePreset]);

  const { data: ordersResponse, isLoading } = useGetOrdersQuery({
    limit: 200,
    dateFrom,
    dateTo,
  });

  const orders = ordersResponse?.data ?? [];
  const filteredOrders = useMemo(() => filterOrdersBySearch(orders, search), [orders, search]);
  const totalCount = search.trim() ? filteredOrders.length : (ordersResponse?.total ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-[var(--muted-foreground)]">
            {totalCount} order{totalCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-3">
        
          <Input
            placeholder="Search by order name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 min-w-[200px] flex-1 sm:flex-none sm:max-w-full"
          />
        </div>
        <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value as (typeof DATE_PRESETS)[number]["value"])}
            className="h-10 min-w-[180px] flex-1 sm:flex-none rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
          >
            {DATE_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
      </div>

      {isLoading ? (
        <div className="h-48 rounded-lg border border-[var(--border)] animate-pulse bg-[var(--muted)]/30" />
      ) : filteredOrders.length === 0 ? (
        <p className="text-[var(--muted-foreground)]">
          {orders.length === 0 ? "No orders in this date range." : "No orders match your search."}
        </p>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                 
                <Badge
                  variant={
                    order.status === "completed"
                      ? "success"
                      : order.status === "cancelled"
                        ? "destructive"
                        : "warning"
                  }
                >
                  {order.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {(order.items?.length ?? 0)} item(s) · {formatCurrency(order.grandTotal)}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}
