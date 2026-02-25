"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { MOCK_CATEGORIES } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export function ProductsView() {
  const categoryName = (id: string) => MOCK_CATEGORIES.find((c) => c.id === id)?.name ?? id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold">Products</h1>
        <p className="text-[var(--muted-foreground)]">Menu and pricing</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_PRODUCTS.map((product) => (
          <Card key={product.id}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <CardTitle className="text-base">{product.name}</CardTitle>
              <Badge variant="secondary">{categoryName(product.categoryId)}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold text-[var(--accent)]">
                {formatCurrency(product.price)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
