"use client";

import { useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/admin/PageHeader";
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
} from "@/redux/api/products";
import type { AdminProduct } from "@/types/admin";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type ProductFormValues = {
  name: string;
  categoryId: string;
  price: string;
  cost: string;
  sku: string;
  barcode: string;
  status: "active" | "inactive";
};

export function ProductsView() {
  const { data: products = [], isLoading } = useGetProductsQuery();
  const { data: categories = [] } = useGetCategoriesQuery();
  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;
  const form = useForm<ProductFormValues>({
    defaultValues: {
      name: "",
      categoryId: categories[0]?.id ?? "",
      price: "",
      cost: "",
      sku: "",
      barcode: "",
      status: "active",
    },
  });
  const openEdit = useCallback(
    (row: AdminProduct) => {
      setEditing(row);
      form.reset({
        name: row.name,
        categoryId: row.categoryId,
        price: String(row.price),
        cost: String(row.cost),
        sku: row.sku,
        barcode: row.barcode,
        status: row.status,
      });
      setDrawerOpen(true);
    },
    [categories, form]
  );

  const columns: DataTableColumn<AdminProduct>[] = useMemo(
    () => [
      { id: "name", header: "Name", accessor: "name", sortable: true },
      {
        id: "category",
        header: "Category",
        accessor: (row) => categoryName(row.categoryId),
        sortable: true,
      },
      { id: "price", header: "Price", accessor: (row) => formatCurrency(row.price), sortable: true },
      { id: "sku", header: "SKU", accessor: "sku" },
      {
        id: "status",
        header: "Status",
        accessor: (row) => (
          <Badge variant={row.status === "active" ? "default" : "secondary"}>{row.status}</Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        accessor: (row) => (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>Edit</Button>
            <Button size="sm" variant="ghost" className="text-[var(--destructive)]" onClick={() => setDeleteTarget(row)}>Delete</Button>
          </div>
        ),
      },
    ],
    [categories, openEdit]
  );

 

  const openCreate = useCallback(() => {
    setEditing(null);
    form.reset({
      name: "",
      categoryId: categories[0]?.id ?? "",
      price: "",
      cost: "",
      sku: "",
      barcode: "",
      status: "active",
    });
    setDrawerOpen(true);
  }, [categories, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      name: values.name,
      categoryId: values.categoryId,
      price: Number(values.price),
      cost: Number(values.cost),
      sku: values.sku,
      barcode: values.barcode,
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
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <PageHeader
          title="Products"
          description="Manage menu and pricing"
          children={
            <Button onClick={openCreate}>Add product</Button>
          }
        />

        {isLoading ? (
          <div className="h-64 rounded-lg border border-[var(--border)] animate-pulse bg-[var(--muted)]/30" />
        ) : products.length === 0 ? (
          <EmptyState
            title="No products"
            description="Add your first product to get started."
            action={<Button onClick={openCreate}>Add product</Button>}
          />
        ) : (
          <DataTable
            columns={columns}
            data={products}
            searchPlaceholder="Search products..."
            searchKeys={["name", "sku"]}
            keyExtractor={(row) => row.id}
            emptyMessage="No products found"
            onRowClick={openEdit}
            mobileCardView={(row) => (
              <Card onClick={() => openEdit(row)} className="cursor-pointer">
                <CardContent className="p-4">
                  <p className="font-medium">{row.name}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">{categoryName(row.categoryId)}</p>
                  <p className="text-[var(--accent)] font-semibold">{formatCurrency(row.price)}</p>
                </CardContent>
              </Card>
            )}
          />
        )}

        <FormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={editing ? "Edit product" : "New product"}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input {...form.register("name", { required: true })} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                {...form.register("categoryId", { required: true })}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Price</label>
                <Input type="number" step="0.01" {...form.register("price", { required: true })} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Cost</label>
                <Input type="number" step="0.01" {...form.register("cost", { required: true })} className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">SKU</label>
              <Input {...form.register("sku")} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Barcode</label>
              <Input {...form.register("barcode")} className="mt-1" />
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
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">{editing ? "Save" : "Create"}</Button>
              <Button type="button" variant="outline" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            </div>
          </form>
        </FormDrawer>

        <ConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="Delete product?"
          description="This cannot be undone."
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={handleDelete}
        />
      </motion.div>
    </RoleGuard>
  );
}
