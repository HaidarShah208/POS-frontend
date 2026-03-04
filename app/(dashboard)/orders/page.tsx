"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useGetOrdersQuery } from "@/redux/api/ordersEndpoints";
import { formatCurrency } from "@/lib/utils";
import type { Order } from "@/types/api/index";
import type { OrderStatus } from "@/types/api/index";
import { Skeleton } from "@/components/ui/skeleton";

const DATE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "last_week", label: "Last week" },
  { value: "last_month", label: "Last month" },
  { value: "last_6_months", label: "Last 6 months" },
  { value: "last_year", label: "Last year" },
] as const;

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
];

const PER_PAGE_OPTIONS = [10, 20, 50];

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
  return orders.filter((o) => {
    if ((o.orderNumber ?? "").toLowerCase().includes(q)) return true;
    if (String(o.tokenNumber ?? "").toLowerCase().includes(q)) return true;
    const matchItem = (o.items ?? []).some((item) => (item.name ?? "").toLowerCase().includes(q));
    return matchItem;
  });
}

function getPageNumbers(current: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | "ellipsis")[] = [1];
  if (current > 3) pages.push("ellipsis");
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);
  for (let i = start; i <= end; i++) if (!pages.includes(i)) pages.push(i);
  if (current < totalPages - 2) pages.push("ellipsis");
  if (totalPages > 1) pages.push(totalPages);
  return pages;
}

export default function OrdersPage() {
  const [datePreset, setDatePreset] = useState<(typeof DATE_PRESETS)[number]["value"]>("last_month");
  const [statusFilter, setStatusFilter] = useState<OrderStatus>("pending");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");

  const { dateFrom, dateTo } = useMemo(() => getDateRange(datePreset), [datePreset]);

  const { data: ordersResponse, isLoading } = useGetOrdersQuery({
    page,
    limit: perPage,
    status: statusFilter,
    dateFrom,
    dateTo,
  });

  const orders = ordersResponse?.data ?? [];
  const total = ordersResponse?.total ?? 0;
  const totalPages = ordersResponse?.totalPages ?? 1;
  const filteredOrders = useMemo(() => filterOrdersBySearch(orders, search), [orders, search]);
  const start = total === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);
  const pageNumbers = useMemo(() => getPageNumbers(page, totalPages), [page, totalPages]);

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setPage(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center ">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-[var(--muted-foreground)]">
            {total} order{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-row items-center gap-3">
        
          <Input
            placeholder="Search by order name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 min-w-[200px] flex-1 sm:flex-none sm:max-w-full"
          />
            <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as OrderStatus);
              setPage(1);
            }}
            className="h-10 min-w-[140px] rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={datePreset}
            onChange={(e) => {
              setDatePreset(e.target.value as (typeof DATE_PRESETS)[number]["value"]);
              setPage(1);
            }}
            className="h-10 min-w-[180px] flex-1 sm:flex-none rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
          >
            {DATE_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="flex items-center justify-between gap-3 pb-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <p className="text-[var(--muted-foreground)]">
          {orders.length === 0 ? "No orders in this date range." : "No orders match your search."}
        </p>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const firstItemName = order.items?.[0]?.name;
            const moreCount = Math.max(0, (order.items?.length ?? 0) - 1);
            return (
              <Card key={order.id}>
                <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <CardTitle className="text-base leading-tight truncate">
                        {firstItemName ?? "—"}
                         
                         

                        {moreCount > 0 && (
                          <span className="ml-2 text-sm font-normal text-[var(--muted-foreground)]">
                            +{moreCount} more
                          </span>
                        )}
                      </CardTitle>
                    </div>
                  </div>
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
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Order # {order.orderNumber}
                  </p>
                  <p className="text-sm pb-2 text-[var(--muted-foreground)]">
                    {(order.items?.length ?? 0)} item(s) · {formatCurrency(order.grandTotal)}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] flex justify-between items-center">
                    <span>
                      {(() => {
                        const d = new Date(order.createdAt);
                        const day = String(d.getDate()).padStart(2, "0");
                        const month = String(d.getMonth() + 1).padStart(2, "0");
                        const year = d.getFullYear();
                        return `${day}-${month}-${year}`;
                      })()}
                    </span>
                    <span>
                      {new Date(order.createdAt).toLocaleTimeString("en-PK", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {total > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-[var(--border)] pt-4">
      <div className="flex flex-row items-center gap-3">
      <p className="text-sm text-[var(--muted-foreground)]">
            Results: {start} – {end} of {total}
          </p>
          <select
              value={perPage}
              onChange={(e) => handlePerPageChange(Number(e.target.value))}
              className="h-9 rounded-md border border-[var(--border)] bg-transparent px-3 py-1 text-sm"
            >
              {PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
      </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-9 w-9 rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--muted)]/50"
                aria-label="Previous page"
              >
                ‹
              </button>
              {pageNumbers.map((n, i) =>
                n === "ellipsis" ? (
                  <span key={`e-${i}`} className="h-9 w-9 flex items-center justify-center text-[var(--muted-foreground)]">
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={`h-9 min-w-[36px] rounded-md border px-2 text-sm font-medium ${
                      page === n
                        ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                        : "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]/50"
                    }`}
                  >
                    {n}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-9 w-9 rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--muted)]/50"
                aria-label="Next page"
              >
                ›
              </button>
            </div>
           
          </div>
        </div>
      )}
    </motion.div>
  );
}
