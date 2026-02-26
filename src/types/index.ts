export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface AddToCartPayload {
  productId: string;
  name: string;
  price: number;
  image?: string;
  quantity?: number;
}

/** Redux cart slice state */
export interface CartState {
  items: CartItem[];
  totalQuantity: number;
  discount: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  image?: string;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  status: "pending" | "completed" | "cancelled";
  createdAt: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  email: string;
  status: "active" | "inactive";
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export type { SubmitOrderRequest, SubmitOrderResponse } from "./api";
