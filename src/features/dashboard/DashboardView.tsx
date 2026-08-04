"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Package,
  AlertTriangle,
  ChefHat,
  Warehouse,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { PageMotion } from "@/components/shared/PageMotion";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatsCard } from "@/components/admin/StatsCard";
import { ChartCard } from "@/components/admin/ChartCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetOrdersQuery } from "@/redux/api/ordersEndpoints";
import { useGetInventoryQuery } from "@/redux/api/inventoryEndpoints";
import { formatCurrency } from "@/lib/utils";
import type { Order } from "@/types/api/index";

function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function computeAnalytics(orders: Order[]) {
  const now = new Date();
  const todayKey = toDateKey(now);
  const yesterdayKey = toDateKey(new Date(now.getTime() - 86_400_000));

  const todayOrders = orders.filter((o) => (o.createdAt ?? "").startsWith(todayKey));
  const yesterdayOrders = orders.filter((o) => (o.createdAt ?? "").startsWith(yesterdayKey));

  const todayRevenue = todayOrders.reduce((s, o) => s + safeNum(o.grandTotal), 0);
  const yesterdayRevenue = yesterdayOrders.reduce((s, o) => s + safeNum(o.grandTotal), 0);
  const todayCount = todayOrders.length;
  const todayCompleted = todayOrders.filter((o) => o.status === "completed").length;
  const todayCancelled = todayOrders.filter((o) => o.status === "cancelled").length;
  const todayPending = todayOrders.filter(
    (o) => o.status === "pending" || o.status === "accepted" || o.status === "preparing"
  ).length;
  const avgOrderValue = todayCount > 0 ? todayRevenue / todayCount : 0;

  const revenueTrend =
    yesterdayRevenue > 0
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
      : todayRevenue > 0
        ? 100
        : 0;

  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const weeklyRevenue = orders
    .filter((o) => new Date(o.createdAt) >= weekAgo)
    .reduce((s, o) => s + safeNum(o.grandTotal), 0);

  const monthAgo = new Date(now);
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const monthlyRevenue = orders
    .filter((o) => new Date(o.createdAt) >= monthAgo)
    .reduce((s, o) => s + safeNum(o.grandTotal), 0);

  const salesByDay: { date: string; label: string; sales: number; orders: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000);
    const ds = toDateKey(d);
    const dayOrders = orders.filter((o) => (o.createdAt ?? "").startsWith(ds));
    salesByDay.push({
      date: ds,
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      sales: dayOrders.reduce((s, o) => s + safeNum(o.grandTotal), 0),
      orders: dayOrders.length,
    });
  }

  const hourlySales: { hour: number; label: string; sales: number; count: number }[] = [];
  for (let h = 0; h < 24; h++) {
    const hourOrders = todayOrders.filter((o) => new Date(o.createdAt).getHours() === h);
    hourlySales.push({
      hour: h,
      label: `${String(h).padStart(2, "0")}:00`,
      sales: hourOrders.reduce((s, o) => s + safeNum(o.grandTotal), 0),
      count: hourOrders.length,
    });
  }
  const activeHours = hourlySales.filter((h) => h.count > 0);
  const filteredHours =
    activeHours.length > 0
      ? hourlySales.filter(
          (h) =>
            h.hour >= Math.max(0, activeHours[0].hour - 1) &&
            h.hour <= Math.min(23, activeHours[activeHours.length - 1].hour + 1)
        )
      : [];

  const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const o of orders) {
    for (const item of o.items ?? []) {
      const key = item.productId ?? item.name;
      const cur = productMap.get(key) ?? { name: item.name, quantity: 0, revenue: 0 };
      cur.quantity += safeNum(item.quantity);
      cur.revenue += safeNum(item.price) * safeNum(item.quantity);
      productMap.set(key, cur);
    }
  }
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const orderTypeMap = new Map<string, number>();
  for (const o of todayOrders) {
    const t = o.orderType ?? "dine-in";
    orderTypeMap.set(t, (orderTypeMap.get(t) ?? 0) + 1);
  }
  const orderTypes = Array.from(orderTypeMap.entries()).map(([type, count]) => ({
    type: type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, " "),
    count,
    percentage: todayCount > 0 ? Math.round((count / todayCount) * 100) : 0,
  }));

  const paymentMap = new Map<string, number>();
  for (const o of todayOrders) {
    const m = o.paymentMethod ?? "cash";
    paymentMap.set(m, (paymentMap.get(m) ?? 0) + 1);
  }
  const paymentMethods = Array.from(paymentMap.entries()).map(([method, count]) => ({
    method: method.charAt(0).toUpperCase() + method.slice(1),
    count,
    percentage: todayCount > 0 ? Math.round((count / todayCount) * 100) : 0,
  }));

  const latestOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  return {
    todayRevenue,
    revenueTrend,
    todayCount,
    todayCompleted,
    todayCancelled,
    todayPending,
    avgOrderValue,
    weeklyRevenue,
    monthlyRevenue,
    salesByDay,
    filteredHours,
    topProducts,
    orderTypes,
    paymentMethods,
    latestOrders,
  };
}

