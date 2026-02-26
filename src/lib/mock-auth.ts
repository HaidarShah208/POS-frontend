import type { AuthUser } from "@/types/admin";

export const MOCK_CREDENTIALS: { email: string; password: string; user: AuthUser }[] = [
  {
    email: "admin@pos.com",
    password: "admin123",
    user: { id: "u1", email: "admin@pos.com", name: "Admin User", role: "admin" },
  },
  {
    email: "manager@pos.com",
    password: "manager123",
    user: { id: "u2", email: "manager@pos.com", name: "Manager User", role: "admin" },
  },
  {
    email: "cashier@pos.com",
    password: "cashier123",
    user: { id: "u3", email: "cashier@pos.com", name: "Cashier User", role: "cashier" },
  },
  {
    email: "kitchen@pos.com",
    password: "kitchen123",
    user: { id: "u4", email: "kitchen@pos.com", name: "Kitchen User", role: "kitchen" },
  },
];

export function validateLogin(email: string, password: string): AuthUser | null {
  const match = MOCK_CREDENTIALS.find(
    (c) => c.email.toLowerCase() === email.toLowerCase() && c.password === password
  );
  return match ? match.user : null;
}
