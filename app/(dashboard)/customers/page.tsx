"use client";

import { useState, useMemo, useCallback } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { motion, AnimatePresence } from "framer-motion";
import { PageMotion } from "@/components/shared/PageMotion";
import { StatsCard } from "@/components/admin/StatsCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { ErrorState } from "@/components/admin/ErrorState";
import { CustomerDetailDrawer } from "@/components/customers/CustomerDetailDrawer";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetCustomersQuery, useCreateCustomerMutation } from "@/redux/api/customersEndpoints";
import { formatCurrency, cn } from "@/lib/utils";
import type { Customer, CustomerStatus } from "@/types/api/index";
import { toast } from "sonner";
import {
  Users,
  Search,
  Plus,
  UserPlus,
  Crown,
  DollarSign,
  Star,
  ShoppingBag,
  Mail,
  Phone,
  ChevronRight,
  Filter,
  X,
} from "lucide-react";

type StatusFilter = "all" | CustomerStatus;

const STATUS_FILTERS: { id: StatusFilter; label: string; color: string }[] = [
  { id: "all", label: "All", color: "" },
  { id: "active", label: "Active", color: "bg-emerald-100 text-emerald-700" },
  { id: "vip", label: "VIP", color: "bg-purple-100 text-purple-700" },
  { id: "inactive", label: "Inactive", color: "bg-slate-100 text-slate-600" },
];

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-600",
  vip: "bg-purple-100 text-purple-700",
};

function PageHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Manage your customer base, view profiles and purchase history
        </p>
      </div>
      <Button onClick={onAdd} className="gap-2 shrink-0 mt-2 sm:mt-0">
        <UserPlus className="h-4 w-4" />
        Add Customer
      </Button>
    </div>
  );
}

function AddCustomerForm({ onClose, onSave }: { onClose: () => void; onSave: (data: Partial<Customer>) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    onSave({
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">New Customer</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Customer name"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 234 567 890"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
              <Button type="submit" size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add Customer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CustomerRow({ customer, onClick }: { customer: Customer; onClick: () => void }) {
  const status = customer.status ?? "active";
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="group"
    >
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3.5 text-left transition-all hover:shadow-md hover:border-[var(--primary)]/20"
      >
        <div className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold",
          status === "vip"
            ? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white"
            : "bg-[var(--primary)] text-[var(--primary-foreground)]"
        )}>
          {customer.name.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold truncate">{customer.name}</span>
            {status === "vip" && <Crown className="h-3.5 w-3.5 text-purple-500 shrink-0" />}
            <Badge className={cn("text-[10px] ml-auto sm:ml-0 shrink-0", STATUS_BADGE[status])}>
              {status}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-[var(--muted-foreground)]">
            {customer.email && (
              <span className="flex items-center gap-1 truncate">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{customer.email}</span>
              </span>
            )}
            {customer.phone && (
              <span className="flex items-center gap-1 shrink-0">
                <Phone className="h-3 w-3" />
                {customer.phone}
              </span>
            )}
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-6 shrink-0">
          <div className="text-right">
            <p className="text-xs text-[var(--muted-foreground)]">Orders</p>
            <p className="text-sm font-bold tabular-nums">{customer.totalOrders ?? 0}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--muted-foreground)]">Spent</p>
            <p className="text-sm font-bold tabular-nums">{formatCurrency(customer.totalSpent ?? 0)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--muted-foreground)]">Points</p>
            <p className="text-sm font-bold tabular-nums">{customer.loyaltyPoints ?? 0}</p>
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    </motion.div>
  );
}

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = {};
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (statusFilter !== "all") params.status = statusFilter;
    return params;
  }, [debouncedSearch, statusFilter]);

  const { data: customers = [], isLoading, isError, refetch } = useGetCustomersQuery(queryParams);
  const [createCustomer, { isLoading: creating }] = useCreateCustomerMutation();

  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => (c.status ?? "active") === "active").length;
    const vip = customers.filter((c) => c.status === "vip").length;
    const totalSpent = customers.reduce((sum, c) => sum + (c.totalSpent ?? 0), 0);
    const totalPoints = customers.reduce((sum, c) => sum + (c.loyaltyPoints ?? 0), 0);
    return { total, active, vip, totalSpent, totalPoints };
  }, [customers]);

  const filtered = useMemo(() => {
    return [...customers].sort((a, b) => {
      const sa = a.status ?? "active";
      const sb = b.status ?? "active";
      if (sa === "vip" && sb !== "vip") return -1;
      if (sb === "vip" && sa !== "vip") return 1;
      return (b.totalSpent ?? 0) - (a.totalSpent ?? 0);
    });
  }, [customers]);

  const handleAddCustomer = async (data: Partial<Customer>) => {
    try {
      await createCustomer(data as Customer & { name: string }).unwrap();
      toast.success("Customer added");
      setShowAddForm(false);
    } catch {
      toast.error("Failed to add customer");
    }
  };

  const openDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDrawerOpen(true);
  };

  return (
    <RoleGuard permission="customers">
      <PageMotion>
        <PageHeader onAdd={() => setShowAddForm(true)} />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Customers"
            value={stats.total}
            animate
            icon={<Users className="h-5 w-5" />}
          />
          <StatsCard
            title="Active"
            value={stats.active}
            animate
            icon={<ShoppingBag className="h-5 w-5" />}
          />
          <StatsCard
            title="VIP Members"
            value={stats.vip}
            animate
            icon={<Crown className="h-5 w-5" />}
          />
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(stats.totalSpent)}
            icon={<DollarSign className="h-5 w-5" />}
          />
        </div>

        <AnimatePresence>
          {showAddForm && (
            <AddCustomerForm
              onClose={() => setShowAddForm(false)}
              onSave={handleAddCustomer}
            />
          )}
        </AnimatePresence>

        <Card>
          <CardContent className="p-0">
            <div className="flex flex-col gap-3 border-b border-[var(--border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2 pl-9 pr-4 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <Filter className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />
                <nav className="flex items-center gap-1 rounded-xl bg-[var(--muted)]/50 p-1">
                  {STATUS_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setStatusFilter(f.id)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                        statusFilter === f.id
                          ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
                          : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            <div className="p-4">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-[72px] rounded-xl" />
                  ))}
                </div>
              ) : isError ? (
                <ErrorState
                  title="Failed to load customers"
                  message="Could not fetch customer data. Please try again."
                  onRetry={refetch}
                />
              ) : filtered.length === 0 ? (
                <EmptyState
                  title={searchQuery || statusFilter !== "all" ? "No matching customers" : "No customers yet"}
                  description={
                    searchQuery || statusFilter !== "all"
                      ? "Try adjusting your search or filters."
                      : "Add your first customer to start building your customer base."
                  }
                  icon={<Users className="h-6 w-6" />}
                  action={
                    !searchQuery && statusFilter === "all" ? (
                      <Button size="sm" onClick={() => setShowAddForm(true)} className="gap-1.5">
                        <UserPlus className="h-3.5 w-3.5" />
                        Add Customer
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-[var(--muted-foreground)] px-1 mb-3">
                    {filtered.length} customer{filtered.length !== 1 ? "s" : ""}
                    {statusFilter !== "all" && ` · ${statusFilter}`}
                  </p>
                  <AnimatePresence mode="popLayout">
                    {filtered.map((customer) => (
                      <CustomerRow
                        key={customer.id}
                        customer={customer}
                        onClick={() => openDetail(customer)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <CustomerDetailDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          customer={selectedCustomer}
          onDeleted={() => setSelectedCustomer(null)}
        />
      </PageMotion>
    </RoleGuard>
  );
}
