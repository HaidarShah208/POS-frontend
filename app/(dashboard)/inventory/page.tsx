"use client";

import { useState, useMemo } from "react";
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
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  ModalClose,
} from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import {
  Warehouse,
  AlertTriangle,
  XCircle,
  DollarSign,
  PackagePlus,
  PackageMinus,
  ArrowUpDown,
  History,
} from "lucide-react";
import type { InventoryItem } from "@/types/api/index";

type StatusFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";

type InventoryRow = InventoryItem & {
  _name: string;
  _status: "in_stock" | "low_stock" | "out_of_stock";
  _value: number;
  _cost: number;
};

export default function InventoryPage() {
  const { data: inventoryResponse, isLoading } = useGetInventoryQuery();
  const inventory = inventoryResponse?.data ?? [];
  const { data: branches = [] } = useGetBranchesQuery();
  const branchId = branches[0]?.id ?? "";
  const [adjustProductId, setAdjustProductId] = useState<string | null>(null);
  const [historyProductId, setHistoryProductId] = useState<string | null>(null);
  const [adjustType, setAdjustType] = useState<"add" | "remove">("add");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [adjustStock, { isLoading: adjusting }] = useAdjustStockMutation();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const history: { id: string; type: string; quantity: number; reason: string; date: string }[] = [];

  function itemStatus(i: InventoryItem): "in_stock" | "low_stock" | "out_of_stock" {
    if (i.status) return i.status;
    if (i.currentStock <= 0) return "out_of_stock";
    const threshold = i.lowStockThreshold ?? 10;
    return i.currentStock <= threshold ? "low_stock" : "in_stock";
  }

  function itemStockValue(i: InventoryItem): number {
    return i.stockValue ?? i.currentStock * (i.cost ?? 0);
  }

  const rows: InventoryRow[] = useMemo(
    () =>
      inventory.map((i) => ({
        ...i,
        _name: i.productName ?? i.product?.name ?? i.productId,
        _status: itemStatus(i),
        _value: itemStockValue(i),
        _cost: i.cost ?? 0,
      })),
    [inventory]
  );

  const filteredRows = useMemo(
    () => (statusFilter === "all" ? rows : rows.filter((r) => r._status === statusFilter)),
    [rows, statusFilter]
  );

  const totalItems = rows.length;
  const lowStock = rows.filter((r) => r._status === "low_stock").length;
  const outOfStock = rows.filter((r) => r._status === "out_of_stock").length;
  const inStock = rows.filter((r) => r._status === "in_stock").length;
  const totalValue = rows.reduce((s, r) => s + r._value, 0);

  const adjustItemName = useMemo(() => {
    if (!adjustProductId) return "";
    const item = rows.find((r) => r.productId === adjustProductId);
    return item?._name ?? adjustProductId;
  }, [adjustProductId, rows]);

  const handleAdjust = async () => {
    if (!adjustProductId || !quantity || !reason || !branchId) return;
    await adjustStock({
      productId: adjustProductId,
      branchId,
      type: adjustType,
      quantity: Number(quantity),
      reason,
    });
    setAdjustProductId(null);
    setQuantity("");
    setReason("");
  };

  const STATUS_BADGE: Record<string, { variant: "success" | "warning" | "destructive"; label: string }> = {
    in_stock: { variant: "success", label: "In Stock" },
    low_stock: { variant: "warning", label: "Low Stock" },
    out_of_stock: { variant: "destructive", label: "Out of Stock" },
  };

  const columns: DataTableColumn<InventoryRow>[] = useMemo(
    () => [
      {
        id: "product",
        header: "Product",
        accessor: (row) => (
          <span className="font-medium text-sm">{row._name}</span>
        ),
        sortable: true,
      },
      {
        id: "stock",
        header: "Stock Level",
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
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    row._status === "out_of_stock"
                      ? "bg-red-500"
                      : row._status === "low_stock"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        },
        sortable: true,
      },
      {
        id: "cost",
        header: "Unit Cost",
        accessor: (row) => (
          <span className="text-sm tabular-nums">{formatCurrency(row._cost)}</span>
        ),
        sortable: true,
      },
      {
        id: "value",
        header: "Stock Value",
        accessor: (row) => (
          <span className="text-sm font-medium tabular-nums">{formatCurrency(row._value)}</span>
        ),
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
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              onClick={() => {
                setAdjustProductId(row.productId);
                setQuantity("");
                setReason("");
                setAdjustType("add");
              }}
            >
              <ArrowUpDown className="h-3 w-3" />
              Adjust
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setHistoryProductId(row.productId)}
            >
              <History className="h-3 w-3" />
            </Button>
          </div>
        ),
        className: "w-36",
      },
    ],
    []
  );

  const STATUS_FILTERS: { value: StatusFilter; label: string; count: number }[] = [
    { value: "all", label: "All", count: totalItems },
    { value: "in_stock", label: "In Stock", count: inStock },
    { value: "low_stock", label: "Low Stock", count: lowStock },
    { value: "out_of_stock", label: "Out of Stock", count: outOfStock },
  ];

  return (
    <RoleGuard permission="inventory">
      <PageMotion>
        <PageHeader
          title="Inventory"
          description="Monitor stock levels and manage adjustments"
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Items"
            value={isLoading ? "—" : totalItems}
            animate={!isLoading}
            icon={<Warehouse className="h-5 w-5" />}
          />
          <StatsCard
            title="Low Stock"
            value={isLoading ? "—" : lowStock}
            animate={!isLoading}
            icon={<AlertTriangle className="h-5 w-5" />}
            subtitle="Needs restock"
          />
          <StatsCard
            title="Out of Stock"
            value={isLoading ? "—" : outOfStock}
            animate={!isLoading}
            icon={<XCircle className="h-5 w-5" />}
            subtitle="Urgent attention"
          />
          <StatsCard
            title="Stock Value"
            value={isLoading ? "—" : formatCurrency(totalValue)}
            icon={<DollarSign className="h-5 w-5" />}
          />
        </div>

        {!isLoading && rows.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scroll-area-thin">
            {STATUS_FILTERS.map((f) => (
              <Button
                key={f.value}
                variant={statusFilter === f.value ? "default" : "outline"}
                size="sm"
                className="shrink-0"
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label} ({f.count})
              </Button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="h-64 rounded-lg border border-[var(--border)] animate-pulse bg-[var(--muted)]/30" />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No inventory data"
            description="Inventory will appear here once products are stocked."
            icon={<Warehouse className="h-6 w-6" />}
          />
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
                <Card
                  className={cn(
                    "transition-shadow hover:shadow-[var(--shadow-sm)]",
                    row._status === "low_stock" && "border-amber-300",
                    row._status === "out_of_stock" && "border-red-300"
                  )}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate flex-1 mr-2">{row._name}</p>
                      <Badge variant={s.variant} className="shrink-0">{s.label}</Badge>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] mb-1">
                        <span>Stock: <span className="font-medium text-[var(--foreground)]">{row.currentStock}</span></span>
                        <span>Min: {threshold}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--muted)] overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            row._status === "out_of_stock"
                              ? "bg-red-500"
                              : row._status === "low_stock"
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-[var(--muted-foreground)]">
                        Cost: {formatCurrency(row._cost)} · Value: <span className="font-medium text-[var(--foreground)]">{formatCurrency(row._value)}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => {
                          setAdjustProductId(row.productId);
                          setQuantity("");
                          setReason("");
                          setAdjustType("add");
                        }}
                      >
                        <ArrowUpDown className="h-3 w-3" />
                        Adjust
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            }}
          />
        )}

        <Modal open={!!adjustProductId} onOpenChange={(o) => !o && setAdjustProductId(null)}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Adjust Stock</ModalTitle>
            </ModalHeader>
            <p className="text-sm text-[var(--muted-foreground)] -mt-2 mb-4">{adjustItemName}</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <Button
                    type="button"
                    variant={adjustType === "add" ? "default" : "outline"}
                    className="gap-2"
                    onClick={() => setAdjustType("add")}
                  >
                    <PackagePlus className="h-4 w-4" />
                    Add Stock
                  </Button>
                  <Button
                    type="button"
                    variant={adjustType === "remove" ? "default" : "outline"}
                    className="gap-2"
                    onClick={() => setAdjustType("remove")}
                  >
                    <PackageMinus className="h-4 w-4" />
                    Remove Stock
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Quantity</label>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="mt-1"
                  placeholder="Enter quantity"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Reason</label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Restock delivery, Spoilage"
                  className="mt-1"
                />
              </div>
            </div>
            <ModalFooter>
              <ModalClose asChild>
                <Button variant="outline">Cancel</Button>
              </ModalClose>
              <Button
                onClick={handleAdjust}
                disabled={!branchId || !quantity || !reason || adjusting}
                className="gap-2"
              >
                {adjusting ? "Applying..." : "Apply Adjustment"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal open={!!historyProductId} onOpenChange={(o) => !o && setHistoryProductId(null)}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Stock History</ModalTitle>
            </ModalHeader>
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {history.length === 0 ? (
                <li className="text-sm text-[var(--muted-foreground)] py-4 text-center">
                  No adjustments recorded yet.
                </li>
              ) : (
                history.map((adj) => (
                  <li
                    key={adj.id}
                    className="text-sm flex items-center justify-between rounded-lg border border-[var(--border)] p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant={adj.type === "add" ? "success" : "destructive"} className="text-[10px] px-1.5 py-0 h-4">
                        {adj.type === "add" ? "+" : "−"}{adj.quantity}
                      </Badge>
                      <span>{adj.reason}</span>
                    </div>
                    <span className="text-[var(--muted-foreground)] text-xs shrink-0 ml-2">{adj.date}</span>
                  </li>
                ))
              )}
            </ul>
            <ModalFooter>
              <ModalClose asChild>
                <Button variant="outline">Close</Button>
              </ModalClose>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </PageMotion>
    </RoleGuard>
  );
}
