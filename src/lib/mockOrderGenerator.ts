import type { CartItem, OrderType } from "@/types";
import type { KitchenOrder, KitchenOrderItem } from "@/types/api";

let tokenCounter = 1;
let orderIdCounter = 1;

/**
 * Generate a unique token number (e.g. "A12") for display.
 */
export function generateToken(): string {
  const n = tokenCounter++;
  const letter = String.fromCharCode(65 + ((n - 1) % 26));
  const num = Math.floor((n - 1) / 26) + 1;
  return `${letter}${num}`;
}

/**
 * Generate order ID for internal use.
 */
export function generateOrderId(): string {
  return `ord-${Date.now()}-${orderIdCounter++}`;
}

/**
 * Build a KitchenOrder from cart items and order type (for sending to KDS).
 */
export function buildKitchenOrderFromCart(
  items: CartItem[],
  orderType: OrderType,
  token: string,
  orderId: string
): KitchenOrder {
  const kitchenItems: KitchenOrderItem[] = items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    note: item.note,
    modifiers: item.modifiers?.map((m) => m.name),
  }));
  const now = new Date().toISOString();
  return {
    id: orderId,
    token,
    items: kitchenItems,
    orderType,
    status: "NEW",
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Mock place order: returns orderId and token; does not hit network.
 */
export function mockPlaceOrder(): { orderId: string; token: string } {
  const orderId = generateOrderId();
  const token = generateToken();
  return { orderId, token };
}
