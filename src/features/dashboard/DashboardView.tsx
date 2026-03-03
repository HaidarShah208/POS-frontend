"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetOrdersQuery } from "@/redux/api/ordersEndpoints";
import { formatCurrency } from "@/lib/utils";

export function DashboardView() {
  const { data: ordersResponse } = useGetOrdersQuery({ limit: 500 });
  const orders = ordersResponse?.data ?? [];

  const { todaySales, todayCount } = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = orders.filter((o) => (o.createdAt ?? "").startsWith(today));
    let sales = 0;
    for (const o of todayOrders) {
      const n = Number(o.grandTotal);
      sales += Number.isFinite(n) ? n : 0;
    }
    return { todaySales: sales, todayCount: todayOrders.length };
  }, [orders]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-[var(--muted-foreground)]">Overview of your restaurant</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sales today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(Number.isFinite(todaySales) ? todaySales : 0)}</p>
            <p className="text-xs text-[var(--muted-foreground)]">From orders today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Orders today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{todayCount}</p>
            <p className="text-xs text-[var(--muted-foreground)]">Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sales Counter</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/pos">Sales Counter</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
