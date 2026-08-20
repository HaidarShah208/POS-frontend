"use client";

import { useMemo, useState, useCallback } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageMotion } from "@/components/shared/PageMotion";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { useGetOrdersQuery, useUpdateOrderStatusMutation } from "@/redux/api/ordersEndpoints";
import { cn, formatCurrency } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types/api/index";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  ClipboardList,
  Calendar,
  Hash,
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
  ShoppingBag,
  Truck,
  Car,
  Banknote,
  CreditCard,
  Smartphone,
  X,
} from "lucide-react";

const DATE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "last_week", label: "Last 7 days" },
  { value: "last_month", label: "Last 30 days" },
  { value: "last_6_months", label: "Last 6 months" },
  { value: "last_year", label: "Last year" },
] as const;

type StatusFilterValue = OrderStatus | "all";

const STATUS_TABS: { value: StatusFilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_BADGE_VARIANT: Record<string, "success" | "destructive" | "warning" | "secondary" | "info" | "purple"> = {
  pending: "warning",
  accepted: "info",
  preparing: "purple",
  ready: "success",
  completed: "success",
  cancelled: "destructive",
};

const ORDER_TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  "dine-in": UtensilsCrossed,
  takeaway: ShoppingBag,
  delivery: Truck,
  "drive-through": Car,
};

const PAYMENT_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  cash: Banknote,
  card: CreditCard,
  mobile: Smartphone,
};

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
      return { dateFrom: toDate(new Date(today.getTime() - 365 * 86_400_000)), dateTo: toDate(tomorrow) };
  }
}

