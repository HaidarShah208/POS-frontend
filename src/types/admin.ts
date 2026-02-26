/** Admin product (full CRUD fields) */
export interface AdminProduct {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  cost: number;
  sku: string;
  barcode: string;
  image?: string;
  description?: string;
  status: "active" | "inactive";
  modifiers: ProductModifier[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductModifier {
  id: string;
  name: string;
  price: number;
}

/** Admin category */
export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}

/** Inventory item with stock */
export interface InventoryItem {
  productId: string;
  productName: string;
  categoryId: string;
  currentStock: number;
  cost: number;
  stockValue: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
  lowStockThreshold: number;
}

/** Stock adjustment record */
export interface StockAdjustment {
  id: string;
  productId: string;
  type: "add" | "remove";
  quantity: number;
  reason: string;
  date: string;
  createdAt: string;
}

/** Report aggregates */
export interface ReportSummary {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  totalProfit: number;
}

export interface SalesByDay {
  date: string;
  sales: number;
  orders: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface OrderTypeDistribution {
  type: string;
  count: number;
  percentage: number;
}

/** User role for RBAC */
export type UserRole = "admin" | "cashier" | "kitchen";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}