const STATUS_VARIANT: Record<string, "success" | "destructive" | "warning" | "secondary"> = {
  completed: "success",
  cancelled: "destructive",
  pending: "warning",
};

const QUICK_ACTIONS = [
  { href: "/pos", label: "Sales Counter", icon: ShoppingCart, color: "bg-blue-50 text-blue-600" },
  { href: "/kitchen", label: "Kitchen Display", icon: ChefHat, color: "bg-orange-50 text-orange-600" },
  { href: "/products", label: "Products", icon: Package, color: "bg-violet-50 text-violet-600" },
  { href: "/inventory", label: "Inventory", icon: Warehouse, color: "bg-emerald-50 text-emerald-600" },
  { href: "/reports", label: "Reports", icon: BarChart3, color: "bg-pink-50 text-pink-600" },
];

export function DashboardView() {
  const { data: ordersResponse, isLoading: ordersLoading } = useGetOrdersQuery({ limit: 2000 });
  const { data: inventoryResponse, isLoading: inventoryLoading } = useGetInventoryQuery({
    limit: 500,
  });

  const orders = ordersResponse?.data ?? [];
  const inventory = inventoryResponse?.data ?? [];
  const isLoading = ordersLoading;

  const analytics = useMemo(() => computeAnalytics(orders), [orders]);

  const lowStockItems = useMemo(
    () =>
      inventory.filter((item) => {
        if (item.currentStock <= 0) return true;
        return item.currentStock <= (item.lowStockThreshold ?? 10);
      }),
    [inventory]
  );

  const maxDaySales = Math.max(...analytics.salesByDay.map((d) => d.sales), 1);
  const maxHourSales = Math.max(...analytics.filteredHours.map((h) => h.sales), 1);
  const maxProductRevenue =
    analytics.topProducts.length > 0 ? analytics.topProducts[0].revenue : 1;

  const trendDir: "up" | "down" | "neutral" =
    analytics.revenueTrend > 0 ? "up" : analytics.revenueTrend < 0 ? "down" : "neutral";
  const trendLabel = `${analytics.revenueTrend >= 0 ? "+" : ""}${analytics.revenueTrend.toFixed(1)}%`;

  return (
    <PageMotion>
      <PageHeader title="Dashboard" description="Overview of your restaurant" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Today's Revenue"
          value={isLoading ? "—" : formatCurrency(analytics.todayRevenue)}
          icon={<DollarSign className="h-5 w-5" />}
          trend={!isLoading ? { value: trendLabel, direction: trendDir } : undefined}
          subtitle="vs yesterday"
        />
        <StatsCard
          title="Orders Today"
          value={isLoading ? "—" : analytics.todayCount}
          animate={!isLoading}
          icon={<ShoppingCart className="h-5 w-5" />}
          subtitle={`${analytics.todayCompleted} completed`}
        />
        <StatsCard
          title="Avg Order Value"
          value={isLoading ? "—" : formatCurrency(analytics.avgOrderValue)}
          icon={<TrendingUp className="h-5 w-5" />}
          subtitle="Per order today"
        />
        <StatsCard
          title="Pending Orders"
          value={isLoading ? "—" : analytics.todayPending}
          animate={!isLoading}
          icon={<Clock className="h-5 w-5" />}
          subtitle="Awaiting action"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Completed"
          value={isLoading ? "—" : analytics.todayCompleted}
          animate={!isLoading}
          icon={<CheckCircle2 className="h-5 w-5" />}
          subtitle="Today"
        />
        <StatsCard
          title="Cancelled"
          value={isLoading ? "—" : analytics.todayCancelled}
          animate={!isLoading}
          icon={<XCircle className="h-5 w-5" />}
          subtitle="Today"
        />
        <StatsCard
          title="Weekly Revenue"
          value={isLoading ? "—" : formatCurrency(analytics.weeklyRevenue)}
          icon={<CalendarDays className="h-5 w-5" />}
          subtitle="Last 7 days"
        />
        <StatsCard
          title="Monthly Revenue"
          value={isLoading ? "—" : formatCurrency(analytics.monthlyRevenue)}
          icon={<CalendarDays className="h-5 w-5" />}
          subtitle="Last 30 days"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Revenue (Last 7 Days)" loading={isLoading}>
          <div className="flex items-end gap-3" style={{ height: 220 }}>
            {analytics.salesByDay.map((d, i) => {
              const pct = Math.max((d.sales / maxDaySales) * 100, 4);
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center min-w-0 h-full">
                  <div className="relative w-full flex-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${pct}%` }}
                      transition={{ delay: i * 0.08, duration: 0.5 }}
                      className="absolute bottom-0 inset-x-0 rounded-t-lg bg-[var(--primary)] cursor-pointer"
                    >
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-[var(--foreground)]">
                        {d.sales >= 1000 ? `${(d.sales / 1000).toFixed(1)}k` : Math.round(d.sales)}
                      </span>
                    </motion.div>
                  </div>
                  <span className="mt-2 text-xs font-medium text-[var(--muted-foreground)]">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </ChartCard>

        <ChartCard title="Hourly Sales (Today)" loading={isLoading}>
          {analytics.filteredHours.length === 0 ? (
            <div className="flex items-center justify-center" style={{ height: 220 }}>
              <p className="text-sm text-[var(--muted-foreground)]">No sales yet today</p>
            </div>
          ) : (
            <div className="flex items-end gap-1" style={{ height: 220 }}>
              {analytics.filteredHours.map((h, i) => {
                const pct = Math.max((h.sales / maxHourSales) * 100, 4);
                return (
                  <div key={h.hour} className="flex-1 flex flex-col items-center min-w-0 h-full">
                    <div className="relative w-full flex-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${pct}%` }}
                        transition={{ delay: i * 0.04, duration: 0.3 }}
                        className="absolute bottom-0 inset-x-0.5 rounded-t-lg bg-[var(--accent)]"
                      />
                    </div>
                    <span className="mt-2 text-[10px] text-[var(--muted-foreground)]">
                      {h.hour % 2 === 0 ? h.label : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Top Selling Products" loading={isLoading}>
          {analytics.topProducts.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] py-8 text-center">
              No sales data available
            </p>
          ) : (
            <div className="space-y-3">
              {analytics.topProducts.map((p, i) => (
                <div key={`${p.name}-${i}`} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-[var(--muted-foreground)] w-5 text-right">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">{p.name}</span>
                      <span className="text-sm text-[var(--muted-foreground)] shrink-0 ml-2">
                        {formatCurrency(p.revenue)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--muted)] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(p.revenue / maxProductRevenue) * 100}%` }}
                        transition={{ delay: i * 0.08, duration: 0.4 }}
                        className="h-full rounded-full bg-[var(--primary)]"
                      />
                    </div>
                  </div>
                  <span className="text-xs text-[var(--muted-foreground)] shrink-0 w-12 text-right">
                    {p.quantity} sold
                  </span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        <div className="space-y-6">
          <ChartCard title="Order Types (Today)" loading={isLoading}>
            {analytics.orderTypes.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)] py-4 text-center">
                No orders today
              </p>
            ) : (
              <div className="space-y-3">
                {analytics.orderTypes.map((t) => (
                  <div key={t.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-[var(--primary)]" />
                      <span className="text-sm">{t.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{t.count}</span>
                      <Badge variant="secondary">{t.percentage}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>

          <ChartCard title="Payment Methods (Today)" loading={isLoading}>
            {analytics.paymentMethods.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)] py-4 text-center">
                No orders today
              </p>
            ) : (
              <div className="space-y-3">
                {analytics.paymentMethods.map((m) => (
                  <div key={m.method} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-[var(--accent)]" />
                      <span className="text-sm">{m.method}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{m.count}</span>
                      <Badge variant="secondary">{m.percentage}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Latest Orders</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/orders" className="flex items-center gap-1 text-sm">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : analytics.latestOrders.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)] py-8 text-center">
                No orders yet
              </p>
            ) : (
              <div>
                {analytics.latestOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {order.items?.[0]?.name ?? "Order"}
                        {(order.items?.length ?? 0) > 1 && (
                          <span className="text-[var(--muted-foreground)] font-normal">
                            {" "}
                            +{(order.items?.length ?? 0) - 1}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        #{order.orderNumber} ·{" "}
                        {new Date(order.createdAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-medium">
                        {formatCurrency(safeNum(order.grandTotal))}
                      </span>
                      <Badge variant={STATUS_VARIANT[order.status] ?? "secondary"}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Low Stock Alerts
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/inventory" className="flex items-center gap-1 text-sm">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {inventoryLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-6 w-14 rounded-full" />
                  </div>
                ))}
              </div>
            ) : lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                <p className="text-sm text-[var(--muted-foreground)]">
                  All stock levels healthy
                </p>
              </div>
            ) : (
              <div>
                {lowStockItems.slice(0, 8).map((item) => {
                  const name = item.productName ?? item.product?.name ?? item.productId;
                  const isOut = item.currentStock <= 0;
                  return (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0"
                    >
                      <span className="text-sm truncate">{name}</span>
                      <Badge variant={isOut ? "destructive" : "warning"}>
                        {isOut ? "Out of stock" : `${item.currentStock} left`}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-4 transition-all hover:shadow-[var(--shadow-sm)] hover:border-[var(--muted-foreground)]/20"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color}`}
                >
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageMotion>
  );
}
