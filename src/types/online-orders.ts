export type OrderSource = "website" | "foodpanda" | "ubereats";

export type OnlineOrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "rejected";

export type PaymentStatus = "pending" | "paid" | "refunded";

export type DeliveryType = "delivery" | "pickup";

export interface OnlineOrderItem {
  name: string;
  quantity: number;
  price: number;
  modifiers?: string[];
}

export interface OrderTimelineEntry {
  status: OnlineOrderStatus;
  at: string;
  label: string;
}

export interface OnlineOrder {
  id: string;
  orderId: string;
  source: OrderSource;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  items: OnlineOrderItem[];
  itemsCount: number;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  paymentStatus: PaymentStatus;
  deliveryType: DeliveryType;
  status: OnlineOrderStatus;
  createdAt: string;
  timeline: OrderTimelineEntry[];
  riderId?: string;
}
