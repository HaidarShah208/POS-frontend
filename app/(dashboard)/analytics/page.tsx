"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageMotion } from "@/components/shared/PageMotion";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatsCard } from "@/components/admin/StatsCard";
import { ChartCard } from "@/components/admin/ChartCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useGetOrdersQuery } from "@/redux/api/ordersEndpoints";
import { useGetInventoryQuery } from "@/redux/api/inventoryEndpoints";
import { useGetCustomersQuery } from "@/redux/api/customersEndpoints";
import { useGetBranchesQuery } from "@/redux/api/branchesEndpoints";
import { useAppSelector } from "@/hooks/redux";
import { cn, formatCurrency } from "@/lib/utils";
import type { Order } from "@/types/api/index";
import {
  DollarSign, ShoppingCart, TrendingUp, TrendingDown, Users, Warehouse,
  BarChart3, Clock, Calendar, PieChart, Activity, Target,
  ArrowUpRight, ArrowDownRight, Percent,
} from "lucide-react";

type ViewTab = "overview" | "sales" | "customers" | "inventory" | "employees";

const DATE_PRESETS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "1y", days: 365 },
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

function safeNum(v: unknown): number { const n = Number(v); return Number.isFinite(n) ? n : 0; }

function computeAnalytics(orders: Order[]) {
  const totalRevenue = orders.reduce((s, o) => s + safeNum(o.grandTotal), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
  const totalTax = orders.reduce((s, o) => s + safeNum(o.tax), 0);
  const totalDiscount = orders.reduce((s, o) => s + safeNum(o.discount), 0);
  const completedOrders = orders.filter((o) => o.status === "completed");
  const cancelledOrders = orders.filter((o) => o.status === "cancelled");
  const completionRate = totalOrders ? Math.round((completedOrders.length / totalOrders) * 100) : 0;

  const byDay = new Map<string, { revenue: number; orders: number; tax: number; discount: number }>();
  for (const o of orders) {
    const date = (o.createdAt ?? "").slice(0, 10);
    if (!date) continue;
    const cur = byDay.get(date) ?? { revenue: 0, orders: 0, tax: 0, discount: 0 };
    cur.revenue += safeNum(o.grandTotal);
    cur.orders += 1;
    cur.tax += safeNum(o.tax);
    cur.discount += safeNum(o.discount);
    byDay.set(date, cur);
  }
  const dailyData = Array.from(byDay.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const hourMap = new Map<number, { count: number; revenue: number }>();
  for (const o of orders) {
    const h = new Date(o.createdAt).getHours();
    const cur = hourMap.get(h) ?? { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += safeNum(o.grandTotal);
    hourMap.set(h, cur);
  }
  const hourlyData: { hour: number; label: string; count: number; revenue: number }[] = [];
  for (let h = 0; h < 24; h++) {
    const d = hourMap.get(h) ?? { count: 0, revenue: 0 };
    hourlyData.push({ hour: h, label: `${String(h).padStart(2, "0")}:00`, ...d });
  }
  const activeHours = hourlyData.filter((h) => h.count > 0);
  const filteredHours = activeHours.length > 0
    ? hourlyData.filter((h) => h.hour >= Math.max(0, activeHours[0].hour - 1) && h.hour <= Math.min(23, activeHours[activeHours.length - 1].hour + 1))
    : [];

  const dayOfWeek = new Map<number, { count: number; revenue: number }>();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (const o of orders) {
    const dow = new Date(o.createdAt).getDay();
    const cur = dayOfWeek.get(dow) ?? { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += safeNum(o.grandTotal);
    dayOfWeek.set(dow, cur);
  }
  const weekdayData = dayNames.map((name, i) => ({ name, ...(dayOfWeek.get(i) ?? { count: 0, revenue: 0 }) }));

  const typeCount = new Map<string, { count: number; revenue: number }>();
  for (const o of orders) {
    const t = o.orderType ?? "dine-in";
    const cur = typeCount.get(t) ?? { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += safeNum(o.grandTotal);
    typeCount.set(t, cur);
  }
  const orderTypes = Array.from(typeCount.entries())
    .map(([type, v]) => ({ type: type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, " "), ...v, pct: totalOrders ? Math.round((v.count / totalOrders) * 1000) / 10 : 0 }))
    .sort((a, b) => b.count - a.count);

  const payMap = new Map<string, { count: number; revenue: number }>();
  for (const o of orders) {
    const m = o.paymentMethod ?? "cash";
    const cur = payMap.get(m) ?? { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += safeNum(o.grandTotal);
    payMap.set(m, cur);
  }
  const paymentMethods = Array.from(payMap.entries())
    .map(([method, v]) => ({ method: method.charAt(0).toUpperCase() + method.slice(1), ...v, pct: totalOrders ? Math.round((v.count / totalOrders) * 1000) / 10 : 0 }))
    .sort((a, b) => b.count - a.count);

  const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of orders) {
    for (const item of o.items ?? []) {
      const id = item.productId ?? item.name ?? item.id;
      const cur = productMap.get(id) ?? { name: item.name ?? "Unknown", qty: 0, revenue: 0 };
      cur.qty += safeNum(item.quantity);
      cur.revenue += safeNum(item.price) * safeNum(item.quantity);
      productMap.set(id, cur);
    }
  }
  const topProducts = Array.from(productMap.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return {
    totalRevenue, totalOrders, avgOrderValue, totalTax, totalDiscount,
    completedOrders: completedOrders.length, cancelledOrders: cancelledOrders.length, completionRate,
    dailyData, filteredHours, weekdayData, orderTypes, paymentMethods, topProducts,
  };
}

const TYPE_COLORS = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-violet-500", "bg-rose-500"];
const PAY_COLORS = ["bg-emerald-500", "bg-blue-500", "bg-violet-500", "bg-amber-500"];

export default function AnalyticsPage() {
  const [viewTab, setViewTab] = useState<ViewTab>("overview");
  const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return toDateStr(d); });
  const [endDate, setEndDate] = useState(() => toDateStr(new Date()));
  const { data: branches = [] } = useGetBranchesQuery();
  const branchId = branches[0]?.id ?? "";
  const [selectedBranch, setSelectedBranch] = useState("");
  useEffect(() => { if (branchId && !selectedBranch) setSelectedBranch(branchId); }, [branchId, selectedBranch]);

  const dateToExclusive = useMemo(() => addDay(endDate), [endDate]);
  const { data: ordersRes, isLoading } = useGetOrdersQuery({ dateFrom: startDate, dateTo: dateToExclusive, limit: 5000, ...(selectedBranch ? { branchId: selectedBranch } : {}) });
  const { data: inventoryRes } = useGetInventoryQuery();
  const { data: customersData } = useGetCustomersQuery({});
  const employees = useAppSelector((s) => s.employees.employees);
  const clockRecords = useAppSelector((s) => s.employees.clockRecords);

  const orders = ordersRes?.data ?? [];
  const inventory = inventoryRes?.data ?? [];
  const customers = customersData ?? [];
  const a = useMemo(() => computeAnalytics(orders), [orders]);
  const maxDayRev = Math.max(...a.dailyData.map((d) => d.revenue), 1);
  const maxHourCount = Math.max(...a.filteredHours.map((h) => h.count), 1);
  const maxWeekday = Math.max(...a.weekdayData.map((d) => d.count), 1);
  const maxProductRev = a.topProducts.length > 0 ? a.topProducts[0].revenue : 1;

  const invStats = useMemo(() => {
    const totalItems = inventory.length;
    const lowStock = inventory.filter((i) => i.currentStock <= (i.lowStockThreshold ?? 10) && i.currentStock > 0).length;
    const outOfStock = inventory.filter((i) => i.currentStock <= 0).length;
    const totalValue = inventory.reduce((s, i) => s + (i.stockValue ?? i.currentStock * (i.cost ?? 0)), 0);
    return { totalItems, lowStock, outOfStock, totalValue };
  }, [inventory]);

  const empStats = useMemo(() => {
    const active = employees.filter((e) => e.status === "active").length;
    const totalPayroll = employees.filter((e) => e.status === "active").reduce((s, e) => s + e.salary, 0);
    const monthPrefix = toDateStr(new Date()).slice(0, 7);
    const monthHours = clockRecords.filter((c) => c.clockIn.startsWith(monthPrefix)).reduce((s, c) => s + (c.hoursWorked ?? 0), 0);
    return { total: employees.length, active, totalPayroll, monthHours };
  }, [employees, clockRecords]);

  const custStats = useMemo(() => ({
    total: customers.length,
    active: customers.filter((c) => c.status === "active").length,
    vip: customers.filter((c) => c.status === "vip").length,
    totalSpent: customers.reduce((s, c) => s + (c.totalSpent ?? 0), 0),
  }), [customers]);

  const applyPreset = (days: number) => {
    const now = new Date();
    setEndDate(toDateStr(now));
    const from = new Date(now);
    from.setDate(from.getDate() - days);
    setStartDate(toDateStr(from));
  };

  const VIEW_TABS: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <PieChart className="h-4 w-4" /> },
    { id: "sales", label: "Sales", icon: <TrendingUp className="h-4 w-4" /> },
    { id: "customers", label: "Customers", icon: <Users className="h-4 w-4" /> },
    { id: "inventory", label: "Inventory", icon: <Warehouse className="h-4 w-4" /> },
    { id: "employees", label: "Employees", icon: <Activity className="h-4 w-4" /> },
  ];

  return (
    <RoleGuard permission="analytics">
      <PageMotion>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <PageHeader title="Analytics" description="Comprehensive business insights and performance metrics" />
          <div className="flex flex-wrap items-end gap-3 shrink-0">
            <div className="flex items-center gap-1">
              {DATE_PRESETS.map((p) => (
                <Button key={p.label} variant="outline" size="sm" className="text-xs h-8 shrink-0" onClick={() => applyPreset(p.days)}>{p.label}</Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-36 h-8 text-xs" />
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-36 h-8 text-xs" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {VIEW_TABS.map((t) => (
            <Button key={t.id} variant={viewTab === t.id ? "default" : "outline"} size="sm" className="gap-1.5 shrink-0" onClick={() => setViewTab(t.id)}>
              {t.icon}{t.label}
            </Button>
          ))}
        </div>

        {viewTab === "overview" && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard title="Revenue" value={isLoading ? "—" : formatCurrency(a.totalRevenue)} icon={<DollarSign className="h-5 w-5" />} />
              <StatsCard title="Orders" value={isLoading ? "—" : a.totalOrders} animate={!isLoading} icon={<ShoppingCart className="h-5 w-5" />} />
              <StatsCard title="Avg Order" value={isLoading ? "—" : formatCurrency(a.avgOrderValue)} icon={<TrendingUp className="h-5 w-5" />} />
              <StatsCard title="Completion" value={isLoading ? "—" : `${a.completionRate}%`} icon={<Target className="h-5 w-5" />} subtitle={`${a.cancelledOrders} cancelled`} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="Revenue Trend" loading={isLoading}>
                {a.dailyData.length === 0 ? (
                  <EmptyState title="No data" description="No orders in this period." icon={<BarChart3 className="h-6 w-6" />} className="py-8" />
                ) : (
                  <div className="h-[200px] flex items-end gap-1 pt-4">
                    {a.dailyData.map((d, i) => (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                        <div className="w-full flex-1 flex items-end">
                          <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max((d.revenue / maxDayRev) * 100, 2)}%` }}
                            transition={{ delay: i * 0.02, duration: 0.4 }} className="w-full rounded-t-md bg-[var(--primary)]" />
                        </div>
                        <span className="text-[9px] text-[var(--muted-foreground)] truncate w-full text-center">
                          {a.dailyData.length <= 14 ? new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : i % Math.ceil(a.dailyData.length / 8) === 0 ? d.date.slice(5) : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ChartCard>

              <ChartCard title="Peak Hours Heatmap" loading={isLoading}>
                {a.filteredHours.length === 0 ? (
                  <EmptyState title="No data" description="No hourly data." icon={<Clock className="h-6 w-6" />} className="py-8" />
                ) : (
                  <div className="h-[200px] flex items-end gap-1 pt-4">
                    {a.filteredHours.map((h, i) => {
                      const intensity = maxHourCount > 0 ? h.count / maxHourCount : 0;
                      return (
                        <div key={h.hour} className="flex-1 min-w-[16px] flex flex-col items-center gap-1">
                          <div className="w-full flex-1 flex items-end">
                            <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(intensity * 100, 2)}%` }}
                              transition={{ delay: i * 0.02, duration: 0.3 }}
                              className={cn("w-full rounded-t-md", intensity > 0.75 ? "bg-red-500" : intensity > 0.5 ? "bg-amber-500" : intensity > 0.25 ? "bg-blue-400" : "bg-slate-300")} />
                          </div>
                          <span className="text-[9px] text-[var(--muted-foreground)]">{h.hour % 2 === 0 ? h.label : ""}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ChartCard>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <ChartCard title="Order Types" loading={isLoading}>
                {a.orderTypes.length === 0 ? <p className="text-sm text-[var(--muted-foreground)] py-8 text-center">No data</p> : (
                  <div className="space-y-2.5">
                    {a.orderTypes.map((d, i) => (
                      <div key={d.type}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className={cn("h-2.5 w-2.5 rounded-full", TYPE_COLORS[i % TYPE_COLORS.length])} />
                            <span className="text-xs font-medium">{d.type}</span>
                          </div>
                          <span className="text-xs tabular-nums">{d.count} · {d.pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--muted)] overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${d.pct}%` }} transition={{ delay: i * 0.1, duration: 0.4 }}
                            className={cn("h-full rounded-full", TYPE_COLORS[i % TYPE_COLORS.length])} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ChartCard>

              <ChartCard title="Payment Methods" loading={isLoading}>
                {a.paymentMethods.length === 0 ? <p className="text-sm text-[var(--muted-foreground)] py-8 text-center">No data</p> : (
                  <div className="space-y-2.5">
                    {a.paymentMethods.map((m, i) => (
                      <div key={m.method}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className={cn("h-2.5 w-2.5 rounded-full", PAY_COLORS[i % PAY_COLORS.length])} />
                            <span className="text-xs font-medium">{m.method}</span>
                          </div>
                          <span className="text-xs tabular-nums">{formatCurrency(m.revenue)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--muted)] overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${m.pct}%` }} transition={{ delay: i * 0.1, duration: 0.4 }}
                            className={cn("h-full rounded-full", PAY_COLORS[i % PAY_COLORS.length])} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ChartCard>

              <ChartCard title="Day of Week" loading={isLoading}>
                <div className="h-[180px] flex items-end gap-2 pt-4">
                  {a.weekdayData.map((d, i) => (
                    <div key={d.name} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                      <span className="text-[9px] text-[var(--muted-foreground)] tabular-nums">{d.count}</span>
                      <div className="w-full flex-1 flex items-end">
                        <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max((d.count / maxWeekday) * 100, 4)}%` }}
                          transition={{ delay: i * 0.05, duration: 0.3 }}
                          className={cn("w-full rounded-t-md", d.count === maxWeekday ? "bg-[var(--primary)]" : "bg-[var(--accent)]")} />
                      </div>
                      <span className="text-[10px] font-medium">{d.name}</span>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </div>
          </>
        )}

        {viewTab === "sales" && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatsCard title="Revenue" value={formatCurrency(a.totalRevenue)} icon={<DollarSign className="h-5 w-5" />} />
              <StatsCard title="Tax Collected" value={formatCurrency(a.totalTax)} icon={<Percent className="h-5 w-5" />} />
              <StatsCard title="Discounts Given" value={formatCurrency(a.totalDiscount)} icon={<TrendingDown className="h-5 w-5" />} />
              <StatsCard title="Completed" value={a.completedOrders} animate icon={<ArrowUpRight className="h-5 w-5" />} />
              <StatsCard title="Cancelled" value={a.cancelledOrders} animate icon={<ArrowDownRight className="h-5 w-5" />} />
            </div>

            <ChartCard title="Top Products by Revenue" loading={isLoading}>
              {a.topProducts.length === 0 ? (
                <EmptyState title="No sales data" description="Products will appear here." icon={<ShoppingCart className="h-6 w-6" />} className="py-8" />
              ) : (
                <div className="space-y-3">
                  {a.topProducts.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[var(--muted-foreground)] w-5 text-right tabular-nums">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate">{p.name}</span>
                          <span className="text-sm font-bold tabular-nums shrink-0 ml-2">{formatCurrency(p.revenue)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--muted)] overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(p.revenue / maxProductRev) * 100}%` }}
                            transition={{ delay: i * 0.05, duration: 0.4 }} className="h-full rounded-full bg-[var(--primary)]" />
                        </div>
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)] shrink-0 w-14 text-right tabular-nums">{p.qty} sold</span>
                    </div>
                  ))}
                </div>
              )}
            </ChartCard>

            <ChartCard title="Daily Revenue vs Orders" loading={isLoading}>
              {a.dailyData.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)] py-8 text-center">No data</p>
              ) : (
                <>
                  <div className="h-[220px] flex items-end gap-1 pt-4">
                    {a.dailyData.map((d, i) => (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                        <span className="text-[8px] text-[var(--muted-foreground)] tabular-nums">{d.orders}ord</span>
                        <div className="w-full flex-1 flex items-end">
                          <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max((d.revenue / maxDayRev) * 100, 2)}%` }}
                            transition={{ delay: i * 0.02, duration: 0.4 }} className="w-full rounded-t-md bg-[var(--primary)]" />
                        </div>
                        <span className="text-[9px] text-[var(--muted-foreground)] truncate w-full text-center">
                          {a.dailyData.length <= 14 ? new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : i % Math.ceil(a.dailyData.length / 8) === 0 ? d.date.slice(5) : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-[var(--muted-foreground)]">
                    <span>{a.dailyData.length} days</span>
                    <span>Peak: {formatCurrency(Math.max(...a.dailyData.map((d) => d.revenue)))} · Avg: {formatCurrency(a.dailyData.reduce((s, d) => s + d.revenue, 0) / a.dailyData.length)}</span>
                  </div>
                </>
              )}
            </ChartCard>
          </>
        )}

        {viewTab === "customers" && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard title="Total Customers" value={custStats.total} animate icon={<Users className="h-5 w-5" />} />
              <StatsCard title="Active" value={custStats.active} animate icon={<Activity className="h-5 w-5" />} />
              <StatsCard title="VIP" value={custStats.vip} animate icon={<Target className="h-5 w-5" />} />
              <StatsCard title="Total Spent" value={formatCurrency(custStats.totalSpent)} icon={<DollarSign className="h-5 w-5" />} />
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="border-b border-[var(--border)] px-4 py-3">
                  <h3 className="text-sm font-semibold">Customer Insights</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">Top customers by spending</p>
                </div>
                <div className="p-4">
                  {customers.length === 0 ? (
                    <EmptyState title="No customer data" description="Customer analytics will appear here." icon={<Users className="h-6 w-6" />} />
                  ) : (
                    <div className="space-y-2">
                      {[...customers]
                        .sort((a, b) => (b.totalSpent ?? 0) - (a.totalSpent ?? 0))
                        .slice(0, 10)
                        .map((c, i) => {
                          const maxSpent = Math.max(...customers.map((cu) => cu.totalSpent ?? 0), 1);
                          return (
                            <div key={c.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-3 py-2.5">
                              <span className="text-xs font-bold text-[var(--muted-foreground)] w-5 text-right tabular-nums">{i + 1}</span>
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-bold">
                                {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium truncate">{c.name}</span>
                                  {c.status === "vip" && <Badge className="text-[10px] bg-amber-100 text-amber-700">VIP</Badge>}
                                </div>
                                <div className="h-1 rounded-full bg-[var(--muted)] overflow-hidden mt-1">
                                  <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${((c.totalSpent ?? 0) / maxSpent) * 100}%` }} />
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-sm font-bold tabular-nums">{formatCurrency(c.totalSpent ?? 0)}</span>
                                <p className="text-[10px] text-[var(--muted-foreground)]">{c.totalOrders ?? 0} orders</p>
                              </div>
                            </div>
                          );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {viewTab === "inventory" && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard title="Total Items" value={invStats.totalItems} animate icon={<Warehouse className="h-5 w-5" />} />
              <StatsCard title="Low Stock" value={invStats.lowStock} animate icon={<TrendingDown className="h-5 w-5" />} />
              <StatsCard title="Out of Stock" value={invStats.outOfStock} animate icon={<ArrowDownRight className="h-5 w-5" />} />
              <StatsCard title="Stock Value" value={formatCurrency(invStats.totalValue)} icon={<DollarSign className="h-5 w-5" />} />
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="border-b border-[var(--border)] px-4 py-3">
                  <h3 className="text-sm font-semibold">Stock Distribution</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">Items by stock status</p>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex gap-2 h-8 rounded-full overflow-hidden">
                    {invStats.totalItems > 0 && (
                      <>
                        <motion.div initial={{ width: 0 }}
                          animate={{ width: `${((invStats.totalItems - invStats.lowStock - invStats.outOfStock) / invStats.totalItems) * 100}%` }}
                          transition={{ duration: 0.5 }} className="bg-emerald-500 rounded-l-full" />
                        <motion.div initial={{ width: 0 }}
                          animate={{ width: `${(invStats.lowStock / invStats.totalItems) * 100}%` }}
                          transition={{ duration: 0.5, delay: 0.1 }} className="bg-amber-500" />
                        <motion.div initial={{ width: 0 }}
                          animate={{ width: `${(invStats.outOfStock / invStats.totalItems) * 100}%` }}
                          transition={{ duration: 0.5, delay: 0.2 }} className="bg-red-500 rounded-r-full" />
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-6 text-xs">
                    <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full bg-emerald-500" /><span>In Stock ({invStats.totalItems - invStats.lowStock - invStats.outOfStock})</span></div>
                    <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full bg-amber-500" /><span>Low Stock ({invStats.lowStock})</span></div>
                    <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full bg-red-500" /><span>Out ({invStats.outOfStock})</span></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {viewTab === "employees" && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard title="Total Staff" value={empStats.total} animate icon={<Users className="h-5 w-5" />} />
              <StatsCard title="Active" value={empStats.active} animate icon={<Activity className="h-5 w-5" />} />
              <StatsCard title="Monthly Payroll" value={formatCurrency(empStats.totalPayroll)} icon={<DollarSign className="h-5 w-5" />} />
              <StatsCard title="Hours (Month)" value={`${empStats.monthHours.toFixed(0)}h`} icon={<Clock className="h-5 w-5" />} />
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="border-b border-[var(--border)] px-4 py-3">
                  <h3 className="text-sm font-semibold">Employee Performance</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">Hours logged this month by employee</p>
                </div>
                <div className="p-4">
                  {employees.filter((e) => e.status === "active").length === 0 ? (
                    <EmptyState title="No employees" description="Add employees to see performance." icon={<Users className="h-6 w-6" />} />
                  ) : (
                    <div className="space-y-2">
                      {employees.filter((e) => e.status === "active").map((emp) => {
                        const monthPrefix = toDateStr(new Date()).slice(0, 7);
                        const hrs = clockRecords.filter((c) => c.employeeId === emp.id && c.clockIn.startsWith(monthPrefix)).reduce((s, c) => s + (c.hoursWorked ?? 0), 0);
                        const maxHrs = Math.max(...employees.filter((e) => e.status === "active").map((e) =>
                          clockRecords.filter((c) => c.employeeId === e.id && c.clockIn.startsWith(monthPrefix)).reduce((s, c) => s + (c.hoursWorked ?? 0), 0)
                        ), 1);
                        return (
                          <div key={emp.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-3 py-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-bold">
                              {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium truncate block">{emp.name}</span>
                              <div className="h-1.5 rounded-full bg-[var(--muted)] overflow-hidden mt-1">
                                <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${(hrs / maxHrs) * 100}%` }} />
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-sm font-bold tabular-nums">{hrs.toFixed(1)}h</span>
                              <p className="text-[10px] text-[var(--muted-foreground)]">{formatCurrency(emp.salary)}/mo</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </PageMotion>
    </RoleGuard>
  );
}
