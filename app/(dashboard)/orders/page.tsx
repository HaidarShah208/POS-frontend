"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetOrdersQuery } from "@/redux/api/ordersEndpoints";
import { formatCurrency } from "@/lib/utils";

export default function OrdersPage() {
  const { data: ordersResponse, isLoading } = useGetOrdersQuery({ limit: 50 });
  const orders = ordersResponse?.data ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-[var(--muted-foreground)]">Recent orders</p>
      </div>
      {isLoading ? (
        <div className="h-48 rounded-lg border border-[var(--border)] animate-pulse bg-[var(--muted)]/30" />
      ) : orders.length === 0 ? (
        <p className="text-[var(--muted-foreground)]">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">{order.orderNumber} · #{order.tokenNumber}</CardTitle>
                <Badge variant={order.status === "completed" ? "success" : order.status === "cancelled" ? "destructive" : "warning"}>{order.status}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {(order.items?.length ?? 0)} item(s) · {formatCurrency(order.grandTotal)}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">{new Date(order.createdAt).toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}
