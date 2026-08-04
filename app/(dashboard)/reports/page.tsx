"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageMotion } from "@/components/shared/PageMotion";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatsCard } from "@/components/admin/StatsCard";
import { ChartCard } from "@/components/admin/ChartCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useGetOrdersQuery } from "@/redux/api/ordersEndpoints";
import { useGetBranchesQuery } from "@/redux/api/branchesEndpoints";
import { cn, formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { Order } from "@/types/api/index";
import type {
  ReportSummary,
  SalesByDay,
  TopProduct,
  OrderTypeDistribution,
} from "@/types/admin";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Clock,
  Calendar,
} from "lucide-react";

type PaymentMethodDist = { method: string; count: number; percentage: number };
type HourlySales = { hour: number; label: string; sales: number; count: number };

const DATE_PRESETS = [
  { label: "Today", days: 0 },
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "1 year", days: 365 },
] as const;

function toDateStr(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + 1);
  return toDateStr(d);
}

function safeNum(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function computeReport(orders: Order[]) {
  const totalSales = orders.reduce((s, o) => s + safeNum(o.grandTotal), 0);
  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === "completed");
  const completedRevenue = completedOrders.reduce((s, o) => s + safeNum(o.grandTotal), 0);
  const summary: ReportSummary = {
    totalSales,
    totalOrders,
    averageOrderValue: totalOrders ? totalSales / totalOrders : 0,
    totalProfit: 0,
  };

  const byDay = new Map<string, { sales: number; orders: number }>();
  for (const o of orders) {
    const date = (o.createdAt ?? "").slice(0, 10);
    if (!date) continue;
    const cur = byDay.get(date) ?? { sales: 0, orders: 0 };
    cur.sales += safeNum(o.grandTotal);
    cur.orders += 1;
    byDay.set(date, cur);
  }
  const salesByDay: SalesByDay[] = Array.from(byDay.entries())
    .map(([date, v]) => ({ date, sales: v.sales, orders: v.orders }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const o of orders) {
    for (const item of o.items ?? []) {
      const id = item.productId ?? item.name ?? item.id ?? "";
      const cur = productMap.get(id) ?? { name: item.name ?? "Unknown", quantity: 0, revenue: 0 };
      const qty = safeNum(item.quantity);
      const price = safeNum(item.price);
      cur.quantity += qty;
      cur.revenue += price * qty;
      productMap.set(id, cur);
    }
  }
  const topProducts: TopProduct[] = Array.from(productMap.entries())
    .map(([productId, v]) => ({ productId, name: v.name, quantity: v.quantity, revenue: v.revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const typeCount = new Map<string, number>();
  for (const o of orders) {
    const t = o.orderType ?? "dine-in";
    typeCount.set(t, (typeCount.get(t) ?? 0) + 1);
  }
  const orderTypeDist: OrderTypeDistribution[] = Array.from(typeCount.entries())
    .map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, " "),
      count,
      percentage: totalOrders ? Math.round((count / totalOrders) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const payMap = new Map<string, number>();
  for (const o of orders) {
    const m = o.paymentMethod ?? "cash";
    payMap.set(m, (payMap.get(m) ?? 0) + 1);
  }
  const paymentMethodDist: PaymentMethodDist[] = Array.from(payMap.entries())
    .map(([method, count]) => ({
      method: method.charAt(0).toUpperCase() + method.slice(1),
      count,
      percentage: totalOrders ? Math.round((count / totalOrders) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const hourMap = new Map<number, { sales: number; count: number }>();
  for (const o of orders) {
    const h = new Date(o.createdAt).getHours();
    const cur = hourMap.get(h) ?? { sales: 0, count: 0 };
    cur.sales += safeNum(o.grandTotal);
    cur.count += 1;
    hourMap.set(h, cur);
  }
  const hourlySales: HourlySales[] = [];
  for (let h = 0; h < 24; h++) {
    const d = hourMap.get(h) ?? { sales: 0, count: 0 };
    hourlySales.push({ hour: h, label: `${String(h).padStart(2, "0")}:00`, ...d });
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

  return {
    summary,
    salesByDay,
    topProducts,
    orderTypeDist,
    paymentMethodDist,
    filteredHours,
    completedRevenue,
    completedCount: completedOrders.length,
  };
}

const TYPE_COLORS = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-violet-500"];
const PAY_COLORS = ["bg-emerald-500", "bg-blue-500", "bg-violet-500", "bg-amber-500"];

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return toDateStr(d);
  });
  const [endDate, setEndDate] = useState(() => toDateStr(new Date()));
  const { data: branches = [] } = useGetBranchesQuery();
  const branchId = branches[0]?.id ?? "";
  const [selectedBranchId, setSelectedBranchId] = useState("");
  useEffect(() => {
    if (branchId && !selectedBranchId) setSelectedBranchId(branchId);
  }, [branchId, selectedBranchId]);

  const applyPreset = (days: number) => {
    const now = new Date();
    setEndDate(toDateStr(now));
    if (days === 0) {
      setStartDate(toDateStr(now));
    } else {
      const from = new Date(now);
      from.setDate(from.getDate() - days);
      setStartDate(toDateStr(from));
    }
  };

  const dateToExclusive = useMemo(() => addDay(endDate), [endDate]);
  const { data: ordersResponse, isLoading } = useGetOrdersQuery({
    dateFrom: startDate,
    dateTo: dateToExclusive,
    limit: 2000,
    ...(selectedBranchId ? { branchId: selectedBranchId } : {}),
  });

  const orders = ordersResponse?.data ?? [];
  const report = useMemo(() => computeReport(orders), [orders]);

  const maxDaySales = Math.max(...report.salesByDay.map((d) => d.sales), 1);
  const maxProductRev = report.topProducts.length > 0 ? report.topProducts[0].revenue : 1;
  const maxHourSales = Math.max(...report.filteredHours.map((h) => h.sales), 1);

  return (
    <RoleGuard permission="reports">
      <PageMotion>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <PageHeader title="Reports" description="Analytics and business insights" />
          <div className="flex flex-wrap items-end gap-3 shrink-0">
            <div className="flex items-center gap-1 overflow-x-auto">
              {DATE_PRESETS.map((p) => (
                <Button
                  key={p.label}
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-xs h-8"
                  onClick={() => applyPreset(p.days)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] block mb-0.5">From</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-36 h-8 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] block mb-0.5">To</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-36 h-8 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Revenue"
            value={isLoading ? "—" : formatCurrency(report.summary.totalSales)}
            icon={<DollarSign className="h-5 w-5" />}
            subtitle={`${report.completedCount} completed`}
          />
          <StatsCard
            title="Total Orders"
            value={isLoading ? "—" : report.summary.totalOrders}
            animate={!isLoading}
            icon={<ShoppingCart className="h-5 w-5" />}
          />
          <StatsCard
            title="Avg Order Value"
            value={isLoading ? "—" : formatCurrency(report.summary.averageOrderValue)}
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <StatsCard
            title="Completed Revenue"
            value={isLoading ? "—" : formatCurrency(report.completedRevenue)}
            icon={<DollarSign className="h-5 w-5" />}
            subtitle="Fulfilled orders only"
          />
        </div>

        <ChartCard title="Revenue Trend" loading={isLoading} className="lg:col-span-full">
          {report.salesByDay.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] py-8 text-center">No data for this period</p>
          ) : (
            <>
              <div className="h-[220px] flex items-end gap-1 pt-4">
                {report.salesByDay.map((d, i) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <span className="text-[9px] text-[var(--muted-foreground)] font-medium truncate w-full text-center">
                      {d.sales >= 1000 ? `${(d.sales / 1000).toFixed(1)}k` : formatCurrency(d.sales).split(".")[0]}
                    </span>
                    <div className="w-full flex-1 flex items-end">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max((d.sales / maxDaySales) * 100, 2)}%` }}
                        transition={{ delay: i * 0.03, duration: 0.4 }}
                        className="w-full rounded-t-md bg-[var(--primary)]"
                      />
                    </div>
                    <span className="text-[10px] text-[var(--muted-foreground)] truncate w-full text-center">
                      {report.salesByDay.length <= 14
                        ? new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        : i % Math.ceil(report.salesByDay.length / 10) === 0
                          ? d.date.slice(5)
                          : ""}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-[var(--muted-foreground)]">
                <span>{report.salesByDay.length} day{report.salesByDay.length !== 1 ? "s" : ""}</span>
                <span>
                  Peak: {formatCurrency(Math.max(...report.salesByDay.map((d) => d.sales)))} ·
                  Avg: {formatCurrency(report.salesByDay.reduce((s, d) => s + d.sales, 0) / report.salesByDay.length)}
                </span>
              </div>
            </>
          )}
        </ChartCard>

        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Top Products by Revenue" loading={isLoading}>
            {report.topProducts.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)] py-8 text-center">No sales data</p>
            ) : (
              <div className="space-y-3">
                {report.topProducts.map((p, i) => (
                  <div key={p.productId} className="flex items-center gap-3">
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
                          animate={{ width: `${(p.revenue / maxProductRev) * 100}%` }}
                          transition={{ delay: i * 0.06, duration: 0.4 }}
                          className="h-full rounded-full bg-[var(--primary)]"
                        />
                      </div>
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)] shrink-0 w-14 text-right tabular-nums">
                      {p.quantity} sold
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>

          <ChartCard title="Peak Hours" loading={isLoading}>
            {report.filteredHours.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)] py-8 text-center">No hourly data</p>
            ) : (
              <>
                <div className="h-[200px] flex items-end gap-1 pt-4">
                  {report.filteredHours.map((h, i) => (
                    <div key={h.hour} className="flex-1 min-w-[20px] flex flex-col items-center gap-1">
                      <div className="w-full flex-1 flex items-end">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max((h.sales / maxHourSales) * 100, 2)}%` }}
                          transition={{ delay: i * 0.03, duration: 0.3 }}
                          className="w-full rounded-t-md bg-[var(--accent)]"
                        />
                      </div>
                      <span className="text-[10px] text-[var(--muted-foreground)]">
                        {h.hour % 2 === 0 ? h.label : ""}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-end mt-2 text-xs text-[var(--muted-foreground)]">
                  Busiest: {report.filteredHours.reduce((best, h) => (h.count > best.count ? h : best), report.filteredHours[0]).label}
                </div>
              </>
            )}
          </ChartCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Order Types" loading={isLoading}>
            {report.orderTypeDist.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)] py-4 text-center">No data</p>
            ) : (
              <div className="space-y-3">
                {report.orderTypeDist.map((d, i) => (
                  <div key={d.type}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-3 w-3 rounded-full", TYPE_COLORS[i % TYPE_COLORS.length])} />
                        <span className="text-sm font-medium">{d.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm tabular-nums">{d.count}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                          {d.percentage}%
                        </Badge>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--muted)] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${d.percentage}%` }}
                        transition={{ delay: i * 0.1, duration: 0.4 }}
                        className={cn("h-full rounded-full", TYPE_COLORS[i % TYPE_COLORS.length])}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>

          <ChartCard title="Payment Methods" loading={isLoading}>
            {report.paymentMethodDist.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)] py-4 text-center">No data</p>
            ) : (
              <div className="space-y-3">
                {report.paymentMethodDist.map((m, i) => (
                  <div key={m.method}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-3 w-3 rounded-full", PAY_COLORS[i % PAY_COLORS.length])} />
                        <span className="text-sm font-medium">{m.method}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm tabular-nums">{m.count}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                          {m.percentage}%
                        </Badge>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--muted)] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${m.percentage}%` }}
                        transition={{ delay: i * 0.1, duration: 0.4 }}
                        className={cn("h-full rounded-full", PAY_COLORS[i % PAY_COLORS.length])}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
        </div>
      </PageMotion>
    </RoleGuard>
  );
}
