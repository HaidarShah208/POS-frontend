"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageMotion } from "@/components/shared/PageMotion";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatsCard } from "@/components/admin/StatsCard";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { FormDrawer } from "@/components/admin/FormDrawer";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { EmptyState } from "@/components/admin/EmptyState";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  useGetProductsQuery,
  useGetCategoriesQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from "@/redux/api/productsEndpoints";
import type { AdminProduct } from "@/types/admin";
import type { Product as ApiProduct } from "@/types/api/index";
import { cn, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Package,
  CheckCircle2,
  FolderOpen,
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  ImageIcon,
} from "lucide-react";

type ProductFormValues = {
  name: string;
  description: string;
  categoryId: string;
  price: string;
  cost: string;
  sku: string;
  barcode: string;
  image: string;
  status: "active" | "inactive";
};

export function ProductsView() {
  const { data: productsResponse, isLoading } = useGetProductsQuery();
  const apiProducts = (productsResponse?.data ?? []) as ApiProduct[];
  const { data: categories = [], isLoading: categoriesLoading } = useGetCategoriesQuery();
  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;
  const form = useForm<ProductFormValues>({
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      price: "",
      cost: "",
      sku: "",
      barcode: "",
      image: "",
      status: "active",
    },
  });

  useEffect(() => {
    const firstId = categories[0]?.id;
    if (!firstId || editing) return;
    const current = form.getValues("categoryId");
    if (!current || !categories.some((c) => c.id === current)) {
      form.setValue("categoryId", firstId);
    }
  }, [categories, editing, form]);

  const openEdit = useCallback(
    (row: AdminProduct) => {
      setEditing(row);
      form.reset({
        name: row.name,
        description: row.description ?? "",
        categoryId: row.categoryId,
        price: String(row.price),
        cost: String(row.cost),
        sku: row.sku,
        barcode: row.barcode,
        image: row.image ?? "",
        status: row.status,
      });
      setDrawerOpen(true);
    },
    [categories, form]
  );

  const products: AdminProduct[] = useMemo(
    () =>
      apiProducts.map((p) => ({
        id: p.id,
        name: p.name,
        categoryId: p.categoryId,
        price: p.price,
        cost: p.cost ?? 0,
        sku: p.sku ?? "",
        barcode: p.barcode ?? "",
        image: p.image ?? undefined,
        description: p.description ?? undefined,
        status: (p.status as AdminProduct["status"]) ?? "active",
        modifiers: p.modifiers ?? [],
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    [apiProducts]
  );

  const filteredProducts = useMemo(
    () =>
      filterCategoryId
        ? products.filter((p) => p.categoryId === filterCategoryId)
        : products,
    [products, filterCategoryId]
  );

  const stats = useMemo(() => {
    const active = products.filter((p) => p.status === "active").length;
    const totalPrice = products.reduce((s, p) => s + p.price, 0);
    const avgPrice = products.length > 0 ? totalPrice / products.length : 0;
    return { total: products.length, active, avgPrice };
  }, [products]);

  const columns: DataTableColumn<AdminProduct>[] = useMemo(
    () => [
      {
        id: "product",
        header: "Product",
        accessor: (row) => (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[var(--muted)] shrink-0 overflow-hidden flex items-center justify-center">
              {row.image ? (
                <img src={row.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <Package className="h-4 w-4 text-[var(--muted-foreground)]" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{row.name}</p>
              {row.sku && (
                <p className="text-[11px] text-[var(--muted-foreground)]">SKU: {row.sku}</p>
              )}
            </div>
          </div>
        ),
        sortable: true,
      },
      {
        id: "category",
        header: "Category",
        accessor: (row) => (
          <Badge variant="secondary" className="font-normal">
            {categoryName(row.categoryId)}
          </Badge>
        ),
        sortable: true,
      },
      {
        id: "price",
        header: "Price",
        accessor: (row) => (
          <span className="font-medium tabular-nums">{formatCurrency(row.price)}</span>
        ),
        sortable: true,
      },
      {
        id: "margin",
        header: "Margin",
        accessor: (row) => {
          const margin = row.price - row.cost;
          const pct = row.price > 0 ? (margin / row.price) * 100 : 0;
          return (
            <div className="tabular-nums">
              <span className={cn("text-sm font-medium", margin >= 0 ? "text-emerald-600" : "text-red-500")}>
                {formatCurrency(margin)}
              </span>
              <span className="text-[11px] text-[var(--muted-foreground)] ml-1">
                ({pct.toFixed(0)}%)
              </span>
            </div>
          );
        },
        sortable: true,
      },
      {
        id: "status",
        header: "Status",
        accessor: (row) => (
          <Badge variant={row.status === "active" ? "success" : "secondary"}>
            {row.status}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        accessor: (row) => (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(row)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-[var(--destructive)]"
              onClick={() => setDeleteTarget(row)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
        className: "w-20",
      },
    ],
    [categories, openEdit]
  );

  const openCreate = useCallback(() => {
    setEditing(null);
    form.reset({
      name: "",
      description: "",
      categoryId: categories[0]?.id ?? "",
      price: "",
      cost: "",
      sku: "",
      barcode: "",
      image: "",
      status: "active",
    });
    setDrawerOpen(true);
  }, [categories, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      name: values.name,
      description: values.description || undefined,
      categoryId: values.categoryId,
      price: Number(values.price),
      cost: Number(values.cost),
      sku: values.sku,
      barcode: values.barcode,
      image: values.image || undefined,
      status: values.status,
      modifiers: editing?.modifiers ?? [],
    };
    if (editing) {
      await updateProduct({ ...editing, ...payload });
    } else {
      await createProduct(payload);
    }
    setDrawerOpen(false);
  });

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <RoleGuard permission="products">
      <PageMotion>
        <PageHeader
          title="Products"
          description="Manage menu items and pricing"
        >
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </PageHeader>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Products"
            value={isLoading ? "—" : stats.total}
            animate={!isLoading}
            icon={<Package className="h-5 w-5" />}
          />
          <StatsCard
            title="Active"
            value={isLoading ? "—" : stats.active}
            animate={!isLoading}
            icon={<CheckCircle2 className="h-5 w-5" />}
            subtitle={`${stats.total - stats.active} inactive`}
          />
          <StatsCard
            title="Categories"
            value={categoriesLoading ? "—" : categories.length}
            animate={!categoriesLoading}
            icon={<FolderOpen className="h-5 w-5" />}
          />
          <StatsCard
            title="Avg Price"
            value={isLoading ? "—" : formatCurrency(stats.avgPrice)}
            icon={<DollarSign className="h-5 w-5" />}
          />
        </div>

        {!isLoading && categories.length > 0 && products.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scroll-area-thin">
            <Button
              variant={filterCategoryId === null ? "default" : "outline"}
              size="sm"
              className="shrink-0"
              onClick={() => setFilterCategoryId(null)}
            >
              All ({products.length})
            </Button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.categoryId === cat.id).length;
              return (
                <Button
                  key={cat.id}
                  variant={filterCategoryId === cat.id ? "default" : "outline"}
                  size="sm"
                  className="shrink-0"
                  onClick={() => setFilterCategoryId(cat.id)}
                >
                  {cat.name} ({count})
                </Button>
              );
            })}
          </div>
        )}

        {isLoading ? (
          <div className="h-64 rounded-lg border border-[var(--border)] animate-pulse bg-[var(--muted)]/30" />
        ) : products.length === 0 ? (
          <EmptyState
            title="No products yet"
            description="Add your first menu item to get started."
            icon={<Package className="h-6 w-6" />}
            action={
              <Button onClick={openCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            }
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredProducts}
            searchPlaceholder="Search products..."
            searchKeys={["name", "sku"]}
            keyExtractor={(row) => row.id}
            emptyMessage="No products found"
            onRowClick={openEdit}
            mobileCardView={(row) => {
              const margin = row.price - row.cost;
              return (
                <Card onClick={() => openEdit(row)} className="cursor-pointer hover:shadow-[var(--shadow-sm)] transition-shadow">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="h-12 w-12 rounded-lg bg-[var(--muted)] shrink-0 overflow-hidden flex items-center justify-center">
                      {row.image ? (
                        <img src={row.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-5 w-5 text-[var(--muted-foreground)]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{row.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {categoryName(row.categoryId)}
                        {row.sku && <span className="ml-2">SKU: {row.sku}</span>}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-semibold">{formatCurrency(row.price)}</span>
                        <span className={cn("text-[11px]", margin >= 0 ? "text-emerald-600" : "text-red-500")}>
                          {margin >= 0 ? "+" : ""}{formatCurrency(margin)}
                        </span>
                        <Badge
                          variant={row.status === "active" ? "success" : "secondary"}
                          className="text-[10px] px-1.5 py-0 h-4 ml-auto"
                        >
                          {row.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }}
          />
        )}

        <FormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={editing ? "Edit Product" : "New Product"}>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Basic Info
              </p>
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input {...form.register("name", { required: true })} className="mt-1" placeholder="e.g. Margherita Pizza" />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  {...form.register("description")}
                  rows={3}
                  placeholder="Short description (optional)"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <select
                  {...form.register("categoryId", { required: true })}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
                  disabled={categoriesLoading}
                >
                  <option value="">
                    {categoriesLoading ? "Loading…" : categories.length === 0 ? "No categories yet" : "Select category"}
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Pricing
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Price</label>
                  <Input type="number" step="0.01" {...form.register("price", { required: true })} className="mt-1" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-sm font-medium">Cost</label>
                  <Input type="number" step="0.01" {...form.register("cost", { required: true })} className="mt-1" placeholder="0.00" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Identification
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">SKU</label>
                  <Input {...form.register("sku")} className="mt-1" placeholder="Optional" />
                </div>
                <div>
                  <label className="text-sm font-medium">Barcode</label>
                  <Input {...form.register("barcode")} className="mt-1" placeholder="Optional" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Media & Status
              </p>
              <div>
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Image URL
                </label>
                <Input {...form.register("image")} className="mt-1" placeholder="https://..." />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  {...form.register("status")}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
              <Button type="submit" className="flex-1">{editing ? "Save Changes" : "Create Product"}</Button>
              <Button type="button" variant="outline" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            </div>
          </form>
        </FormDrawer>

        <ConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="Delete product?"
          description={`"${deleteTarget?.name}" will be permanently removed. This cannot be undone.`}
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={handleDelete}
        />
      </PageMotion>
    </RoleGuard>
  );
}
