"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PageMotion } from "@/components/shared/PageMotion";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatsCard } from "@/components/admin/StatsCard";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useGetInventoryQuery, useAdjustStockMutation } from "@/redux/api/inventoryEndpoints";
import { useGetBranchesQuery } from "@/redux/api/branchesEndpoints";
import { cn, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter, ModalClose,
} from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import {
  Warehouse, AlertTriangle, XCircle, DollarSign, PackagePlus, PackageMinus,
  ArrowUpDown, History, Calendar, Barcode, Layers, TrendingUp,
  Trash2, RotateCcw, ArrowRightLeft, Tag,
} from "lucide-react";
import type { InventoryItem, StockMovementType } from "@/types/api/index";

type StatusFilter = "all" | "in_stock" | "low_stock" | "out_of_stock" | "expiring";
type ViewTab = "stock" | "movements" | "valuation" | "abc";

type InventoryRow = InventoryItem & {
  _name: string;
  _status: "in_stock" | "low_stock" | "out_of_stock";
  _value: number;
  _cost: number;
  _isExpiring: boolean;
  _daysToExpiry: number | null;
};

const MOVEMENT_ICONS: Record<StockMovementType, { icon: React.ReactNode; color: string }> = {
  purchase: { icon: <PackagePlus className="h-3.5 w-3.5" />, color: "text-emerald-600 bg-emerald-100" },
  sale: { icon: <ArrowRightLeft className="h-3.5 w-3.5" />, color: "text-blue-600 bg-blue-100" },
  adjustment: { icon: <ArrowUpDown className="h-3.5 w-3.5" />, color: "text-slate-600 bg-slate-100" },
  transfer: { icon: <ArrowRightLeft className="h-3.5 w-3.5" />, color: "text-purple-600 bg-purple-100" },
  waste: { icon: <Trash2 className="h-3.5 w-3.5" />, color: "text-red-600 bg-red-100" },
  return: { icon: <RotateCcw className="h-3.5 w-3.5" />, color: "text-amber-600 bg-amber-100" },
  damaged: { icon: <XCircle className="h-3.5 w-3.5" />, color: "text-red-600 bg-red-100" },
};

const ABC_COLORS: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-700",
  B: "bg-amber-100 text-amber-700",
  C: "bg-slate-100 text-slate-600",
};

