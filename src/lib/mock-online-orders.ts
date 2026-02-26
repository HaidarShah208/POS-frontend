import type { OnlineOrder, OrderSource, OrderTimelineEntry } from "@/types/online-orders";

let orderCounter = 1001;

export function generateMockOrder(source: OrderSource): OnlineOrder {
  const id = "oo-" + Date.now() + "-" + orderCounter;
  const orderId = "#" + orderCounter++;
  const now = new Date().toISOString();
  const items = [
    { name: "Classic Burger", quantity: 2, price: 8.99 },
    { name: "Cola", quantity: 2, price: 2.49 },
  ];
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * 0.08;
  const deliveryFee = 2;
  const total = subtotal + tax + deliveryFee;
  return {
    id,
    orderId,
    source,
    customerName: "Customer " + orderId,
    customerPhone: "+1234567890",
    customerAddress: "123 Main St",
    items,
    itemsCount: 4,
    subtotal,
    tax,
    deliveryFee,
    total,
    paymentStatus: "paid",
    deliveryType: "delivery",
    status: "pending",
    createdAt: now,
    timeline: [{ status: "pending", at: now, label: "Order placed" }],
  };
}

const STATUS_LABELS: Record<OnlineOrder["status"], string> = {
  pending: "Order placed",
  accepted: "Order accepted",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  rejected: "Rejected",
};

function buildOrder(
  id: string,
  orderId: string,
  source: OrderSource,
  customerName: string,
  status: OnlineOrder["status"]
): OnlineOrder {
  const now = new Date().toISOString();
  const items = [
    { name: "Classic Burger", quantity: 2, price: 8.99 },
    { name: "Cola", quantity: 2, price: 2.49 },
  ];
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const statusOrder: OnlineOrder["status"][] = ["pending", "accepted", "preparing", "out_for_delivery", "delivered", "rejected"];
  const idx = statusOrder.indexOf(status);
  const timeline: OrderTimelineEntry[] = statusOrder
    .slice(0, idx === -1 ? 1 : idx + 1)
    .map((s) => ({ status: s, at: now, label: STATUS_LABELS[s] }));
  return {
    id,
    orderId,
    source,
    customerName,
    customerPhone: "+1234567890",
    customerAddress: "123 Main St",
    items,
    itemsCount: 4,
    subtotal,
    tax: subtotal * 0.08,
    deliveryFee: 2,
    total: subtotal * 1.08 + 2,
    paymentStatus: "paid",
    deliveryType: "delivery",
    status,
    createdAt: now,
    timeline,
  };
}

export function getInitialOrders(): OnlineOrder[] {
  return [
    buildOrder("oo-1", "#1001", "website", "John Doe", "accepted"),
    buildOrder("oo-2", "#1002", "foodpanda", "Jane Smith", "preparing"),
    buildOrder("oo-3", "#1003", "ubereats", "Bob Wilson", "pending"),
  ];
}
