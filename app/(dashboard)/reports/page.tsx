"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatsCard } from "@/components/admin/StatsCard";
import { ChartCard } from "@/components/admin/ChartCard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useGetOrdersQuery } from "@/redux/api/ordersEndpoints";
import { useGetBranchesQuery } from "@/redux/api/branchesEndpoints";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { Order } from "@/types/api/index";
import type {
  ReportSummary,
  SalesByDay,
  TopProduct,
  OrderTypeDistribution,
} from "@/types/admin";

function addDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function computeReportFromOrders(orders: Order[]): {
  summary: ReportSummary;
  salesByDay: SalesByDay[];
  topProducts: TopProduct[];
  orderTypeDist: OrderTypeDistribution[];
} {
  const totalSales = orders.reduce((s, o) => s + o.grandTotal, 0);
  const totalOrders = orders.length;
  const summary: ReportSummary = {
    totalSales,
    totalOrders,
    averageOrderValue: totalOrders ? totalSales / totalOrders : 0,
    totalProfit: 0,
  };

  const byDay = new Map<string, { sales: number; orders: number }>();
  for (const o of orders) {
    const date = o.createdAt.slice(0, 10);
    const cur = byDay.get(date) ?? { sales: 0, orders: 0 };
    cur.sales += o.grandTotal;
    cur.orders += 1;
    byDay.set(date, cur);
  }
  const salesByDay: SalesByDay[] = Array.from(byDay.entries())
    .map(([date, v]) => ({ date, sales: v.sales, orders: v.orders }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const o of orders) {
    for (const item of o.items ?? []) {
      const id = item.productId ?? item.name ?? item.id;
      const cur = productMap.get(id) ?? { name: item.name, quantity: 0, revenue: 0 };
      cur.quantity += item.quantity;
      cur.revenue += item.price * item.quantity;
      productMap.set(id, cur);
    }
  }
  const topProducts: TopProduct[] = Array.from(productMap.entries())
    .map(([productId, v]) => ({ productId, name: v.name, quantity: v.quantity, revenue: v.revenue }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  const typeCount = new Map<string, number>();
  for (const o of orders) {
    const t = o.orderType ?? "dine-in";
    typeCount.set(t, (typeCount.get(t) ?? 0) + 1);
  }
  const orderTypeDist: OrderTypeDistribution[] = Array.from(typeCount.entries()).map(
    ([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, " "),
      count,
      percentage: totalOrders ? Math.round((count / totalOrders) * 1000) / 10 : 0,
    })
  );

  return { summary, salesByDay, topProducts, orderTypeDist };
}

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const { data: branches = [] } = useGetBranchesQuery();
  const branchId = branches[0]?.id ?? "";
  const [selectedBranchId, setSelectedBranchId] = useState("");
  useEffect(() => {
    if (branchId && !selectedBranchId) setSelectedBranchId(branchId);
  }, [branchId, selectedBranchId]);

  const dateToExclusive = useMemo(() => addDay(endDate), [endDate]);
  const { data: ordersResponse, isLoading } = useGetOrdersQuery({
    dateFrom: startDate,
    dateTo: dateToExclusive,
    limit: 2000,
    ...(selectedBranchId ? { branchId: selectedBranchId } : {}),
  });

  const orders = ordersResponse?.data ?? [];
  const { summary, salesByDay, topProducts, orderTypeDist } = useMemo(
    () => computeReportFromOrders(orders),
    [orders]
  );

  const maxSales = Math.max(...salesByDay.map((d) => d.sales), 1);
  const maxQty = Math.max(...topProducts.map((p) => p.quantity), 1);

  return (
    <RoleGuard permission="reports">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <PageHeader title="Reports" description="Analytics and insights" />

        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs text-[var(--muted-foreground)] block mb-1">From</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--muted-foreground)] block mb-1">To</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Sales"
            value={!isLoading ? formatCurrency(summary.totalSales) : "—"}
          />
          <StatsCard title="Total Orders" value={!isLoading ? String(summary.totalOrders) : "—"} />
          <StatsCard
            title="Average Order"
            value={!isLoading ? formatCurrency(summary.averageOrderValue) : "—"}
          />
          <StatsCard
            title="Total Profit"
            value={!isLoading ? formatCurrency(summary.totalProfit) : "—"}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Sales by day" loading={isLoading}>
            <div className="h-[200px] flex items-end gap-1">
              {salesByDay.map((d, i) => (
                <motion.div
                  key={d.date}
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.sales / maxSales) * 100}%` }}
                  transition={{ delay: i * 0.05 }}
                  className="flex-1 min-w-0 rounded-t bg-[var(--accent)]"
                  title={`${d.date}: ${formatCurrency(d.sales)}`}
                />
              ))}
            </div>
            <div className="flex gap-1 mt-2 text-xs text-[var(--muted-foreground)]">
              {salesByDay.map((d) => (
                <span key={d.date} className="flex-1 truncate">
                  {d.date.slice(5)}
                </span>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Top selling products" loading={isLoading}>
            <div className="space-y-2 h-[200px] overflow-y-auto">
              {topProducts.map((p, i) => (
                <div key={p.productId} className="flex items-center gap-2">
                  <span className="w-32 truncate text-sm">{p.name}</span>
                  <div className="flex-1 h-6 rounded bg-[var(--muted)] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(p.quantity / maxQty) * 100}%` }}
                      transition={{ delay: i * 0.05 }}
                      className="h-full bg-[var(--primary)]"
                    />
                  </div>
                  <span className="text-sm font-medium w-16">{p.quantity}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        <ChartCard title="Order type distribution" loading={isLoading}>
          <div className="flex flex-wrap gap-4">
            {orderTypeDist.map((d) => (
              <div key={d.type} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{
                    backgroundColor: `hsl(${(orderTypeDist.indexOf(d) * 120) % 360}, 60%, 50%)`,
                  }}
                />
                <span className="text-sm">{d.type}</span>
                <span className="text-sm text-[var(--muted-foreground)]">{d.percentage}%</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </motion.div>
    </RoleGuard>
  );
}
