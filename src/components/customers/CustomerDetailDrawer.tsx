"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useGetCustomerOrdersQuery, useUpdateCustomerMutation, useDeleteCustomerMutation } from "@/redux/api/customersEndpoints";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Customer } from "@/types/api/index";
import {
  X,
  Mail,
  Phone,
  MapPin,
  StickyNote,
  Calendar,
  ShoppingBag,
  DollarSign,
  Star,
  Clock,
  Edit3,
  Trash2,
  Save,
  Crown,
  TrendingUp,
  Package,
} from "lucide-react";
import { toast } from "sonner";

type Tab = "overview" | "orders" | "notes";

interface CustomerDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onDeleted?: () => void;
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
        <p className="text-sm font-medium mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}

function StatMini({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 px-3 py-3">
      <div className="text-[var(--muted-foreground)]">{icon}</div>
      <span className="text-lg font-bold tabular-nums">{value}</span>
      <span className="text-[10px] text-[var(--muted-foreground)] font-medium uppercase tracking-wider">{label}</span>
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-600",
  vip: "bg-purple-100 text-purple-700",
};

export function CustomerDetailDrawer({ open, onOpenChange, customer, onDeleted }: CustomerDetailDrawerProps) {
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [updateCustomer, { isLoading: saving }] = useUpdateCustomerMutation();
  const [deleteCustomer, { isLoading: deleting }] = useDeleteCustomerMutation();
  const { data: orders = [], isLoading: ordersLoading } = useGetCustomerOrdersQuery(
    customer?.id ?? "",
    { skip: !customer?.id || tab !== "orders" }
  );

  if (!customer) return null;

  const status = customer.status ?? "active";
  const totalOrders = customer.totalOrders ?? 0;
  const totalSpent = customer.totalSpent ?? 0;
  const loyaltyPoints = customer.loyaltyPoints ?? 0;
  const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
  const memberSince = customer.createdAt
    ? new Date(customer.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "—";

  const handleSaveNotes = async () => {
    try {
      await updateCustomer({ id: customer.id, data: { notes: editNotes } }).unwrap();
      toast.success("Notes updated");
      setEditing(false);
    } catch {
      toast.error("Failed to save notes");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
      await deleteCustomer(customer.id).unwrap();
      toast.success("Customer deleted");
      onOpenChange(false);
      onDeleted?.();
    } catch {
      toast.error("Failed to delete customer");
    }
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "orders", label: "Orders" },
    { id: "notes", label: "Notes" },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-lg ml-auto h-full rounded-none border-l border-[var(--border)]">
        <DrawerHeader className="border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-bold">Customer Profile</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 border-b border-[var(--border)] bg-[var(--muted)]/10">
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-bold",
                status === "vip"
                  ? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white"
                  : "bg-[var(--primary)] text-[var(--primary-foreground)]"
              )}>
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold truncate">{customer.name}</h3>
                  {status === "vip" && <Crown className="h-4 w-4 text-purple-500 shrink-0" />}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={cn("text-[10px]", STATUS_STYLE[status])}>
                    {status.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-[var(--muted-foreground)]">Member since {memberSince}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 px-6 py-4 border-b border-[var(--border)]">
            <StatMini icon={<ShoppingBag className="h-4 w-4" />} label="Orders" value={totalOrders} />
            <StatMini icon={<DollarSign className="h-4 w-4" />} label="Spent" value={formatCurrency(totalSpent)} />
            <StatMini icon={<Star className="h-4 w-4" />} label="Points" value={loyaltyPoints} />
          </div>

          <div className="px-6 pt-3">
            <nav className="flex gap-1 rounded-xl bg-[var(--muted)]/50 p-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
                    tab === t.id
                      ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="px-6 py-4">
            <AnimatePresence mode="wait">
              {tab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-[var(--foreground)]">Contact Information</h4>
                    <div className="rounded-xl border border-[var(--border)] px-4 divide-y divide-[var(--border)]">
                      <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={customer.email} />
                      <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={customer.phone} />
                      <InfoRow icon={<MapPin className="h-4 w-4" />} label="Address" value={customer.address} />
                      {!customer.email && !customer.phone && !customer.address && (
                        <p className="py-4 text-sm text-[var(--muted-foreground)] text-center">No contact info</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-[var(--foreground)]">Analytics</h4>
                    <div className="rounded-xl border border-[var(--border)] px-4 divide-y divide-[var(--border)]">
                      <InfoRow icon={<TrendingUp className="h-4 w-4" />} label="Avg Order Value" value={formatCurrency(avgOrderValue)} />
                      <InfoRow
                        icon={<Clock className="h-4 w-4" />}
                        label="Last Order"
                        value={customer.lastOrderAt
                          ? new Date(customer.lastOrderAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : "No orders yet"
                        }
                      />
                      <InfoRow icon={<Calendar className="h-4 w-4" />} label="Member Since" value={memberSince} />
                    </div>
                  </div>

                  {customer.tags && customer.tags.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-[var(--foreground)]">Tags</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {customer.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {deleting ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </motion.div>
              )}

              {tab === "orders" && (
                <motion.div
                  key="orders"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  {ordersLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 rounded-xl" />
                    ))
                  ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center py-10 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] mb-3">
                        <Package className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-semibold">No orders yet</p>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">
                        This customer hasn&apos;t placed any orders.
                      </p>
                    </div>
                  ) : (
                    orders.map((order) => {
                      const statusColor: Record<string, string> = {
                        completed: "bg-emerald-100 text-emerald-700",
                        pending: "bg-amber-100 text-amber-700",
                        cancelled: "bg-red-100 text-red-700",
                        preparing: "bg-blue-100 text-blue-700",
                        ready: "bg-teal-100 text-teal-700",
                        accepted: "bg-indigo-100 text-indigo-700",
                      };
                      return (
                        <div
                          key={order.id}
                          className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3 transition-colors hover:bg-[var(--muted)]/20"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">#{order.orderNumber}</span>
                              <Badge className={cn("text-[10px]", statusColor[order.status] ?? "bg-slate-100 text-slate-600")}>
                                {order.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-[var(--muted-foreground)]">
                              <span>{new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                              <span className="opacity-40">·</span>
                              <span>{order.itemCount} item{order.itemCount !== 1 ? "s" : ""}</span>
                              <span className="opacity-40">·</span>
                              <span className="capitalize">{order.orderType.replace("-", " ")}</span>
                            </div>
                          </div>
                          <span className="text-sm font-bold tabular-nums shrink-0 ml-3">
                            {formatCurrency(order.grandTotal)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </motion.div>
              )}

              {tab === "notes" && (
                <motion.div
                  key="notes"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  {editing ? (
                    <div className="space-y-3">
                      <textarea
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm resize-none h-40 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Add notes about this customer..."
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveNotes}
                          disabled={saving}
                          className="gap-1.5"
                        >
                          <Save className="h-3.5 w-3.5" />
                          {saving ? "Saving..." : "Save Notes"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditing(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customer.notes ? (
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/10 px-4 py-3">
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{customer.notes}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center py-10 text-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] mb-3">
                            <StickyNote className="h-6 w-6" />
                          </div>
                          <p className="text-sm font-semibold">No notes</p>
                          <p className="text-xs text-[var(--muted-foreground)] mt-1">
                            Add notes about preferences, allergies, etc.
                          </p>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          setEditNotes(customer.notes ?? "");
                          setEditing(true);
                        }}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        {customer.notes ? "Edit Notes" : "Add Notes"}
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