function filterOrdersBySearch(orders: Order[], search: string): Order[] {
  if (!search.trim()) return orders;
  const q = search.trim().toLowerCase();
  return orders.filter((o) => {
    if ((o.orderNumber ?? "").toLowerCase().includes(q)) return true;
    if (String(o.tokenNumber ?? "").toLowerCase().includes(q)) return true;
    return (o.items ?? []).some((item) => (item.name ?? "").toLowerCase().includes(q));
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

function formatDate(iso: string) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${d.getFullYear()}`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function OrderDetailDrawer({
  order,
  open,
  onOpenChange,
}: {
  order: Order | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [updateStatus, { isLoading: updating }] = useUpdateOrderStatusMutation();

  if (!order) return null;

  const TypeIcon = ORDER_TYPE_ICON[order.orderType] ?? UtensilsCrossed;
  const PayIcon = PAYMENT_ICON[order.paymentMethod] ?? Banknote;
  const badgeVariant = STATUS_BADGE_VARIANT[order.status] ?? "secondary";

  const NEXT_STATUS: Partial<Record<OrderStatus, { label: string; status: OrderStatus }>> = {
    pending: { label: "Accept Order", status: "accepted" },
    accepted: { label: "Start Preparing", status: "preparing" },
    preparing: { label: "Mark Ready", status: "ready" },
    ready: { label: "Complete Order", status: "completed" },
  };
  const nextAction = NEXT_STATUS[order.status];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="right" className="max-w-md flex flex-col">
        <DrawerHeader className="flex flex-row items-center justify-between">
          <DrawerTitle>Order Details</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon"><X className="w-5 h-5" /></Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold">#{order.orderNumber}</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                Token: {order.tokenNumber}
              </p>
            </div>
            <Badge variant={badgeVariant} className="capitalize text-xs">
              {order.status}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(order.createdAt)}
            </span>
            <span>{formatTime(order.createdAt)}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm">
              <TypeIcon className="h-4 w-4 text-[var(--muted-foreground)]" />
              <span className="capitalize">{order.orderType.replace("-", " ")}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm">
              <PayIcon className="h-4 w-4 text-[var(--muted-foreground)]" />
              <span className="capitalize">{order.paymentMethod}</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
              Items
            </p>
            <div className="rounded-lg border border-[var(--border)] divide-y divide-[var(--border)]">
              {(order.items ?? []).map((item, i) => (
                <div key={`${item.productId ?? i}`} className="flex items-center justify-between px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-[11px] text-[var(--muted-foreground)]">
                      {formatCurrency(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-medium tabular-nums shrink-0 ml-2">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-[var(--border)] p-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Subtotal</span>
              <span className="tabular-nums">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Tax</span>
              <span className="tabular-nums">{formatCurrency(order.tax)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">Discount</span>
                <span className="text-[var(--destructive)] tabular-nums">-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold pt-2 border-t border-[var(--border)]">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(order.grandTotal)}</span>
            </div>
          </div>

          {nextAction && order.status !== "completed" && order.status !== "cancelled" && (
            <Button
              className="w-full"
              onClick={() => updateStatus({ id: order.id, status: nextAction.status })}
              disabled={updating}
            >
              {updating ? "Updating..." : nextAction.label}
            </Button>
          )}

          {order.status !== "cancelled" && order.status !== "completed" && (
            <Button
              variant="outline"
              className="w-full text-[var(--destructive)]"
              onClick={() => updateStatus({ id: order.id, status: "cancelled" })}
              disabled={updating}
            >
              Cancel Order
            </Button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default function OrdersPage() {
  const [datePreset, setDatePreset] = useState<(typeof DATE_PRESETS)[number]["value"]>("last_month");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { dateFrom, dateTo } = useMemo(() => getDateRange(datePreset), [datePreset]);

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { page, limit: perPage, dateFrom, dateTo };
    if (statusFilter !== "all") params.status = statusFilter;
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    return params;
  }, [page, perPage, statusFilter, dateFrom, dateTo, debouncedSearch]);

  const { data: ordersResponse, isLoading, isFetching } = useGetOrdersQuery(queryParams);

  const orders = ordersResponse?.data ?? [];
  const total = ordersResponse?.total ?? 0;
  const totalPages = ordersResponse?.totalPages ?? 1;
  const filteredOrders = orders;
  const start = total === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);
  const pageNumbers = useMemo(() => getPageNumbers(page, totalPages), [page, totalPages]);

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setPage(1);
  };

  return (
    <PageMotion>
      <PageHeader
        title="Orders"
        description={`${total} order${total !== 1 ? "s" : ""} found`}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 min-w-0 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-10"
          />
        </div>
        <select
          value={datePreset}
          onChange={(e) => {
            setDatePreset(e.target.value as (typeof DATE_PRESETS)[number]["value"]);
            setPage(1);
          }}
          className="h-10 rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm sm:w-auto"
        >
          {DATE_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scroll-area-thin">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.value}
            variant={statusFilter === tab.value ? "default" : "outline"}
            size="sm"
            className="shrink-0"
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title={orders.length === 0 ? "No orders found" : "No matching orders"}
          description={orders.length === 0 ? "No orders in this date range and status." : "Try a different search term."}
          icon={<ClipboardList className="h-6 w-6" />}
        />
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const items = order.items ?? [];
            const TypeIcon = ORDER_TYPE_ICON[order.orderType] ?? UtensilsCrossed;
            const badgeVariant = STATUS_BADGE_VARIANT[order.status] ?? "secondary";

            return (
              <Card
                key={order.id}
                className="cursor-pointer hover:shadow-[var(--shadow-sm)] transition-shadow"
                onClick={() => setSelectedOrder(order)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">#{order.orderNumber}</span>
                        <span className="text-xs text-[var(--muted-foreground)] font-medium">
                          T-{order.tokenNumber}
                        </span>
                      </div>
                    </div>
                    <Badge variant={badgeVariant} className="capitalize shrink-0">
                      {order.status}
                    </Badge>
                  </div>

                  <div className="space-y-1 mb-3">
                    {items.slice(0, 3).map((item, i) => (
                      <p key={`${item.productId ?? i}`} className="text-sm text-[var(--foreground)] truncate">
                        {item.name}
                        <span className="text-[var(--muted-foreground)]"> × {item.quantity}</span>
                      </p>
                    ))}
                    {items.length > 3 && (
                      <p className="text-xs text-[var(--muted-foreground)]">
                        +{items.length - 3} more item{items.length - 3 > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <TypeIcon className="h-3.5 w-3.5" />
                        <span className="capitalize">{order.orderType.replace("-", " ")}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(order.createdAt)} {formatTime(order.createdAt)}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-[var(--foreground)] tabular-nums">
                      {formatCurrency(order.grandTotal)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {total > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-[var(--border)] pt-4">
          <div className="flex items-center gap-3">
            <p className="text-sm text-[var(--muted-foreground)]">
              {start}–{end} of {total}
            </p>
            <select
              value={perPage}
              onChange={(e) => handlePerPageChange(Number(e.target.value))}
              className="h-8 rounded-md border border-[var(--border)] bg-transparent px-2 py-1 text-sm"
            >
              {PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n} / page</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {pageNumbers.map((n, i) =>
              n === "ellipsis" ? (
                <span key={`e-${i}`} className="h-8 w-8 flex items-center justify-center text-[var(--muted-foreground)] text-sm">
                  …
                </span>
              ) : (
                <Button
                  key={n}
                  variant={page === n ? "default" : "outline"}
                  size="sm"
                  className="h-8 min-w-[32px] px-2"
                  onClick={() => setPage(n)}
                >
                  {n}
                </Button>
              )
            )}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <OrderDetailDrawer
        order={selectedOrder}
        open={!!selectedOrder}
        onOpenChange={(v) => !v && setSelectedOrder(null)}
      />
    </PageMotion>
  );
}