function daysUntilExpiry(expiryDate?: string): number | null {
  if (!expiryDate) return null;
  const diff = new Date(expiryDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function InventoryPage() {
  const { data: inventoryResponse, isLoading } = useGetInventoryQuery();
  const inventory = inventoryResponse?.data ?? [];
  const { data: branches = [] } = useGetBranchesQuery();
  const branchId = branches[0]?.id ?? "";
  const [adjustProductId, setAdjustProductId] = useState<string | null>(null);
  const [adjustType, setAdjustType] = useState<"add" | "remove">("add");
  const [adjustReason, setAdjustReason] = useState<StockMovementType>("adjustment");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [adjustStock, { isLoading: adjusting }] = useAdjustStockMutation();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewTab, setViewTab] = useState<ViewTab>("stock");

  function itemStatus(i: InventoryItem): "in_stock" | "low_stock" | "out_of_stock" {
    if (i.status) return i.status;
    if (i.currentStock <= 0) return "out_of_stock";
    return i.currentStock <= (i.lowStockThreshold ?? 10) ? "low_stock" : "in_stock";
  }

  const rows: InventoryRow[] = useMemo(
    () => inventory.map((i) => {
      const days = daysUntilExpiry(i.expiryDate);
      return {
        ...i,
        _name: i.productName ?? i.product?.name ?? i.productId,
        _status: itemStatus(i),
        _value: i.stockValue ?? i.currentStock * (i.cost ?? 0),
        _cost: i.cost ?? 0,
        _isExpiring: days !== null && days <= 30 && days > 0,
        _daysToExpiry: days,
      };
    }),
    [inventory]
  );

  const filteredRows = useMemo(() => {
    if (statusFilter === "all") return rows;
    if (statusFilter === "expiring") return rows.filter((r) => r._isExpiring);
    return rows.filter((r) => r._status === statusFilter);
  }, [rows, statusFilter]);

  const totalItems = rows.length;
  const lowStock = rows.filter((r) => r._status === "low_stock").length;
  const outOfStock = rows.filter((r) => r._status === "out_of_stock").length;
  const inStock = rows.filter((r) => r._status === "in_stock").length;
  const totalValue = rows.reduce((s, r) => s + r._value, 0);
  const expiringCount = rows.filter((r) => r._isExpiring).length;
  const expiredCount = rows.filter((r) => r._daysToExpiry !== null && r._daysToExpiry <= 0).length;

  const abcAnalysis = useMemo(() => {
    const sorted = [...rows].sort((a, b) => b._value - a._value);
    const total = sorted.reduce((s, r) => s + r._value, 0);
    let cumulative = 0;
    return sorted.map((r) => {
      cumulative += r._value;
      const pct = total > 0 ? (cumulative / total) * 100 : 0;
      const cls: "A" | "B" | "C" = pct <= 80 ? "A" : pct <= 95 ? "B" : "C";
      return { ...r, _abcClass: r.abcClass ?? cls, _valuePct: total > 0 ? (r._value / total) * 100 : 0 };
    });
  }, [rows]);

  const adjustItemName = useMemo(() => {
    if (!adjustProductId) return "";
    return rows.find((r) => r.productId === adjustProductId)?._name ?? adjustProductId;
  }, [adjustProductId, rows]);

  const handleAdjust = async () => {
    if (!adjustProductId || !quantity || !reason || !branchId) return;
    await adjustStock({ productId: adjustProductId, branchId, type: adjustType, quantity: Number(quantity), reason: `[${adjustReason}] ${reason}` });
    setAdjustProductId(null);
    setQuantity("");
    setReason("");
  };

  const STATUS_BADGE: Record<string, { variant: "success" | "warning" | "destructive"; label: string }> = {
    in_stock: { variant: "success", label: "In Stock" },
    low_stock: { variant: "warning", label: "Low Stock" },
    out_of_stock: { variant: "destructive", label: "Out of Stock" },
  };

  const columns: DataTableColumn<InventoryRow>[] = useMemo(() => [
    {
      id: "product",
      header: "Product",
      accessor: (row) => (
        <div>
          <span className="font-medium text-sm block">{row._name}</span>
          <div className="flex items-center gap-2 mt-0.5">
            {row.batchNumber && <span className="text-[10px] text-[var(--muted-foreground)]">Batch: {row.batchNumber}</span>}
            {row.barcode && (
              <span className="flex items-center gap-0.5 text-[10px] text-[var(--muted-foreground)]">
                <Barcode className="h-2.5 w-2.5" />{row.barcode}
              </span>
            )}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      id: "stock",
      header: "Stock",
      accessor: (row) => {
        const threshold = row.lowStockThreshold ?? 10;
        const max = Math.max(threshold * 3, row.currentStock, 1);
        const pct = Math.min((row.currentStock / max) * 100, 100);
        return (
          <div className="min-w-[120px]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium tabular-nums">{row.currentStock}</span>
              <span className="text-[10px] text-[var(--muted-foreground)]">/ {threshold} min</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--muted)] overflow-hidden">
              <div className={cn("h-full rounded-full transition-all", row._status === "out_of_stock" ? "bg-red-500" : row._status === "low_stock" ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${pct}%` }} />
            </div>
            {row.daysOfStock !== undefined && row.daysOfStock !== null && (
              <span className="text-[10px] text-[var(--muted-foreground)] mt-0.5 block">~{row.daysOfStock}d supply</span>
            )}
          </div>
        );
      },
      sortable: true,
    },
    {
      id: "expiry",
      header: "Expiry",
      accessor: (row) => {
        if (!row.expiryDate) return <span className="text-xs text-[var(--muted-foreground)]">—</span>;
        const days = row._daysToExpiry;
        const isExpired = days !== null && days <= 0;
        const isExpiring = days !== null && days > 0 && days <= 30;
        return (
          <div className="flex items-center gap-1.5">
            <Calendar className={cn("h-3 w-3", isExpired ? "text-red-500" : isExpiring ? "text-amber-500" : "text-[var(--muted-foreground)]")} />
            <span className={cn("text-xs tabular-nums", isExpired ? "text-red-600 font-semibold" : isExpiring ? "text-amber-600 font-medium" : "")}>
              {isExpired ? "Expired" : isExpiring ? `${days}d left` : new Date(row.expiryDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        );
      },
    },
    {
      id: "value",
      header: "Value",
      accessor: (row) => <span className="text-sm font-medium tabular-nums">{formatCurrency(row._value)}</span>,
      sortable: true,
    },
    {
      id: "status",
      header: "Status",
      accessor: (row) => {
        const s = STATUS_BADGE[row._status];
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
    {
      id: "actions",
      header: "",
      accessor: (row) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs"
            onClick={() => { setAdjustProductId(row.productId); setQuantity(""); setReason(""); setAdjustType("add"); setAdjustReason("adjustment"); }}>
            <ArrowUpDown className="h-3 w-3" />Adjust
          </Button>
        </div>
      ),
      className: "w-28",
    },
  ], []);

  const STATUS_FILTERS: { value: StatusFilter; label: string; count: number }[] = [
    { value: "all", label: "All", count: totalItems },
    { value: "in_stock", label: "In Stock", count: inStock },
    { value: "low_stock", label: "Low Stock", count: lowStock },
    { value: "out_of_stock", label: "Out of Stock", count: outOfStock },
    { value: "expiring", label: "Expiring", count: expiringCount },
  ];

  const VIEW_TABS: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: "stock", label: "Stock Levels", icon: <Warehouse className="h-4 w-4" /> },
    { id: "valuation", label: "Valuation", icon: <DollarSign className="h-4 w-4" /> },
    { id: "abc", label: "ABC Analysis", icon: <Layers className="h-4 w-4" /> },
  ];

  return (
    <RoleGuard permission="inventory">
      <PageMotion>
        <PageHeader title="Inventory" description="Monitor stock levels, expiry, valuation, and ABC analysis" />

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          <StatsCard title="Total Items" value={isLoading ? "—" : totalItems} animate={!isLoading} icon={<Warehouse className="h-5 w-5" />} />
          <StatsCard title="Low Stock" value={isLoading ? "—" : lowStock} animate={!isLoading} icon={<AlertTriangle className="h-5 w-5" />} subtitle="Needs restock" />
          <StatsCard title="Out of Stock" value={isLoading ? "—" : outOfStock} animate={!isLoading} icon={<XCircle className="h-5 w-5" />} />
          <StatsCard title="Expiring Soon" value={isLoading ? "—" : expiringCount} animate={!isLoading} icon={<Calendar className="h-5 w-5" />} subtitle={`${expiredCount} expired`} />
          <StatsCard title="Stock Value" value={isLoading ? "—" : formatCurrency(totalValue)} icon={<DollarSign className="h-5 w-5" />} />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {VIEW_TABS.map((t) => (
            <Button key={t.id} variant={viewTab === t.id ? "default" : "outline"} size="sm" className="gap-1.5 shrink-0" onClick={() => setViewTab(t.id)}>
              {t.icon}{t.label}
            </Button>
          ))}
        </div>

        {viewTab === "stock" && (
          <>
            {!isLoading && rows.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {STATUS_FILTERS.map((f) => (
                  <Button key={f.value} variant={statusFilter === f.value ? "default" : "outline"} size="sm" className="shrink-0" onClick={() => setStatusFilter(f.value)}>
                    {f.label} ({f.count})
                  </Button>
                ))}
              </div>
            )}
            {isLoading ? (
              <div className="h-64 rounded-lg border border-[var(--border)] animate-pulse bg-[var(--muted)]/30" />
            ) : rows.length === 0 ? (
              <EmptyState title="No inventory data" description="Inventory will appear here once products are stocked." icon={<Warehouse className="h-6 w-6" />} />
            ) : (
              <DataTable
                columns={columns}
                data={filteredRows}
                searchPlaceholder="Search inventory..."
                searchKeys={["_name" as keyof InventoryRow]}
                keyExtractor={(row) => row.productId}
                emptyMessage="No items match the current filter"
                mobileCardView={(row) => {
                  const s = STATUS_BADGE[row._status];
                  const threshold = row.lowStockThreshold ?? 10;
                  const max = Math.max(threshold * 3, row.currentStock, 1);
                  const pct = Math.min((row.currentStock / max) * 100, 100);
                  return (
                    <Card className={cn("transition-shadow hover:shadow-[var(--shadow-sm)]", row._status === "low_stock" && "border-amber-300", row._status === "out_of_stock" && "border-red-300")}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1 mr-2">
                            <p className="font-medium text-sm truncate">{row._name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {row.batchNumber && <span className="text-[10px] text-[var(--muted-foreground)]">Batch: {row.batchNumber}</span>}
                              {row._isExpiring && <Badge variant="warning" className="text-[10px] px-1 py-0 h-4">Expiring</Badge>}
                            </div>
                          </div>
                          <Badge variant={s.variant} className="shrink-0">{s.label}</Badge>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] mb-1">
                            <span>Stock: <span className="font-medium text-[var(--foreground)]">{row.currentStock}</span></span>
                            <span>Min: {threshold}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[var(--muted)] overflow-hidden">
                            <div className={cn("h-full rounded-full", row._status === "out_of_stock" ? "bg-red-500" : row._status === "low_stock" ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-[var(--muted-foreground)]">
                            Value: <span className="font-medium text-[var(--foreground)]">{formatCurrency(row._value)}</span>
                          </div>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                            onClick={() => { setAdjustProductId(row.productId); setQuantity(""); setReason(""); setAdjustType("add"); setAdjustReason("adjustment"); }}>
                            <ArrowUpDown className="h-3 w-3" />Adjust
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }}
              />
            )}
          </>
        )}

        {viewTab === "valuation" && (
          <Card>
            <CardContent className="p-0">
              <div className="border-b border-[var(--border)] px-4 py-3">
                <h3 className="text-sm font-semibold">Inventory Valuation</h3>
                <p className="text-xs text-[var(--muted-foreground)]">Total value breakdown by product</p>
              </div>
              <div className="p-4 space-y-2">
                {rows.length === 0 ? (
                  <EmptyState title="No data" description="Stock your products first." icon={<DollarSign className="h-6 w-6" />} />
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/10 px-4 py-3 text-center">
                        <p className="text-xs text-[var(--muted-foreground)]">Total Value</p>
                        <p className="text-lg font-bold tabular-nums mt-0.5">{formatCurrency(totalValue)}</p>
                      </div>
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/10 px-4 py-3 text-center">
                        <p className="text-xs text-[var(--muted-foreground)]">Avg Item Value</p>
                        <p className="text-lg font-bold tabular-nums mt-0.5">{formatCurrency(totalItems > 0 ? totalValue / totalItems : 0)}</p>
                      </div>
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/10 px-4 py-3 text-center">
                        <p className="text-xs text-[var(--muted-foreground)]">Total Units</p>
                        <p className="text-lg font-bold tabular-nums mt-0.5">{rows.reduce((s, r) => s + r.currentStock, 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {[...rows].sort((a, b) => b._value - a._value).slice(0, 20).map((row) => {
                        const pct = totalValue > 0 ? (row._value / totalValue) * 100 : 0;
                        return (
                          <div key={row.productId} className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-3 py-2">
                            <span className="text-sm font-medium flex-1 truncate">{row._name}</span>
                            <span className="text-xs text-[var(--muted-foreground)] tabular-nums shrink-0">{row.currentStock} units</span>
                            <div className="w-24 h-1.5 rounded-full bg-[var(--muted)] overflow-hidden shrink-0">
                              <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-sm font-bold tabular-nums shrink-0 w-24 text-right">{formatCurrency(row._value)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {viewTab === "abc" && (
          <Card>
            <CardContent className="p-0">
              <div className="border-b border-[var(--border)] px-4 py-3">
                <h3 className="text-sm font-semibold">ABC Analysis</h3>
                <p className="text-xs text-[var(--muted-foreground)]">Classify items by value contribution — A (top 80%), B (next 15%), C (bottom 5%)</p>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {(["A", "B", "C"] as const).map((cls) => {
                    const items = abcAnalysis.filter((a) => a._abcClass === cls);
                    const val = items.reduce((s, i) => s + i._value, 0);
                    return (
                      <div key={cls} className="rounded-xl border border-[var(--border)] p-4 text-center">
                        <Badge className={cn("text-sm font-bold mb-2", ABC_COLORS[cls])}>{cls}</Badge>
                        <p className="text-2xl font-bold">{items.length}</p>
                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">items · {formatCurrency(val)}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-1.5">
                  {abcAnalysis.map((row) => (
                    <div key={row.productId} className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-3 py-2">
                      <Badge className={cn("text-[10px] shrink-0", ABC_COLORS[row._abcClass])}>{row._abcClass}</Badge>
                      <span className="text-sm font-medium flex-1 truncate">{row._name}</span>
                      <span className="text-xs text-[var(--muted-foreground)] tabular-nums shrink-0">{row._valuePct.toFixed(1)}%</span>
                      <span className="text-sm font-bold tabular-nums shrink-0 w-24 text-right">{formatCurrency(row._value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Modal open={!!adjustProductId} onOpenChange={(o) => !o && setAdjustProductId(null)}>
          <ModalContent>
            <ModalHeader><ModalTitle>Stock Adjustment</ModalTitle></ModalHeader>
            <p className="text-sm text-[var(--muted-foreground)] -mt-2 mb-4">{adjustItemName}</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <Button type="button" variant={adjustType === "add" ? "default" : "outline"} className="gap-2" onClick={() => setAdjustType("add")}>
                    <PackagePlus className="h-4 w-4" />Add Stock
                  </Button>
                  <Button type="button" variant={adjustType === "remove" ? "default" : "outline"} className="gap-2" onClick={() => setAdjustType("remove")}>
                    <PackageMinus className="h-4 w-4" />Remove Stock
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <select value={adjustReason} onChange={(e) => setAdjustReason(e.target.value as StockMovementType)}
                  className="w-full mt-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20">
                  <option value="adjustment">Adjustment</option>
                  <option value="purchase">Purchase / Restock</option>
                  <option value="transfer">Transfer</option>
                  <option value="waste">Waste / Spoilage</option>
                  <option value="damaged">Damaged</option>
                  <option value="return">Return</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Quantity</label>
                <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1" placeholder="Enter quantity" />
              </div>
              <div>
                <label className="text-sm font-medium">Reason</label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Expired items, Vendor return" className="mt-1" />
              </div>
            </div>
            <ModalFooter>
              <ModalClose asChild><Button variant="outline">Cancel</Button></ModalClose>
              <Button onClick={handleAdjust} disabled={!branchId || !quantity || !reason || adjusting} className="gap-2">
                {adjusting ? "Applying..." : "Apply Adjustment"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </PageMotion>
    </RoleGuard>
  );
}
