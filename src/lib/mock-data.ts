import type { Category, Product, Order, StaffMember } from "@/types";
import type { CartItemModifier } from "@/types";

export const MOCK_MODIFIERS: CartItemModifier[] = [
  { id: "mod-1", name: "Extra Cheese", price: 0.99 },
  { id: "mod-2", name: "Bacon", price: 1.49 },
  { id: "mod-3", name: "Large Size", price: 1.0 },
];

export const MOCK_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Burgers", slug: "burgers", sortOrder: 1 },
  { id: "cat-2", name: "Pizza", slug: "pizza", sortOrder: 2 },
  { id: "cat-3", name: "Drinks", slug: "drinks", sortOrder: 3 },
  { id: "cat-4", name: "Sides", slug: "sides", sortOrder: 4 },
  { id: "cat-5", name: "Desserts", slug: "desserts", sortOrder: 5 },
];

export const MOCK_PRODUCTS: Product[] = [
  { id: "p1", name: "Classic Burger", price: 8.99, categoryId: "cat-1" },
  { id: "p2", name: "Cheese Burger", price: 9.49, categoryId: "cat-1" },
  { id: "p3", name: "Double Burger", price: 11.99, categoryId: "cat-1" },
  { id: "p4", name: "Margherita Pizza", price: 12.99, categoryId: "cat-2" },
  { id: "p5", name: "Pepperoni Pizza", price: 13.49, categoryId: "cat-2" },
  { id: "p6", name: "BBQ Chicken Pizza", price: 14.99, categoryId: "cat-2" },
  { id: "p7", name: "Cola", price: 2.49, categoryId: "cat-3" },
  { id: "p8", name: "Lemonade", price: 2.99, categoryId: "cat-3" },
  { id: "p9", name: "Iced Coffee", price: 3.49, categoryId: "cat-3" },
  { id: "p10", name: "French Fries", price: 3.99, categoryId: "cat-4" },
  { id: "p11", name: "Onion Rings", price: 4.49, categoryId: "cat-4" },
  { id: "p12", name: "Chocolate Cake", price: 5.99, categoryId: "cat-5" },
  { id: "p13", name: "Ice Cream", price: 4.49, categoryId: "cat-5" },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: "ord-1",
    orderNumber: "#1001",
    items: [
      { id: "ci1", productId: "p1", name: "Classic Burger", price: 8.99, quantity: 2 },
      { id: "ci2", productId: "p7", name: "Cola", price: 2.49, quantity: 2 },
    ],
    subtotal: 22.96,
    tax: 1.84,
    discount: 0,
    grandTotal: 24.8,
    status: "completed",
    createdAt: "2025-02-24T12:00:00Z",
  },
  {
    id: "ord-2",
    orderNumber: "#1002",
    items: [
      { id: "ci3", productId: "p4", name: "Margherita Pizza", price: 12.99, quantity: 1 },
    ],
    subtotal: 12.99,
    tax: 1.04,
    discount: 2,
    grandTotal: 12.03,
    status: "pending",
    createdAt: "2025-02-25T10:30:00Z",
  },
];

export const MOCK_STAFF: StaffMember[] = [
  { id: "s1", name: "John Doe", role: "Manager", email: "john@restaurant.com", status: "active" },
  { id: "s2", name: "Jane Smith", role: "Cashier", email: "jane@restaurant.com", status: "active" },
  { id: "s3", name: "Bob Wilson", role: "Server", email: "bob@restaurant.com", status: "inactive" },
];
