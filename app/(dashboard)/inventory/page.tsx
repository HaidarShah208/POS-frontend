"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PageMotion } from "@/components/shared/PageMotion";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatsCard } from "@/components/admin/StatsCard";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { FormDrawer } from "@/components/admin/FormDrawer";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  useGetInventoryItemsQuery,
  useGetInventorySummaryQuery,
  useGetStockMovementsQuery,
  useGetItemHistoryQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,
  useAdjustNewStockMutation,
  useRecordWasteMutation,
} from "@/redux/api/inventoryEndpoints";
import {
  useGetRecipesQuery,
  useCreateRecipeMutation,
  useUpdateRecipeMutation,
  useDeleteRecipeMutation,
} from "@/redux/api/recipesEndpoints";
import {
  useGetPurchaseOrdersQuery,
  useCreatePurchaseOrderMutation,
  useReceiveItemsMutation,
  useCancelPurchaseOrderMutation,
} from "@/redux/api/purchaseOrdersEndpoints";
import { useGetProductsQuery } from "@/redux/api/productsEndpoints";
import { useGetSuppliersQuery } from "@/redux/api/suppliersEndpoints";
import { cn, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter, ModalClose,
} from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import {
  Warehouse, AlertTriangle, XCircle, DollarSign,
  PackagePlus, PackageMinus, ArrowUpDown, History, Layers,
  Trash2, RotateCcw, Plus, Search, MoreHorizontal,
  ChefHat, ShoppingCart, FileText, Package, Clock,
} from "lucide-react";
import type {
  NewInventoryItem, InventoryItemType, InventoryItemStatus, InventoryItemUnit,
  StockMovement, StockMovementType, Recipe, PurchaseOrder,
  GetNewInventoryParams, CreateInventoryItemInput,
} from "@/types/api/index";

type ViewTab = "stock" | "movements" | "recipes" | "purchase" | "waste" | "valuation" | "abc";

const INVENTORY_TYPES: { value: InventoryItemType; label: string }[] = [
  { value: "PRODUCT", label: "Product" },
  { value: "INGREDIENT", label: "Ingredient" },
  { value: "PACKAGING", label: "Packaging" },
];

const UNITS: InventoryItemUnit[] = ["PCS", "KG", "G", "L", "ML", "BOX", "PACK"];

const STATUS_BADGE: Record<InventoryItemStatus, { variant: "success" | "warning" | "destructive"; label: string }> = {
  IN_STOCK: { variant: "success", label: "In Stock" },
  LOW_STOCK: { variant: "warning", label: "Low Stock" },
  OUT_OF_STOCK: { variant: "destructive", label: "Out of Stock" },
};

const MOVEMENT_COLORS: Record<string, string> = {
  OPENING_STOCK: "text-blue-600 bg-blue-100",
  SALE: "text-indigo-600 bg-indigo-100",
  PURCHASE: "text-emerald-600 bg-emerald-100",
  RETURN: "text-amber-600 bg-amber-100",
  DAMAGE: "text-red-600 bg-red-100",
  WASTAGE: "text-red-600 bg-red-100",
  EXPIRED: "text-orange-600 bg-orange-100",
  MANUAL_ADJUSTMENT: "text-slate-600 bg-slate-100",
  STOCK_CORRECTION: "text-purple-600 bg-purple-100",
  RECIPE_DEDUCTION: "text-cyan-600 bg-cyan-100",
};

const VIEW_TABS: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
  { id: "stock", label: "Stock Levels", icon: <Warehouse className="h-4 w-4" /> },
  { id: "movements", label: "History", icon: <History className="h-4 w-4" /> },
  { id: "recipes", label: "Recipes", icon: <ChefHat className="h-4 w-4" /> },
  { id: "purchase", label: "Purchase Orders", icon: <ShoppingCart className="h-4 w-4" /> },
  { id: "waste", label: "Waste", icon: <Trash2 className="h-4 w-4" /> },
  { id: "valuation", label: "Valuation", icon: <DollarSign className="h-4 w-4" /> },
  { id: "abc", label: "ABC Analysis", icon: <Layers className="h-4 w-4" /> },
];

