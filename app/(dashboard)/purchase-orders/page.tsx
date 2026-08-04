"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageMotion } from "@/components/shared/PageMotion";
import { StatsCard } from "@/components/admin/StatsCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose,
} from "@/components/ui/drawer";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import { createPO, updatePOStatus, receiveItems, deletePO } from "@/redux/slices/purchaseOrderSlice";
import { useGetSuppliersQuery } from "@/redux/api/suppliersEndpoints";
import { useGetProductsQuery } from "@/redux/api/productsEndpoints";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";
import type { PurchaseOrder, POStatus } from "@/types/purchase-order";
import {
  FileText, Plus, Search, Filter, X, ChevronRight, Truck,
  CheckCircle2, Clock, Ban, Package, DollarSign, ClipboardList,
  ArrowRight, PackageCheck, Trash2, Save, Calendar,
} from "lucide-react";

type StatusFilter = "all" | POStatus;

const STATUS_CONFIG: Record<POStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-600", icon: <FileText className="h-3 w-3" /> },
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700", icon: <Clock className="h-3 w-3" /> },
  approved: { label: "Approved", color: "bg-blue-100 text-blue-700", icon: <CheckCircle2 className="h-3 w-3" /> },
  received: { label: "Received", color: "bg-emerald-100 text-emerald-700", icon: <PackageCheck className="h-3 w-3" /> },
  partial: { label: "Partial", color: "bg-purple-100 text-purple-700", icon: <Package className="h-3 w-3" /> },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: <Ban className="h-3 w-3" /> },
};

const FILTER_LIST: StatusFilter[] = ["all", "pending", "approved", "partial", "received", "cancelled"];

function CreatePODrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const { data: suppliers = [] } = useGetSuppliersQuery();
  const { data: productsRes } = useGetProductsQuery({});
  const products = productsRes?.data ?? [];

  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [lines, setLines] = useState<{ productId: string; productName: string; quantity: number; unitCost: number; tax: number; discount: number }[]>([]);

  const supplierName = suppliers.find((s) => s.id === supplierId)?.name ?? "";
  const total = lines.reduce((s, l) => s + l.unitCost * l.quantity + l.tax - l.discount, 0);

  const addLine = () => {
    setLines([...lines, { productId: "", productName: "", quantity: 1, unitCost: 0, tax: 0, discount: 0 }]);
  };

  const updateLine = (idx: number, field: string, value: string | number) => {
    const next = [...lines];
    (next[idx] as Record<string, unknown>)[field] = value;
    if (field === "productId") {
      const p = products.find((pr) => pr.id === value);
      next[idx].productName = p?.name ?? "";
      next[idx].unitCost = p?.cost ?? p?.price ?? 0;
    }
    setLines(next);
  };

  const removeLine = (idx: number) => setLines(lines.filter((_, i) => i !== idx));

  const handleSubmit = () => {
    if (!supplierId) { toast.error("Select a supplier"); return; }
    if (lines.length === 0 || lines.some((l) => !l.productId || l.quantity < 1)) {
      toast.error("Add at least one valid item"); return;
    }
    dispatch(createPO({ supplierId, supplierName, items: lines, notes: notes.trim() || undefined, expectedDate: expectedDate || undefined }));
    toast.success("Purchase order created");
    setSupplierId(""); setNotes(""); setExpectedDate(""); setLines([]);
    onClose();
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-w-xl ml-auto h-full rounded-none border-l border-[var(--border)]">
        <DrawerHeader className="border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-bold">New Purchase Order</DrawerTitle>
            <DrawerClose asChild><Button variant="ghost" size="icon" className="h-8 w-8"><X className="h-4 w-4" /></Button></DrawerClose>
          </div>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Supplier *</label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20">
              <option value="">Select supplier</option>
              {suppliers.filter((s) => s.status === "active").map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Expected Date</label>
              <input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20" />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Notes</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold">Line Items</h4>
              <Button size="sm" variant="outline" onClick={addLine} className="gap-1.5 text-xs h-7"><Plus className="h-3 w-3" />Add Item</Button>
            </div>
            {lines.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border)] py-8 text-center">
                <p className="text-sm text-[var(--muted-foreground)]">No items added yet</p>
                <Button size="sm" variant="outline" onClick={addLine} className="mt-3 gap-1.5 text-xs"><Plus className="h-3 w-3" />Add Item</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {lines.map((line, idx) => (
                  <div key={idx} className="rounded-xl border border-[var(--border)] p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <select value={line.productId} onChange={(e) => updateLine(idx, "productId", e.target.value)}
                        className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20">
                        <option value="">Select product</option>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => removeLine(idx)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] text-[var(--muted-foreground)]">Qty</label>
                        <input type="number" min={1} value={line.quantity} onChange={(e) => updateLine(idx, "quantity", Number(e.target.value))}
                          className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs tabular-nums focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] text-[var(--muted-foreground)]">Cost</label>
                        <input type="number" min={0} step={0.01} value={line.unitCost} onChange={(e) => updateLine(idx, "unitCost", Number(e.target.value))}
                          className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs tabular-nums focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] text-[var(--muted-foreground)]">Tax</label>
                        <input type="number" min={0} step={0.01} value={line.tax} onChange={(e) => updateLine(idx, "tax", Number(e.target.value))}
                          className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs tabular-nums focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] text-[var(--muted-foreground)]">Discount</label>
                        <input type="number" min={0} step={0.01} value={line.discount} onChange={(e) => updateLine(idx, "discount", Number(e.target.value))}
                          className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs tabular-nums focus:outline-none" />
                      </div>
                    </div>
                    <p className="text-xs text-right font-medium tabular-nums">
                      Line: {formatCurrency(line.unitCost * line.quantity + line.tax - line.discount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {lines.length > 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/10 px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-lg font-bold tabular-nums">{formatCurrency(total)}</span>
            </div>
          )}
        </div>
        <div className="shrink-0 border-t border-[var(--border)] px-6 py-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} className="gap-1.5"><Save className="h-4 w-4" />Create PO</Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function PODetailDrawer({ open, onClose, po }: { open: boolean; onClose: () => void; po: PurchaseOrder | null }) {
  const dispatch = useAppDispatch();
  const [receiving, setReceiving] = useState(false);
  const [recvQtys, setRecvQtys] = useState<Record<string, number>>({});

  if (!po) return null;

  const config = STATUS_CONFIG[po.status];
  const canApprove = po.status === "pending";
  const canReceive = po.status === "approved" || po.status === "partial";
  const canCancel = po.status === "pending" || po.status === "approved";

  const handleReceive = () => {
    const items = Object.entries(recvQtys)
      .filter(([, qty]) => qty > 0)
      .map(([lineItemId, qty]) => ({ lineItemId, qty }));
    if (items.length === 0) { toast.error("Enter received quantities"); return; }
    dispatch(receiveItems({ poId: po.id, receivedItems: items }));
    toast.success("Items received");
    setReceiving(false);
    setRecvQtys({});
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-w-lg ml-auto h-full rounded-none border-l border-[var(--border)]">
        <DrawerHeader className="border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-lg font-bold">{po.poNumber}</DrawerTitle>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{po.supplierName}</p>
            </div>
            <DrawerClose asChild><Button variant="ghost" size="icon" className="h-8 w-8"><X className="h-4 w-4" /></Button></DrawerClose>
          </div>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="flex items-center gap-3">
            <Badge className={cn("text-xs gap-1", config.color)}>{config.icon}{config.label}</Badge>
            <span className="text-xs text-[var(--muted-foreground)]">
              {new Date(po.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            {po.expectedDate && (
              <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                <Calendar className="h-3 w-3" />Expected: {new Date(po.expectedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            )}
          </div>

          {po.notes && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/10 px-3 py-2 text-xs">{po.notes}</div>
          )}

          <div>
            <h4 className="text-sm font-semibold mb-2">Items ({po.items.length})</h4>
            <div className="space-y-2">
              {po.items.map((item) => {
                const pct = item.quantity > 0 ? Math.round((item.receivedQty / item.quantity) * 100) : 0;
                return (
                  <div key={item.id} className="rounded-xl border border-[var(--border)] p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.productName}</span>
                      <span className="text-sm font-bold tabular-nums">{formatCurrency(item.total)}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-[var(--muted-foreground)]">
                      <span>Qty: {item.quantity}</span>
                      <span>Cost: {formatCurrency(item.unitCost)}</span>
                      <span>Received: {item.receivedQty}/{item.quantity}</span>
                    </div>
                    {(canReceive || po.status === "received" || po.status === "partial") && (
                      <div className="mt-2 h-1.5 rounded-full bg-[var(--muted)] overflow-hidden">
                        <div className={cn("h-full rounded-full", pct >= 100 ? "bg-emerald-500" : pct > 0 ? "bg-blue-500" : "bg-slate-300")} style={{ width: `${pct}%` }} />
                      </div>
                    )}
                    {receiving && (
                      <div className="mt-2">
                        <label className="text-[10px] text-[var(--muted-foreground)]">Receive qty</label>
                        <input type="number" min={0} max={item.quantity - item.receivedQty}
                          value={recvQtys[item.id] ?? 0}
                          onChange={(e) => setRecvQtys({ ...recvQtys, [item.id]: Number(e.target.value) })}
                          className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs tabular-nums mt-0.5 focus:outline-none" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/10 px-4 py-3 space-y-1.5">
            <div className="flex justify-between text-xs"><span>Subtotal</span><span className="tabular-nums">{formatCurrency(po.subtotal)}</span></div>
            <div className="flex justify-between text-xs"><span>Tax</span><span className="tabular-nums">{formatCurrency(po.taxTotal)}</span></div>
            <div className="flex justify-between text-xs"><span>Discount</span><span className="tabular-nums">-{formatCurrency(po.discountTotal)}</span></div>
            <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-[var(--border)]"><span>Grand Total</span><span className="tabular-nums">{formatCurrency(po.grandTotal)}</span></div>
          </div>
        </div>

        <div className="shrink-0 border-t border-[var(--border)] px-6 py-4 flex flex-wrap gap-2">
          {canApprove && (
            <Button size="sm" className="gap-1.5" onClick={() => { dispatch(updatePOStatus({ id: po.id, status: "approved" })); toast.success("PO approved"); }}>
              <CheckCircle2 className="h-3.5 w-3.5" />Approve
            </Button>
          )}
          {canReceive && !receiving && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setReceiving(true)}>
              <PackageCheck className="h-3.5 w-3.5" />Receive Items
            </Button>
          )}
          {receiving && (
            <>
              <Button size="sm" className="gap-1.5" onClick={handleReceive}><PackageCheck className="h-3.5 w-3.5" />Confirm Receipt</Button>
              <Button size="sm" variant="outline" onClick={() => { setReceiving(false); setRecvQtys({}); }}>Cancel</Button>
            </>
          )}
          {canCancel && (
            <Button size="sm" variant="outline" className="gap-1.5 text-red-600 hover:bg-red-50 border-red-200"
              onClick={() => { dispatch(updatePOStatus({ id: po.id, status: "cancelled" })); toast.success("PO cancelled"); }}>
              <Ban className="h-3.5 w-3.5" />Cancel PO
            </Button>
          )}
          {(po.status === "cancelled" || po.status === "draft") && (
            <Button size="sm" variant="outline" className="gap-1.5 text-red-600 hover:bg-red-50 border-red-200"
              onClick={() => { dispatch(deletePO(po.id)); toast.success("PO deleted"); onClose(); }}>
              <Trash2 className="h-3.5 w-3.5" />Delete
            </Button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default function PurchaseOrdersPage() {
  const dispatch = useAppDispatch();
  const { orders } = useAppSelector((s) => s.purchaseOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    approved: orders.filter((o) => o.status === "approved").length,
    received: orders.filter((o) => o.status === "received").length,
    totalValue: orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.grandTotal, 0),
  }), [orders]);

  const filtered = useMemo(() => {
    let result = orders;
    if (statusFilter !== "all") result = result.filter((o) => o.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((o) => o.poNumber.toLowerCase().includes(q) || o.supplierName.toLowerCase().includes(q));
    }
    return result;
  }, [orders, statusFilter, searchQuery]);

  return (
    <RoleGuard permission="purchase_orders">
      <PageMotion>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
            <p className="text-sm text-[var(--muted-foreground)]">Create and manage purchase orders for your suppliers</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2 shrink-0 mt-2 sm:mt-0"><Plus className="h-4 w-4" />New PO</Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total POs" value={stats.total} animate icon={<FileText className="h-5 w-5" />} />
          <StatsCard title="Pending" value={stats.pending} animate icon={<Clock className="h-5 w-5" />} />
          <StatsCard title="Received" value={stats.received} animate icon={<PackageCheck className="h-5 w-5" />} />
          <StatsCard title="Total Value" value={formatCurrency(stats.totalValue)} icon={<DollarSign className="h-5 w-5" />} />
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="flex flex-col gap-3 border-b border-[var(--border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                <input type="text" placeholder="Search by PO# or supplier..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2 pl-9 pr-4 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]" />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <Filter className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />
                <nav className="flex items-center gap-1 rounded-xl bg-[var(--muted)]/50 p-1">
                  {FILTER_LIST.map((f) => (
                    <button key={f} type="button" onClick={() => setStatusFilter(f)}
                      className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-all capitalize shrink-0",
                        statusFilter === f ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      )}>
                      {f}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            <div className="p-4">
              {orders.length === 0 && statusFilter === "all" && !searchQuery.trim() ? (
                <EmptyState title="No purchase orders" description="Create your first purchase order to start tracking supplier purchases." icon={<FileText className="h-6 w-6" />}
                  action={<Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" />New PO</Button>} />
              ) : filtered.length === 0 ? (
                <EmptyState title="No matching orders" description="Try adjusting your search or filters." icon={<Search className="h-6 w-6" />} />
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-[var(--muted-foreground)] px-1 mb-3">{filtered.length} order{filtered.length !== 1 ? "s" : ""}</p>
                  <AnimatePresence mode="popLayout">
                    {filtered.map((po) => {
                      const cfg = STATUS_CONFIG[po.status];
                      return (
                        <motion.div key={po.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="group">
                          <button type="button" onClick={() => { setSelectedPO(po); setDetailOpen(true); }}
                            className="w-full flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3.5 text-left transition-all hover:shadow-md hover:border-[var(--primary)]/20">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)]">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold">{po.poNumber}</span>
                                <Badge className={cn("text-[10px] gap-0.5", cfg.color)}>{cfg.icon}{cfg.label}</Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-xs text-[var(--muted-foreground)]">
                                <Truck className="h-3 w-3" />{po.supplierName}
                                <span className="opacity-40">·</span>
                                <span>{po.items.length} item{po.items.length !== 1 ? "s" : ""}</span>
                                <span className="opacity-40">·</span>
                                <span>{new Date(po.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                              </div>
                            </div>
                            <span className="text-sm font-bold tabular-nums shrink-0">{formatCurrency(po.grandTotal)}</span>
                            <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <CreatePODrawer open={createOpen} onClose={() => setCreateOpen(false)} />
        <PODetailDrawer open={detailOpen} onClose={() => setDetailOpen(false)} po={selectedPO} />
      </PageMotion>
    </RoleGuard>
  );
}
