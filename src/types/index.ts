/** Modifier/addon for a cart item */
export interface CartItemModifier {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  note?: string;
  modifiers?: CartItemModifier[];
}

export interface AddToCartPayload {
  productId: string;
  name: string;
  price: number;
  image?: string;
  quantity?: number;
  note?: string;
  modifiers?: CartItemModifier[];
}

/** Order type for checkout */
export type OrderType = "dine-in" | "takeaway" | "delivery";

/** Payment method for checkout */
export type PaymentMethod = "cash" | "card" | "mobile" | "other";

/** Discount application */
export type DiscountType = "fixed" | "percent";

/** Redux cart slice state */
export interface CartState {
  items: CartItem[];
  totalQuantity: number;
  discount: number;
  discountType: DiscountType;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
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
