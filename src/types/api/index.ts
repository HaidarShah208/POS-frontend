/**
 * API types — align with backend DTOs and responses.
 */

export type UserRole = "admin" | "cashier" | "kitchen";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  branchId?: string;
}

export interface Branch {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductModifier {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  cost?: number | null;
  sku?: string | null;
  barcode?: string | null;
  image?: string | null;
  description?: string | null;
  status?: string;
  modifiers?: ProductModifier[] | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  branchId: string;
  currentStock: number;
  lowStockThreshold: number;
  product?: Product;
  /** Optional computed/joined fields from API */
  productName?: string;
  cost?: number;
  stockValue?: number;
  status?: "in_stock" | "low_stock" | "out_of_stock";
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string | null;
  name: string;
  price: number;
  quantity: number;
  note?: string | null;
  modifiers?: ProductModifier[] | null;
}

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export type OrderType = "dine-in" | "takeaway" | "delivery";
export type PaymentMethod = "cash" | "card" | "mobile" | "other";

export interface Order {
  id: string;
  branchId: string;
  userId?: string | null;
  orderNumber: string;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  status: OrderStatus;
  tokenNumber: string;
  kitchenStatus?: string;
  createdAt: string;
  updatedAt?: string;
  items?: OrderItem[];
  branch?: Branch;
  user?: User | null;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Place order request (matches cart + totals) */
export interface PlaceOrderRequest {
  items: { id: string; productId: string; name: string; price: number; quantity: number; note?: string; modifiers?: ProductModifier[] }[];
  subtotal?: number;
  tax?: number;
  discount?: number;
  grandTotal?: number;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
}

/** Place order response */
export interface PlaceOrderResponse {
  orderId: string;
  tokenNumber: string;
}

/** Kitchen order status */
export type KitchenOrderStatus = "NEW" | "PREPARING" | "READY";

/** Inventory adjust request */
export interface AdjustStockRequest {
  productId: string;
  branchId: string;
  type: "add" | "remove";
  quantity: number;
  reason: string;
}

/** Products list query params */
export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  lowStockOnly?: boolean;
}

/** Orders list query params */
export interface GetOrdersParams {
  page?: number;
  limit?: number;
  branchId?: string;
  status?: OrderStatus;
  dateFrom?: string;
  dateTo?: string;
}

/** Inventory list query params */
export interface GetInventoryParams {
  page?: number;
  limit?: number;
  lowStockOnly?: boolean;
}
