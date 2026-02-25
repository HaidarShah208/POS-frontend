export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
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
