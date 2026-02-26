import type { AdminProduct, AdminCategory, InventoryItem, StockAdjustment } from "@/types/admin";
import type { ProductModifier } from "@/types/admin";

export const MOCK_ADMIN_CATEGORIES: AdminCategory[] = [
  { id: "cat-1", name: "Burgers", slug: "burgers", sortOrder: 1 },
  { id: "cat-2", name: "Pizza", slug: "pizza", sortOrder: 2 },
  { id: "cat-3", name: "Drinks", slug: "drinks", sortOrder: 3 },
  { id: "cat-4", name: "Sides", slug: "sides", sortOrder: 4 },
  { id: "cat-5", name: "Desserts", slug: "desserts", sortOrder: 5 },
];

const defaultModifiers: ProductModifier[] = [
  { id: "mod-1", name: "Extra Cheese", price: 0.99 },
  { id: "mod-2", name: "Bacon", price: 1.49 },
];

export const MOCK_ADMIN_PRODUCTS: AdminProduct[] = [
  { id: "p1", name: "Classic Burger", categoryId: "cat-1", price: 8.99, cost: 3.5, sku: "BUR-001", barcode: "123456789001", status: "active", modifiers: defaultModifiers },
  { id: "p2", name: "Cheese Burger", categoryId: "cat-1", price: 9.49, cost: 4, sku: "BUR-002", barcode: "123456789002", status: "active", modifiers: defaultModifiers },
  { id: "p3", name: "Double Burger", categoryId: "cat-1", price: 11.99, cost: 5, sku: "BUR-003", barcode: "123456789003", status: "active", modifiers: [] },
  { id: "p4", name: "Margherita Pizza", categoryId: "cat-2", price: 12.99, cost: 5.5, sku: "PIZ-001", barcode: "123456789004", status: "active", modifiers: [] },
  { id: "p5", name: "Pepperoni Pizza", categoryId: "cat-2", price: 13.49, cost: 6, sku: "PIZ-002", barcode: "123456789005", status: "active", modifiers: [] },
  { id: "p6", name: "BBQ Chicken Pizza", categoryId: "cat-2", price: 14.99, cost: 6.5, sku: "PIZ-003", barcode: "123456789006", status: "active", modifiers: [] },
  { id: "p7", name: "Cola", categoryId: "cat-3", price: 2.49, cost: 0.5, sku: "DRK-001", barcode: "123456789007", status: "active", modifiers: [] },
  { id: "p8", name: "Lemonade", categoryId: "cat-3", price: 2.99, cost: 0.6, sku: "DRK-002", barcode: "123456789008", status: "active", modifiers: [] },
  { id: "p9", name: "Iced Coffee", categoryId: "cat-3", price: 3.49, cost: 1, sku: "DRK-003", barcode: "123456789009", status: "active", modifiers: [] },
  { id: "p10", name: "French Fries", categoryId: "cat-4", price: 3.99, cost: 1.2, sku: "SID-001", barcode: "123456789010", status: "active", modifiers: [] },
  { id: "p11", name: "Onion Rings", categoryId: "cat-4", price: 4.49, cost: 1.5, sku: "SID-002", barcode: "123456789011", status: "active", modifiers: [] },
  { id: "p12", name: "Chocolate Cake", categoryId: "cat-5", price: 5.99, cost: 2, sku: "DES-001", barcode: "123456789012", status: "active", modifiers: [] },
  { id: "p13", name: "Ice Cream", categoryId: "cat-5", price: 4.49, cost: 1.2, sku: "DES-002", barcode: "123456789013", status: "inactive", modifiers: [] },
];

const LOW_THRESHOLD = 10;
function stockStatus(stock: number): "in_stock" | "low_stock" | "out_of_stock" {
  if (stock <= 0) return "out_of_stock";
  if (stock <= LOW_THRESHOLD) return "low_stock";
  return "in_stock";
}

export function getMockInventory(): InventoryItem[] {
  const stockMap: Record<string, number> = {
    p1: 25, p2: 18, p3: 5, p4: 12, p5: 8, p6: 0, p7: 50, p8: 30, p9: 15,
    p10: 4, p11: 22, p12: 7, p13: 0,
  };
  return MOCK_ADMIN_PRODUCTS.map((p) => {
    const currentStock = stockMap[p.id] ?? 0;
    return {
      productId: p.id,
      productName: p.name,
      categoryId: p.categoryId,
      currentStock,
      cost: p.cost,
      stockValue: currentStock * p.cost,
      status: stockStatus(currentStock),
      lowStockThreshold: LOW_THRESHOLD,
    };
  });
}

export const MOCK_STOCK_ADJUSTMENTS: StockAdjustment[] = [
  { id: "adj-1", productId: "p1", type: "add", quantity: 20, reason: "Restock", date: "2025-02-24", createdAt: "2025-02-24T09:00:00Z" },
  { id: "adj-2", productId: "p3", type: "remove", quantity: 5, reason: "Waste", date: "2025-02-25", createdAt: "2025-02-25T14:00:00Z" },
];
