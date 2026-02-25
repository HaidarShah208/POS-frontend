"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MOCK_ORDERS } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export default function OrdersPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-(--muted-foreground)">Recent orders</p>
      </div>
      <div className="space-y-4">
        {MOCK_ORDERS.map((order) => (
          <Card key={order.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">{order.orderNumber}</CardTitle>
              <Badge variant={order.status === "completed" ? "success" : order.status === "cancelled" ? "destructive" : "warning"}>{order.status}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-(--muted-foreground)">{order.items.length} item(s) · {formatCurrency(order.grandTotal)}</p>
              <p className="text-xs text-(--muted-foreground)">{new Date(order.createdAt).toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
