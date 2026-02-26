"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatsCard } from "@/components/admin/StatsCard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useGetInventoryQuery } from "@/redux/api/inventory";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  ModalClose,
} from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useAdjustStockMutation, useGetStockHistoryQuery } from "@/redux/api/inventory";
import { cn } from "@/lib/utils";

export default function InventoryPage() {
  const { data: inventory = [] } = useGetInventoryQuery();
  const [adjustProductId, setAdjustProductId] = useState<string | null>(null);
  const [historyProductId, setHistoryProductId] = useState<string | null>(null);
  const [adjustType, setAdjustType] = useState<"add" | "remove">("add");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [adjustStock, { isLoading }] = useAdjustStockMutation();
  const { data: history = [] } = useGetStockHistoryQuery(historyProductId ?? "", {
    skip: !historyProductId,
  });

  const totalItems = inventory.length;
  const lowStock = inventory.filter((i) => i.status === "low_stock").length;
  const outOfStock = inventory.filter((i) => i.status === "out_of_stock").length;
  const totalValue = inventory.reduce((s, i) => s + i.stockValue, 0);

  const handleAdjust = async () => {
    if (!adjustProductId || !quantity || !reason) return;
    await adjustStock({
      productId: adjustProductId,
      type: adjustType,
      quantity: Number(quantity),
      reason,
    });
    setAdjustProductId(null);
    setQuantity("");
    setReason("");
  };

  return (
    <RoleGuard permission="inventory">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <PageHeader
          title="Inventory"
          description="Stock levels and adjustments"
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total items" value={totalItems} />
          <StatsCard title="Low stock" value={lowStock} subtitle="Needs restock" />
          <StatsCard title="Out of stock" value={outOfStock} subtitle="Urgent" />
          <StatsCard title="Stock value" value={formatCurrency(totalValue)} />
        </div>

        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                <th className="text-left p-4 font-medium">Product</th>
                <th className="text-left p-4 font-medium">Stock</th>
                <th className="text-left p-4 font-medium">Cost</th>
                <th className="text-left p-4 font-medium">Value</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr
                  key={item.productId}
                  className={cn(
                    "border-b border-[var(--border)] hover:bg-[var(--muted)]/30",
                    item.status === "low_stock" && "bg-amber-500/10",
                    item.status === "out_of_stock" && "bg-red-500/10"
                  )}
                >
                  <td className="p-4 font-medium">{item.productName}</td>
                  <td className="p-4">{item.currentStock}</td>
                  <td className="p-4">{formatCurrency(item.cost)}</td>
                  <td className="p-4">{formatCurrency(item.stockValue)}</td>
                  <td className="p-4">
                    <Badge
                      variant={
                        item.status === "out_of_stock"
                          ? "destructive"
                          : item.status === "low_stock"
                            ? "secondary"
                            : "default"
                      }
                    >
                      {item.status === "out_of_stock"
                        ? "Out"
                        : item.status === "low_stock"
                          ? "Low"
                          : "In stock"}
                    </Badge>
                  </td>
                  <td className="p-4 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setAdjustProductId(item.productId); setQuantity(""); setReason(""); }}>
                      Adjust
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setHistoryProductId(item.productId)}>
                      History
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Modal open={!!adjustProductId} onOpenChange={(o) => !o && setAdjustProductId(null)}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Adjust stock</ModalTitle>
            </ModalHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <div className="flex gap-2 mt-1">
                  <Button type="button" size="sm" variant={adjustType === "add" ? "default" : "outline"} onClick={() => setAdjustType("add")}>Add</Button>
                  <Button type="button" size="sm" variant={adjustType === "remove" ? "default" : "outline"} onClick={() => setAdjustType("remove")}>Remove</Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Quantity</label>
                <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Reason</label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Restock" className="mt-1" />
              </div>
            </div>
            <ModalFooter>
              <ModalClose asChild><Button variant="outline">Cancel</Button></ModalClose>
              <Button onClick={handleAdjust} disabled={!quantity || !reason || isLoading}>Apply</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal open={!!historyProductId} onOpenChange={(o) => !o && setHistoryProductId(null)}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Stock history</ModalTitle>
            </ModalHeader>
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {history.length === 0 ? (
                <li className="text-sm text-[var(--muted-foreground)]">No adjustments yet.</li>
              ) : (
                history.map((adj) => (
                  <li key={adj.id} className="text-sm flex justify-between">
                    <span>{adj.type === "add" ? "+" : "-"}{adj.quantity} — {adj.reason}</span>
                    <span className="text-[var(--muted-foreground)]">{adj.date}</span>
                  </li>
                ))
              )}
            </ul>
            <ModalFooter>
              <ModalClose asChild><Button>Close</Button></ModalClose>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </motion.div>
    </RoleGuard>
  );
}
