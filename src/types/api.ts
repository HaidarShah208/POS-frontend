/**
 * API request/response interfaces. Define here first, then use in redux/api and elsewhere.
 */

import type { CartItem, OrderType, PaymentMethod } from "./index";

/** Request body for submitting / placing an order */
export interface SubmitOrderRequest {
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
}

/** Response from place order endpoint */
export interface PlaceOrderResponse {
  orderId: string;
  token: string;
}

/** Legacy alias */
export type SubmitOrderResponse = PlaceOrderResponse;

/** Kitchen order status */
export type KitchenOrderStatus = "NEW" | "PREPARING" | "READY";

/** Order as sent to kitchen (KDS) */
export interface KitchenOrderItem {
  name: string;
  quantity: number;
  note?: string;
  modifiers?: string[];
}

export interface KitchenOrder {
  id: string;
  token: string;
  items: KitchenOrderItem[];
  orderType: OrderType;
  status: KitchenOrderStatus;
  createdAt: string;
  updatedAt?: string;
}