export default function InventoryPage() {
  const [viewTab, setViewTab] = useState<ViewTab>("stock");
  const [statusFilter, setStatusFilter] = useState<InventoryItemStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<InventoryItemType | "ALL">("ALL");
  const [stockPage, setStockPage] = useState(1);
  const [stockSearch, setStockSearch] = useState("");
  const [movementPage, setMovementPage] = useState(1);

  const queryParams: GetNewInventoryParams = useMemo(() => {
    const p: GetNewInventoryParams = { page: stockPage, limit: 20 };
    if (statusFilter !== "ALL") p.status = statusFilter;
    if (typeFilter !== "ALL") p.type = typeFilter;
    if (stockSearch.trim()) p.search = stockSearch.trim();
    return p;
  }, [stockPage, statusFilter, typeFilter, stockSearch]);

  const { data: itemsResponse, isLoading: itemsLoading } = useGetInventoryItemsQuery(queryParams);
  const { data: summary, isLoading: summaryLoading } = useGetInventorySummaryQuery();
  const { data: movementsResponse } = useGetStockMovementsQuery({ page: movementPage, limit: 20 });
  const { data: recipes = [], isLoading: recipesLoading } = useGetRecipesQuery();
  const { data: poResponse } = useGetPurchaseOrdersQuery();
  const { data: productsResponse } = useGetProductsQuery({});
  const { data: suppliersResponse } = useGetSuppliersQuery({});

  const items = itemsResponse?.data ?? [];
  const totalPages = itemsResponse?.totalPages ?? 1;
  const movements = movementsResponse?.data ?? [];
  const movementsTotalPages = movementsResponse?.totalPages ?? 1;
  const purchaseOrders = poResponse?.data ?? [];
  const products = productsResponse?.data ?? [];
  const suppliers = suppliersResponse ?? [];

  const [createItem] = useCreateInventoryItemMutation();
  const [updateItem] = useUpdateInventoryItemMutation();
  const [deleteItem] = useDeleteInventoryItemMutation();
  const [adjustStock, { isLoading: adjusting }] = useAdjustNewStockMutation();
  const [recordWaste, { isLoading: wasting }] = useRecordWasteMutation();
  const [createRecipe] = useCreateRecipeMutation();
  const [updateRecipe] = useUpdateRecipeMutation();
  const [deleteRecipe] = useDeleteRecipeMutation();
  const [createPO] = useCreatePurchaseOrderMutation();
  const [receiveItems] = useReceiveItemsMutation();
  const [cancelPO] = useCancelPurchaseOrderMutation();

  const [showAddItem, setShowAddItem] = useState(false);
  const [adjustItem, setAdjustItem] = useState<NewInventoryItem | null>(null);
  const [historyItem, setHistoryItem] = useState<NewInventoryItem | null>(null);
  const [wasteItem, setWasteItem] = useState<NewInventoryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NewInventoryItem | null>(null);
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [showAddPO, setShowAddPO] = useState(false);

  const [newItem, setNewItem] = useState({
    name: "", type: "INGREDIENT" as InventoryItemType, unit: "PCS" as InventoryItemUnit,
    productId: "", currentQuantity: 0, minimumQuantity: 0, costPerUnit: 0,
    trackInventory: true, trackExpiry: false,
  });

  const [adjForm, setAdjForm] = useState({ type: "add" as "add" | "remove", quantity: "", reason: "", notes: "" });
  const [wasteForm, setWasteForm] = useState({ quantity: "", reason: "DAMAGED" as string, notes: "" });

  const [recipeForm, setRecipeForm] = useState({
    productId: "", name: "",
    ingredients: [] as { inventoryItemId: string; quantity: number; unit: string }[],
  });

  const [poForm, setPOForm] = useState({
    supplierId: "", notes: "", expectedDate: "",
    items: [] as { inventoryItemId: string; orderedQuantity: number; unitCost: number }[],
  });

  const resetNewItem = useCallback(() => {
    setNewItem({
      name: "", type: "INGREDIENT", unit: "PCS", productId: "",
      currentQuantity: 0, minimumQuantity: 0, costPerUnit: 0,
      trackInventory: true, trackExpiry: false,
    });
  }, []);

  const handleCreateItem = async () => {
    const payload: CreateInventoryItemInput = {
      name: newItem.name,
      type: newItem.type as InventoryItemType,
      unit: newItem.unit as InventoryItemUnit,
      currentQuantity: newItem.currentQuantity,
      minimumQuantity: newItem.minimumQuantity,
      costPerUnit: newItem.costPerUnit,
      trackInventory: newItem.trackInventory,
      trackExpiry: newItem.trackExpiry,
    };
    if (newItem.productId) payload.productId = newItem.productId;
    await createItem(payload);
    setShowAddItem(false);
    resetNewItem();
  };

  const handleAdjustStock = async () => {
    if (!adjustItem || !adjForm.quantity || !adjForm.reason) return;
    await adjustStock({
      inventoryItemId: adjustItem.id,
      type: adjForm.type,
      quantity: Number(adjForm.quantity),
      reason: adjForm.reason,
      notes: adjForm.notes || undefined,
    });
    setAdjustItem(null);
    setAdjForm({ type: "add", quantity: "", reason: "", notes: "" });
  };

  const handleRecordWaste = async () => {
    if (!wasteItem || !wasteForm.quantity) return;
    await recordWaste({
      inventoryItemId: wasteItem.id,
      quantity: Number(wasteForm.quantity),
      reason: wasteForm.reason as Parameters<typeof recordWaste>[0]["reason"],
      notes: wasteForm.notes || undefined,
    });
    setWasteItem(null);
    setWasteForm({ quantity: "", reason: "DAMAGED", notes: "" });
  };

  const handleCreateRecipe = async () => {
    if (!recipeForm.productId || !recipeForm.name || recipeForm.ingredients.length === 0) return;
    await createRecipe(recipeForm);
    setShowAddRecipe(false);
    setRecipeForm({ productId: "", name: "", ingredients: [] });
  };

  const handleCreatePO = async () => {
    if (poForm.items.length === 0) return;
    await createPO({
      supplierId: poForm.supplierId || undefined,
      notes: poForm.notes || undefined,
      expectedDate: poForm.expectedDate || undefined,
      items: poForm.items,
    });
    setShowAddPO(false);
    setPOForm({ supplierId: "", notes: "", expectedDate: "", items: [] });
  };

  const ingredientItems = useMemo(
    () => items.filter((i) => i.type === "INGREDIENT" || i.type === "PACKAGING"),
    [items]
  );

  const allItemsForRecipes = useMemo(() => {
    const result: NewInventoryItem[] = [];
    if (itemsResponse?.data) result.push(...itemsResponse.data);
    return result;
  }, [itemsResponse]);

  const abcAnalysis = useMemo(() => {
    const withValue = items.map((i) => ({
      ...i,
      stockValue: Number(i.currentQuantity) * Number(i.costPerUnit),
    }));
    const sorted = [...withValue].sort((a, b) => b.stockValue - a.stockValue);
    const total = sorted.reduce((s, r) => s + r.stockValue, 0);
    let cumulative = 0;
    return sorted.map((r) => {
      cumulative += r.stockValue;
      const pct = total > 0 ? (cumulative / total) * 100 : 0;
      const cls: "A" | "B" | "C" = pct <= 80 ? "A" : pct <= 95 ? "B" : "C";
      return { ...r, abcClass: cls, valuePct: total > 0 ? (r.stockValue / total) * 100 : 0 };
    });
  }, [items]);

  const stockColumns: DataTableColumn<NewInventoryItem>[] = useMemo(() => [
    {
      id: "name",
      header: "Item",
      accessor: (row) => (
        <div>
          <span className="font-medium text-sm block">{row.name}</span>
          <span className="text-[10px] text-[var(--muted-foreground)]">
            {row.type} · {row.unit}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      id: "type",
      header: "Type",
      accessor: (row) => (
        <Badge variant="outline" className="text-[10px]">
          {row.type === "PRODUCT" ? <Package className="h-3 w-3 mr-1" /> :
           row.type === "INGREDIENT" ? <ChefHat className="h-3 w-3 mr-1" /> :
           <FileText className="h-3 w-3 mr-1" />}
          {row.type}
        </Badge>
      ),
    },
    {
      id: "quantity",
      header: "Stock",
      accessor: (row) => {
        const current = Number(row.currentQuantity);
        const min = Number(row.minimumQuantity);
        const max = Math.max(min * 3, current, 1);
        const pct = Math.min((current / max) * 100, 100);
        return (
          <div className="min-w-[120px]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium tabular-nums">{current} {row.unit}</span>
              <span className="text-[10px] text-[var(--muted-foreground)]">min {min}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--muted)] overflow-hidden">
              <div className={cn("h-full rounded-full transition-all",
                row.status === "OUT_OF_STOCK" ? "bg-red-500" :
                row.status === "LOW_STOCK" ? "bg-amber-500" : "bg-emerald-500"
              )} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      },
      sortable: true,
    },
    {
      id: "costPerUnit",
      header: "Cost/Unit",
      accessor: (row) => <span className="text-sm tabular-nums">{formatCurrency(Number(row.costPerUnit))}</span>,
      sortable: true,
    },
    {
      id: "value",
      header: "Value",
      accessor: (row) => (
        <span className="text-sm font-medium tabular-nums">
          {formatCurrency(Number(row.currentQuantity) * Number(row.costPerUnit))}
        </span>
      ),
      sortable: true,
    },
    {
      id: "status",
      header: "Status",
      accessor: (row) => {
        const s = STATUS_BADGE[row.status];
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
    {
      id: "actions",
      header: "",
      accessor: (row) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
            onClick={() => { setAdjustItem(row); setAdjForm({ type: "add", quantity: "", reason: "", notes: "" }); }}>
            <ArrowUpDown className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
            onClick={() => setHistoryItem(row)}>
            <History className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-red-600 hover:text-red-700"
            onClick={() => setWasteItem(row)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
      className: "w-32",
    },
  ], []);

  return (
    <RoleGuard permission="inventory">
      <PageMotion>
        <PageHeader title="Inventory" description="Manage stock, recipes, purchases, and waste tracking">
          <Button onClick={() => { setShowAddItem(true); resetNewItem(); }} className="gap-2">
            <Plus className="h-4 w-4" />Add Item
          </Button>
        </PageHeader>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          <StatsCard title="Total Items" value={summaryLoading ? "—" : summary?.totalItems ?? 0} animate={!summaryLoading} icon={<Warehouse className="h-5 w-5" />} />
          <StatsCard title="Low Stock" value={summaryLoading ? "—" : summary?.lowStock ?? 0} animate={!summaryLoading} icon={<AlertTriangle className="h-5 w-5" />} subtitle="Needs restock" />
          <StatsCard title="Out of Stock" value={summaryLoading ? "—" : summary?.outOfStock ?? 0} animate={!summaryLoading} icon={<XCircle className="h-5 w-5" />} />
          <StatsCard title="Expiring Soon" value={summaryLoading ? "—" : summary?.expiringSoon ?? 0} animate={!summaryLoading} icon={<Clock className="h-5 w-5" />} />
          <StatsCard title="Stock Value" value={summaryLoading ? "—" : formatCurrency(summary?.totalValue ?? 0)} icon={<DollarSign className="h-5 w-5" />} />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {VIEW_TABS.map((t) => (
            <Button key={t.id} variant={viewTab === t.id ? "default" : "outline"} size="sm" className="gap-1.5 shrink-0"
              onClick={() => setViewTab(t.id)}>
              {t.icon}{t.label}
            </Button>
          ))}
        </div>

        {viewTab === "stock" && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                <Input
                  placeholder="Search items..."
                  value={stockSearch}
                  onChange={(e) => { setStockSearch(e.target.value); setStockPage(1); }}
                  className="pl-9"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value as InventoryItemType | "ALL"); setStockPage(1); }}
                className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              >
                <option value="ALL">All Types</option>
                {INVENTORY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as InventoryItemStatus | "ALL"); setStockPage(1); }}
                className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              >
                <option value="ALL">All Status</option>
                <option value="IN_STOCK">In Stock</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
            </div>

            {itemsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-lg border border-[var(--border)] animate-pulse bg-[var(--muted)]/30" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                title="No inventory items"
                description="Add products, ingredients, or packaging to start tracking inventory."
                icon={<Warehouse className="h-6 w-6" />}
                action={<Button onClick={() => { setShowAddItem(true); resetNewItem(); }} className="gap-2"><Plus className="h-4 w-4" />Add Item</Button>}
              />
            ) : (
              <>
                <DataTable
                  columns={stockColumns}
                  data={items}
                  keyExtractor={(row) => row.id}
                  emptyMessage="No items match the current filter"
                  mobileCardView={(row) => {
                    const s = STATUS_BADGE[row.status];
                    const current = Number(row.currentQuantity);
                    const min = Number(row.minimumQuantity);
                    const max = Math.max(min * 3, current, 1);
                    const pct = Math.min((current / max) * 100, 100);
                    return (
                      <Card className={cn("transition-shadow hover:shadow-[var(--shadow-sm)]",
                        row.status === "LOW_STOCK" && "border-amber-300",
                        row.status === "OUT_OF_STOCK" && "border-red-300"
                      )}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1 mr-2">
                              <p className="font-medium text-sm truncate">{row.name}</p>
                              <p className="text-[10px] text-[var(--muted-foreground)]">{row.type} · {row.unit}</p>
                            </div>
                            <Badge variant={s.variant} className="shrink-0">{s.label}</Badge>
                          </div>
                          <div>
                            <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] mb-1">
                              <span>Stock: <span className="font-medium text-[var(--foreground)]">{current}</span></span>
                              <span>Min: {min}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-[var(--muted)] overflow-hidden">
                              <div className={cn("h-full rounded-full",
                                row.status === "OUT_OF_STOCK" ? "bg-red-500" :
                                row.status === "LOW_STOCK" ? "bg-amber-500" : "bg-emerald-500"
                              )} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[var(--muted-foreground)]">
                              Value: <span className="font-medium text-[var(--foreground)]">{formatCurrency(current * Number(row.costPerUnit))}</span>
                            </span>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" className="h-7 text-xs"
                                onClick={() => { setAdjustItem(row); setAdjForm({ type: "add", quantity: "", reason: "", notes: "" }); }}>
                                <ArrowUpDown className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs"
                                onClick={() => setHistoryItem(row)}>
                                <History className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }}
                />
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Button variant="outline" size="sm" disabled={stockPage <= 1} onClick={() => setStockPage(stockPage - 1)}>Previous</Button>
                    <span className="text-sm text-[var(--muted-foreground)]">Page {stockPage} of {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={stockPage >= totalPages} onClick={() => setStockPage(stockPage + 1)}>Next</Button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {viewTab === "movements" && (
          <Card>
            <CardContent className="p-0">
              <div className="border-b border-[var(--border)] px-4 py-3">
                <h3 className="text-sm font-semibold">Stock Movement History</h3>
                <p className="text-xs text-[var(--muted-foreground)]">All inventory changes across your organization</p>
              </div>
              {movements.length === 0 ? (
                <div className="p-6">
                  <EmptyState title="No stock movements" description="Stock movements will appear here as inventory changes occur." icon={<History className="h-6 w-6" />} />
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {movements.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--muted)]/30 transition-colors">
                      <div className={cn("flex items-center justify-center h-8 w-8 rounded-lg shrink-0", MOVEMENT_COLORS[m.type] ?? "text-slate-600 bg-slate-100")}>
                        {Number(m.quantity) >= 0 ? <PackagePlus className="h-3.5 w-3.5" /> : <PackageMinus className="h-3.5 w-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.inventoryItem?.name ?? m.inventoryItemId}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {m.type.replace(/_/g, " ")} {m.reason ? `· ${m.reason}` : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn("text-sm font-bold tabular-nums", Number(m.quantity) >= 0 ? "text-emerald-600" : "text-red-600")}>
                          {Number(m.quantity) >= 0 ? "+" : ""}{Number(m.quantity)}
                        </p>
                        <p className="text-[10px] text-[var(--muted-foreground)] tabular-nums">
                          {Number(m.previousQuantity)} → {Number(m.newQuantity)}
                        </p>
                      </div>
                      <div className="text-right shrink-0 min-w-[80px]">
                        <p className="text-[10px] text-[var(--muted-foreground)]">
                          {new Date(m.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                        <p className="text-[10px] text-[var(--muted-foreground)]">
                          {new Date(m.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {movementsTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-3 border-t border-[var(--border)]">
                  <Button variant="outline" size="sm" disabled={movementPage <= 1} onClick={() => setMovementPage(movementPage - 1)}>Previous</Button>
                  <span className="text-sm text-[var(--muted-foreground)]">Page {movementPage} of {movementsTotalPages}</span>
                  <Button variant="outline" size="sm" disabled={movementPage >= movementsTotalPages} onClick={() => setMovementPage(movementPage + 1)}>Next</Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {viewTab === "recipes" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Product Recipes</h3>
                <p className="text-xs text-[var(--muted-foreground)]">Define ingredients for automatic deduction on sales</p>
              </div>
              <Button size="sm" onClick={() => { setShowAddRecipe(true); setRecipeForm({ productId: "", name: "", ingredients: [] }); }} className="gap-1.5">
                <Plus className="h-4 w-4" />Add Recipe
              </Button>
            </div>

            {recipesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-lg border border-[var(--border)] animate-pulse bg-[var(--muted)]/30" />
                ))}
              </div>
            ) : recipes.length === 0 ? (
              <EmptyState
                title="No recipes defined"
                description="Create recipes to automatically deduct ingredients when products are sold."
                icon={<ChefHat className="h-6 w-6" />}
                action={<Button onClick={() => setShowAddRecipe(true)} className="gap-2"><Plus className="h-4 w-4" />Create Recipe</Button>}
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {recipes.map((recipe) => (
                  <Card key={recipe.id} className="hover:shadow-[var(--shadow-sm)] transition-shadow">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{recipe.name}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">{recipe.product?.name ?? "—"}</p>
                        </div>
                        <Badge variant={recipe.isActive ? "success" : "outline"}>
                          {recipe.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                        <span>{recipe.ingredients?.length ?? 0} ingredients</span>
                        <span className="font-medium text-[var(--foreground)]">Cost: {formatCurrency(Number(recipe.estimatedCost))}</span>
                      </div>
                      {recipe.ingredients && recipe.ingredients.length > 0 && (
                        <div className="space-y-1">
                          {recipe.ingredients.slice(0, 3).map((ing) => (
                            <div key={ing.id} className="flex items-center justify-between text-xs">
                              <span className="truncate">{ing.inventoryItem?.name ?? ing.inventoryItemId}</span>
                              <span className="text-[var(--muted-foreground)] shrink-0 ml-2">{Number(ing.quantity)} {ing.unit}</span>
                            </div>
                          ))}
                          {recipe.ingredients.length > 3 && (
                            <p className="text-[10px] text-[var(--muted-foreground)]">+{recipe.ingredients.length - 3} more</p>
                          )}
                        </div>
                      )}
                      <div className="flex gap-1 pt-1">
                        <Button size="sm" variant="outline" className="h-7 text-xs flex-1"
                          onClick={() => updateRecipe({ id: recipe.id, data: { isActive: !recipe.isActive } })}>
                          {recipe.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 hover:text-red-700"
                          onClick={() => deleteRecipe(recipe.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {viewTab === "purchase" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Purchase Orders</h3>
                <p className="text-xs text-[var(--muted-foreground)]">Manage purchase orders and receive stock from suppliers</p>
              </div>
              <Button size="sm" onClick={() => { setShowAddPO(true); setPOForm({ supplierId: "", notes: "", expectedDate: "", items: [] }); }} className="gap-1.5">
                <Plus className="h-4 w-4" />New PO
              </Button>
            </div>

            {purchaseOrders.length === 0 ? (
              <EmptyState
                title="No purchase orders"
                description="Create purchase orders to track stock procurement from suppliers."
                icon={<ShoppingCart className="h-6 w-6" />}
                action={<Button onClick={() => setShowAddPO(true)} className="gap-2"><Plus className="h-4 w-4" />Create PO</Button>}
              />
            ) : (
              <div className="space-y-3">
                {purchaseOrders.map((po) => (
                  <Card key={po.id} className="hover:shadow-[var(--shadow-sm)] transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{po.orderNumber}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {po.supplier?.name ?? "No supplier"} · {new Date(po.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={
                          po.status === "RECEIVED" ? "success" :
                          po.status === "CANCELLED" ? "destructive" :
                          po.status === "PARTIAL" ? "warning" : "outline"
                        }>
                          {po.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium tabular-nums">{formatCurrency(Number(po.totalAmount))}</span>
                        <div className="flex gap-1">
                          {(po.status === "DRAFT" || po.status === "SENT") && (
                            <>
                              <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                                onClick={() => receiveItems({ id: po.id, data: { items: po.items?.map((i) => ({ purchaseOrderItemId: i.id, receivedQuantity: Number(i.orderedQuantity) })) ?? [] } })}>
                                <PackagePlus className="h-3 w-3" />Receive All
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs text-red-600"
                                onClick={() => cancelPO(po.id)}>
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {viewTab === "waste" && (
          <Card>
            <CardContent className="p-0">
              <div className="border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Waste Management</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">Record damaged, expired, or spoiled items</p>
                </div>
              </div>
              <div className="p-4">
                {items.length === 0 ? (
                  <EmptyState title="No inventory items" description="Add inventory items first to record waste." icon={<Trash2 className="h-6 w-6" />} />
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {items.filter((i) => Number(i.currentQuantity) > 0).map((item) => (
                      <Card key={item.id} className="hover:shadow-[var(--shadow-sm)] transition-shadow cursor-pointer"
                        onClick={() => { setWasteItem(item); setWasteForm({ quantity: "", reason: "DAMAGED", notes: "" }); }}>
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-red-50 text-red-500 shrink-0">
                            <Trash2 className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            <p className="text-xs text-[var(--muted-foreground)]">
                              Available: {Number(item.currentQuantity)} {item.unit}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {viewTab === "valuation" && (
          <Card>
            <CardContent className="p-0">
              <div className="border-b border-[var(--border)] px-4 py-3">
                <h3 className="text-sm font-semibold">Inventory Valuation</h3>
                <p className="text-xs text-[var(--muted-foreground)]">Total value breakdown by inventory item</p>
              </div>
              <div className="p-4 space-y-4">
                {items.length === 0 ? (
                  <EmptyState title="No data" description="Add inventory items to see valuation." icon={<DollarSign className="h-6 w-6" />} />
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/10 px-4 py-3 text-center">
                        <p className="text-xs text-[var(--muted-foreground)]">Total Value</p>
                        <p className="text-lg font-bold tabular-nums mt-0.5">{formatCurrency(summary?.totalValue ?? 0)}</p>
                      </div>
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/10 px-4 py-3 text-center">
                        <p className="text-xs text-[var(--muted-foreground)]">Avg Item Value</p>
                        <p className="text-lg font-bold tabular-nums mt-0.5">
                          {formatCurrency(items.length > 0 ? (summary?.totalValue ?? 0) / items.length : 0)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/10 px-4 py-3 text-center">
                        <p className="text-xs text-[var(--muted-foreground)]">Total Items</p>
                        <p className="text-lg font-bold tabular-nums mt-0.5">{summary?.totalItems ?? 0}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {[...items]
                        .sort((a, b) => (Number(b.currentQuantity) * Number(b.costPerUnit)) - (Number(a.currentQuantity) * Number(a.costPerUnit)))
                        .slice(0, 20)
                        .map((row) => {
                          const val = Number(row.currentQuantity) * Number(row.costPerUnit);
                          const pct = (summary?.totalValue ?? 0) > 0 ? (val / (summary?.totalValue ?? 1)) * 100 : 0;
                          return (
                            <div key={row.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-3 py-2">
                              <Badge variant="outline" className="text-[10px] shrink-0">{row.type}</Badge>
                              <span className="text-sm font-medium flex-1 truncate">{row.name}</span>
                              <span className="text-xs text-[var(--muted-foreground)] tabular-nums shrink-0">{Number(row.currentQuantity)} {row.unit}</span>
                              <div className="w-24 h-1.5 rounded-full bg-[var(--muted)] overflow-hidden shrink-0 hidden sm:block">
                                <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-sm font-bold tabular-nums shrink-0 w-24 text-right">{formatCurrency(val)}</span>
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
                <p className="text-xs text-[var(--muted-foreground)]">Classify items by value — A (top 80%), B (next 15%), C (bottom 5%)</p>
              </div>
              <div className="p-4 space-y-4">
                {abcAnalysis.length === 0 ? (
                  <EmptyState title="No data" description="Add inventory items to see ABC analysis." icon={<Layers className="h-6 w-6" />} />
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      {(["A", "B", "C"] as const).map((cls) => {
                        const clsItems = abcAnalysis.filter((a) => a.abcClass === cls);
                        const val = clsItems.reduce((s, i) => s + i.stockValue, 0);
                        return (
                          <div key={cls} className="rounded-xl border border-[var(--border)] p-4 text-center">
                            <Badge className={cn("text-sm font-bold mb-2",
                              cls === "A" ? "bg-emerald-100 text-emerald-700" :
                              cls === "B" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                            )}>{cls}</Badge>
                            <p className="text-2xl font-bold">{clsItems.length}</p>
                            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">items · {formatCurrency(val)}</p>
                          </div>
                        );
                      })}
                    </div>
                    <div className="space-y-1.5">
                      {abcAnalysis.map((row) => (
                        <div key={row.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-3 py-2">
                          <Badge className={cn("text-[10px] shrink-0",
                            row.abcClass === "A" ? "bg-emerald-100 text-emerald-700" :
                            row.abcClass === "B" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                          )}>{row.abcClass}</Badge>
                          <span className="text-sm font-medium flex-1 truncate">{row.name}</span>
                          <span className="text-xs text-[var(--muted-foreground)] tabular-nums shrink-0">{row.valuePct.toFixed(1)}%</span>
                          <span className="text-sm font-bold tabular-nums shrink-0 w-24 text-right">{formatCurrency(row.stockValue)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <FormDrawer open={showAddItem} onOpenChange={setShowAddItem} title="Add Inventory Item">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} className="mt-1" placeholder="e.g. Chicken Patty" />
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <select value={newItem.type} onChange={(e) => setNewItem({ ...newItem, type: e.target.value as InventoryItemType })}
                className="w-full mt-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
                {INVENTORY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Unit</label>
              <select value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value as InventoryItemUnit })}
                className="w-full mt-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            {newItem.type === "PRODUCT" && (
              <div>
                <label className="text-sm font-medium">Linked Product</label>
                <select value={newItem.productId} onChange={(e) => setNewItem({ ...newItem, productId: e.target.value })}
                  className="w-full mt-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
                  <option value="">Select product...</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Initial Qty</label>
                <Input type="number" min={0} value={newItem.currentQuantity} onChange={(e) => setNewItem({ ...newItem, currentQuantity: Number(e.target.value) })} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Min Qty</label>
                <Input type="number" min={0} value={newItem.minimumQuantity} onChange={(e) => setNewItem({ ...newItem, minimumQuantity: Number(e.target.value) })} className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Cost Per Unit</label>
              <Input type="number" min={0} step={0.01} value={newItem.costPerUnit} onChange={(e) => setNewItem({ ...newItem, costPerUnit: Number(e.target.value) })} className="mt-1" />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={newItem.trackInventory} onChange={(e) => setNewItem({ ...newItem, trackInventory: e.target.checked })} className="rounded" />
                Track Inventory
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={newItem.trackExpiry} onChange={(e) => setNewItem({ ...newItem, trackExpiry: e.target.checked })} className="rounded" />
                Track Expiry
              </label>
            </div>
            <Button onClick={handleCreateItem} disabled={!newItem.name} className="w-full">Add Item</Button>
          </div>
        </FormDrawer>

        <Modal open={!!adjustItem} onOpenChange={(o) => !o && setAdjustItem(null)}>
          <ModalContent>
            <ModalHeader><ModalTitle>Stock Adjustment</ModalTitle></ModalHeader>
            <p className="text-sm text-[var(--muted-foreground)] -mt-2 mb-4">{adjustItem?.name}</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <Button type="button" variant={adjForm.type === "add" ? "default" : "outline"} className="gap-2" onClick={() => setAdjForm({ ...adjForm, type: "add" })}>
                    <PackagePlus className="h-4 w-4" />Add Stock
                  </Button>
                  <Button type="button" variant={adjForm.type === "remove" ? "default" : "outline"} className="gap-2" onClick={() => setAdjForm({ ...adjForm, type: "remove" })}>
                    <PackageMinus className="h-4 w-4" />Remove Stock
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Quantity</label>
                <Input type="number" min={0.001} step={0.001} value={adjForm.quantity} onChange={(e) => setAdjForm({ ...adjForm, quantity: e.target.value })} className="mt-1" placeholder="Enter quantity" />
              </div>
              <div>
                <label className="text-sm font-medium">Reason</label>
                <Input value={adjForm.reason} onChange={(e) => setAdjForm({ ...adjForm, reason: e.target.value })} placeholder="e.g. Counted stock, Vendor delivery" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Notes (optional)</label>
                <Input value={adjForm.notes} onChange={(e) => setAdjForm({ ...adjForm, notes: e.target.value })} placeholder="Additional details..." className="mt-1" />
              </div>
            </div>
            <ModalFooter>
              <ModalClose asChild><Button variant="outline">Cancel</Button></ModalClose>
              <Button onClick={handleAdjustStock} disabled={!adjForm.quantity || !adjForm.reason || adjusting} className="gap-2">
                {adjusting ? "Applying..." : "Apply Adjustment"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal open={!!wasteItem} onOpenChange={(o) => !o && setWasteItem(null)}>
          <ModalContent>
            <ModalHeader><ModalTitle>Record Waste</ModalTitle></ModalHeader>
            <p className="text-sm text-[var(--muted-foreground)] -mt-2 mb-4">
              {wasteItem?.name} — Available: {Number(wasteItem?.currentQuantity ?? 0)} {wasteItem?.unit}
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Quantity</label>
                <Input type="number" min={0.001} step={0.001} value={wasteForm.quantity}
                  onChange={(e) => setWasteForm({ ...wasteForm, quantity: e.target.value })} className="mt-1" placeholder="Qty wasted" />
              </div>
              <div>
                <label className="text-sm font-medium">Reason</label>
                <select value={wasteForm.reason} onChange={(e) => setWasteForm({ ...wasteForm, reason: e.target.value })}
                  className="w-full mt-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
                  <option value="DAMAGED">Damaged</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="SPILLED">Spilled</option>
                  <option value="BURNED">Burned</option>
                  <option value="SPOILED">Spoiled</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Notes (optional)</label>
                <Input value={wasteForm.notes} onChange={(e) => setWasteForm({ ...wasteForm, notes: e.target.value })} placeholder="Additional details..." className="mt-1" />
              </div>
            </div>
            <ModalFooter>
              <ModalClose asChild><Button variant="outline">Cancel</Button></ModalClose>
              <Button variant="destructive" onClick={handleRecordWaste} disabled={!wasteForm.quantity || wasting} className="gap-2">
                {wasting ? "Recording..." : "Record Waste"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <ItemHistoryModal item={historyItem} onClose={() => setHistoryItem(null)} />

        <FormDrawer open={showAddRecipe} onOpenChange={setShowAddRecipe} title="Create Recipe">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Product</label>
              <select value={recipeForm.productId} onChange={(e) => {
                const prod = products.find((p) => p.id === e.target.value);
                setRecipeForm({ ...recipeForm, productId: e.target.value, name: prod?.name ?? "" });
              }} className="w-full mt-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
                <option value="">Select product...</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Recipe Name</label>
              <Input value={recipeForm.name} onChange={(e) => setRecipeForm({ ...recipeForm, name: e.target.value })} className="mt-1" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Ingredients</label>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                  onClick={() => setRecipeForm({ ...recipeForm, ingredients: [...recipeForm.ingredients, { inventoryItemId: "", quantity: 1, unit: "PCS" }] })}>
                  <Plus className="h-3 w-3" />Add
                </Button>
              </div>
              <div className="space-y-2">
                {recipeForm.ingredients.map((ing, idx) => (
                  <div key={idx} className="flex gap-2 items-end">
                    <select value={ing.inventoryItemId} onChange={(e) => {
                      const updated = [...recipeForm.ingredients];
                      updated[idx] = { ...updated[idx], inventoryItemId: e.target.value };
                      setRecipeForm({ ...recipeForm, ingredients: updated });
                    }} className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm">
                      <option value="">Select item...</option>
                      {items.filter((i) => i.type === "INGREDIENT" || i.type === "PACKAGING").map((i) => (
                        <option key={i.id} value={i.id}>{i.name}</option>
                      ))}
                    </select>
                    <Input type="number" min={0.001} step={0.001} value={ing.quantity}
                      onChange={(e) => {
                        const updated = [...recipeForm.ingredients];
                        updated[idx] = { ...updated[idx], quantity: Number(e.target.value) };
                        setRecipeForm({ ...recipeForm, ingredients: updated });
                      }} className="w-20" />
                    <select value={ing.unit} onChange={(e) => {
                      const updated = [...recipeForm.ingredients];
                      updated[idx] = { ...updated[idx], unit: e.target.value };
                      setRecipeForm({ ...recipeForm, ingredients: updated });
                    }} className="w-20 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm">
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <Button size="sm" variant="ghost" className="h-8 text-red-500"
                      onClick={() => setRecipeForm({ ...recipeForm, ingredients: recipeForm.ingredients.filter((_, i) => i !== idx) })}>
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={handleCreateRecipe} disabled={!recipeForm.productId || !recipeForm.name || recipeForm.ingredients.length === 0} className="w-full">
              Create Recipe
            </Button>
          </div>
        </FormDrawer>

        <FormDrawer open={showAddPO} onOpenChange={setShowAddPO} title="New Purchase Order">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Supplier</label>
              <select value={poForm.supplierId} onChange={(e) => setPOForm({ ...poForm, supplierId: e.target.value })}
                className="w-full mt-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
                <option value="">Select supplier...</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Expected Date</label>
              <Input type="date" value={poForm.expectedDate} onChange={(e) => setPOForm({ ...poForm, expectedDate: e.target.value })} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Input value={poForm.notes} onChange={(e) => setPOForm({ ...poForm, notes: e.target.value })} className="mt-1" placeholder="Optional notes..." />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Items</label>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                  onClick={() => setPOForm({ ...poForm, items: [...poForm.items, { inventoryItemId: "", orderedQuantity: 1, unitCost: 0 }] })}>
                  <Plus className="h-3 w-3" />Add
                </Button>
              </div>
              <div className="space-y-2">
                {poForm.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-end">
                    <select value={item.inventoryItemId} onChange={(e) => {
                      const updated = [...poForm.items];
                      updated[idx] = { ...updated[idx], inventoryItemId: e.target.value };
                      setPOForm({ ...poForm, items: updated });
                    }} className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm">
                      <option value="">Select item...</option>
                      {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                    <Input type="number" min={0.001} step={0.001} value={item.orderedQuantity}
                      onChange={(e) => {
                        const updated = [...poForm.items];
                        updated[idx] = { ...updated[idx], orderedQuantity: Number(e.target.value) };
                        setPOForm({ ...poForm, items: updated });
                      }} className="w-20" placeholder="Qty" />
                    <Input type="number" min={0} step={0.01} value={item.unitCost}
                      onChange={(e) => {
                        const updated = [...poForm.items];
                        updated[idx] = { ...updated[idx], unitCost: Number(e.target.value) };
                        setPOForm({ ...poForm, items: updated });
                      }} className="w-20" placeholder="Cost" />
                    <Button size="sm" variant="ghost" className="h-8 text-red-500"
                      onClick={() => setPOForm({ ...poForm, items: poForm.items.filter((_, i) => i !== idx) })}>
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={handleCreatePO} disabled={poForm.items.length === 0} className="w-full">Create Purchase Order</Button>
          </div>
        </FormDrawer>

        <ConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(o) => !o && setDeleteTarget(null)}
          title="Delete Inventory Item"
          description={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={() => { if (deleteTarget) deleteItem(deleteTarget.id); setDeleteTarget(null); }}
        />
      </PageMotion>
    </RoleGuard>
  );
}

function ItemHistoryModal({ item, onClose }: { item: NewInventoryItem | null; onClose: () => void }) {
  const [page, setPage] = useState(1);
  const { data: historyResponse } = useGetItemHistoryQuery(
    { itemId: item?.id ?? "", page, limit: 15 },
    { skip: !item }
  );
  const movements = historyResponse?.data ?? [];
  const totalPages = historyResponse?.totalPages ?? 1;

  if (!item) return null;

  return (
    <Modal open={!!item} onOpenChange={(o) => !o && onClose()}>
      <ModalContent className="max-w-lg">
        <ModalHeader><ModalTitle>Stock History — {item.name}</ModalTitle></ModalHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          {movements.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-8">No history yet</p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {movements.map((m) => (
                <div key={m.id} className="flex items-center gap-3 py-2.5 px-1">
                  <div className={cn("flex items-center justify-center h-7 w-7 rounded-md shrink-0", MOVEMENT_COLORS[m.type] ?? "text-slate-600 bg-slate-100")}>
                    {Number(m.quantity) >= 0 ? <PackagePlus className="h-3 w-3" /> : <PackageMinus className="h-3 w-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{m.type.replace(/_/g, " ")}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)] truncate">{m.reason ?? "—"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn("text-sm font-bold tabular-nums", Number(m.quantity) >= 0 ? "text-emerald-600" : "text-red-600")}>
                      {Number(m.quantity) >= 0 ? "+" : ""}{Number(m.quantity)}
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">
                      {Number(m.previousQuantity)} → {Number(m.newQuantity)}
                    </p>
                  </div>
                  <span className="text-[10px] text-[var(--muted-foreground)] shrink-0">
                    {new Date(m.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2 border-t border-[var(--border)]">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
            <span className="text-xs text-[var(--muted-foreground)]">{page}/{totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        )}
        <ModalFooter>
          <ModalClose asChild><Button variant="outline">Close</Button></ModalClose>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
