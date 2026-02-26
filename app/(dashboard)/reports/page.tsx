"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatsCard } from "@/components/admin/StatsCard";
import { ChartCard } from "@/components/admin/ChartCard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  useGetReportSummaryQuery,
  useGetSalesByDayQuery,
  useGetTopProductsQuery,
  useGetOrderTypeDistributionQuery,
} from "@/redux/api/reports";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function ReportsPage() {
  const [startDate, setStartDate] = useState("2025-02-20");
  const [endDate, setEndDate] = useState("2025-02-25");
  const [branchId, setBranchId] = useState("branch-1");

  const { data: summary, isLoading: summaryLoading } = useGetReportSummaryQuery();
  const { data: salesByDay = [], isLoading: salesLoading } = useGetSalesByDayQuery();
  const { data: topProducts = [], isLoading: topLoading } = useGetTopProductsQuery();
  const { data: orderTypeDist = [], isLoading: distLoading } = useGetOrderTypeDistributionQuery();

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
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
          </div>
          <div>
            <label className="text-xs text-[var(--muted-foreground)] block mb-1">To</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
          </div>
          <div>
            <label className="text-xs text-[var(--muted-foreground)] block mb-1">Branch</label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-40 h-10 rounded-lg border border-[var(--border)] bg-transparent px-3 text-sm"
            >
              <option value="branch-1">Branch 1</option>
              <option value="branch-2">Branch 2</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total Sales" value={summary ? formatCurrency(summary.totalSales) : "—"} />
          <StatsCard title="Total Orders" value={summary?.totalOrders ?? "—"} />
          <StatsCard title="Average Order" value={summary ? formatCurrency(summary.averageOrderValue) : "—"} />
          <StatsCard title="Total Profit" value={summary ? formatCurrency(summary.totalProfit) : "—"} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Sales by day" loading={salesLoading}>
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
                <span key={d.date} className="flex-1 truncate">{d.date.slice(5)}</span>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Top selling products" loading={topLoading}>
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

        <ChartCard title="Order type distribution" loading={distLoading}>
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
