"use client";

import { useState, useMemo } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { motion, AnimatePresence } from "framer-motion";
import { PageMotion } from "@/components/shared/PageMotion";
import { StatsCard } from "@/components/admin/StatsCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { ErrorState } from "@/components/admin/ErrorState";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useGetSupplierPurchasesQuery,
} from "@/redux/api/suppliersEndpoints";
import { formatCurrency, cn } from "@/lib/utils";
import type { Supplier, SupplierStatus } from "@/types/api/index";
import { toast } from "sonner";
import {
  Truck,
  Search,
  Plus,
  UserPlus,
  DollarSign,
  ShoppingBag,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  User,
  ChevronRight,
  Filter,
  X,
  Trash2,
  Save,
  Edit3,
  Package,
  Calendar,
  StickyNote,
  TrendingUp,
  Clock,
  CreditCard,
  FileText,
} from "lucide-react";

type StatusFilter = "all" | SupplierStatus;

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-600",
};

const PURCHASE_STATUS_BADGE: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  partial: "bg-blue-100 text-blue-700",
};

function PageHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Manage your suppliers, track purchases and outstanding balances
        </p>
      </div>
      <Button onClick={onAdd} className="gap-2 shrink-0 mt-2 sm:mt-0">
        <Plus className="h-4 w-4" />
        Add Supplier
      </Button>
    </div>
  );
}

function AddSupplierForm({ onClose, onSave }: { onClose: () => void; onSave: (d: Partial<Supplier>) => void }) {
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Name is required"); return; }
    onSave({
      name: name.trim(),
      contactPerson: contactPerson.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      status: "active",
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">New Supplier</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Company Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Supplier name" autoFocus
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]" />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Contact Person</label>
                <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Contact name"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]" />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@supplier.com"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]" />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Phone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 890"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Address</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, City"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
              <Button type="submit" size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" />Add Supplier</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
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

type DrawerTab = "overview" | "purchases" | "notes";

function SupplierDetailDrawer({ open, onOpenChange, supplier, onDeleted }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  supplier: Supplier | null;
  onDeleted?: () => void;
}) {
  const [tab, setTab] = useState<DrawerTab>("overview");
  const [editing, setEditing] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [updateSupplier, { isLoading: saving }] = useUpdateSupplierMutation();
  const [deleteSupplier, { isLoading: deleting }] = useDeleteSupplierMutation();
  const { data: purchases = [], isLoading: purchasesLoading } = useGetSupplierPurchasesQuery(
    supplier?.id ?? "",
    { skip: !supplier?.id || tab !== "purchases" }
  );

  if (!supplier) return null;

  const totalOrders = supplier.totalOrders ?? 0;
  const totalSpent = supplier.totalSpent ?? 0;
  const outstanding = supplier.outstandingBalance ?? 0;
  const memberSince = supplier.createdAt
    ? new Date(supplier.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "—";

  const handleSaveNotes = async () => {
    try {
      await updateSupplier({ id: supplier.id, data: { notes: editNotes } }).unwrap();
      toast.success("Notes updated");
      setEditing(false);
    } catch { toast.error("Failed to save notes"); }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this supplier?")) return;
    try {
      await deleteSupplier(supplier.id).unwrap();
      toast.success("Supplier deleted");
      onOpenChange(false);
      onDeleted?.();
    } catch { toast.error("Failed to delete"); }
  };

  const TABS: { id: DrawerTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "purchases", label: "Purchases" },
    { id: "notes", label: "Notes" },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-lg ml-auto h-full rounded-none border-l border-[var(--border)]">
        <DrawerHeader className="border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-bold">Supplier Profile</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><X className="h-4 w-4" /></Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 border-b border-[var(--border)] bg-[var(--muted)]/10">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-xl font-bold">
                {supplier.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold truncate">{supplier.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={cn("text-[10px]", STATUS_BADGE[supplier.status])}>
                    {supplier.status.toUpperCase()}
                  </Badge>
                  {supplier.contactPerson && (
                    <span className="text-xs text-[var(--muted-foreground)]">{supplier.contactPerson}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 px-6 py-4 border-b border-[var(--border)]">
            <StatMini icon={<ShoppingBag className="h-4 w-4" />} label="Orders" value={totalOrders} />
            <StatMini icon={<DollarSign className="h-4 w-4" />} label="Total" value={formatCurrency(totalSpent)} />
            <StatMini icon={<CreditCard className="h-4 w-4" />} label="Balance" value={formatCurrency(outstanding)} />
          </div>

          <div className="px-6 pt-3">
            <nav className="flex gap-1 rounded-xl bg-[var(--muted)]/50 p-1">
              {TABS.map((t) => (
                <button key={t.id} type="button" onClick={() => setTab(t.id)}
                  className={cn("flex-1 rounded-lg py-2 text-sm font-medium transition-all",
                    tab === t.id ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  )}>
                  {t.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="px-6 py-4">
            <AnimatePresence mode="wait">
              {tab === "overview" && (
                <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">Contact</h4>
                    <div className="rounded-xl border border-[var(--border)] px-4 divide-y divide-[var(--border)]">
                      <InfoRow icon={<User className="h-4 w-4" />} label="Contact Person" value={supplier.contactPerson} />
                      <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={supplier.email} />
                      <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={supplier.phone} />
                      <InfoRow icon={<MapPin className="h-4 w-4" />} label="Address" value={supplier.address} />
                      {!supplier.contactPerson && !supplier.email && !supplier.phone && !supplier.address && (
                        <p className="py-4 text-sm text-[var(--muted-foreground)] text-center">No contact info</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">Analytics</h4>
                    <div className="rounded-xl border border-[var(--border)] px-4 divide-y divide-[var(--border)]">
                      <InfoRow icon={<TrendingUp className="h-4 w-4" />} label="Avg Order Value" value={totalOrders > 0 ? formatCurrency(totalSpent / totalOrders) : "—"} />
                      <InfoRow icon={<Clock className="h-4 w-4" />} label="Last Order" value={supplier.lastOrderAt ? new Date(supplier.lastOrderAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No orders yet"} />
                      <InfoRow icon={<Calendar className="h-4 w-4" />} label="Supplier Since" value={memberSince} />
                    </div>
                  </div>
                  {supplier.productsSupplied && supplier.productsSupplied.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold">Products Supplied</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {supplier.productsSupplied.map((p) => (
                          <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200" onClick={handleDelete} disabled={deleting}>
                      <Trash2 className="h-3.5 w-3.5" />{deleting ? "Deleting..." : "Delete Supplier"}
                    </Button>
                  </div>
                </motion.div>
              )}

              {tab === "purchases" && (
                <motion.div key="purchases" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                  {purchasesLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
                  ) : purchases.length === 0 ? (
                    <div className="flex flex-col items-center py-10 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] mb-3">
                        <FileText className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-semibold">No purchase records</p>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">Purchase orders will appear here.</p>
                    </div>
                  ) : (
                    purchases.map((po) => (
                      <div key={po.id} className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3 hover:bg-[var(--muted)]/20 transition-colors">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">#{po.invoiceNumber}</span>
                            <Badge className={cn("text-[10px]", PURCHASE_STATUS_BADGE[po.status] ?? "bg-slate-100 text-slate-600")}>
                              {po.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-[var(--muted-foreground)]">
                            <span>{new Date(po.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                            <span className="opacity-40">·</span>
                            <span>{po.items} item{po.items !== 1 ? "s" : ""}</span>
                          </div>
                        </div>
                        <span className="text-sm font-bold tabular-nums shrink-0 ml-3">{formatCurrency(po.amount)}</span>
                      </div>
                    ))
                  )}
                </motion.div>
              )}

              {tab === "notes" && (
                <motion.div key="notes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                  {editing ? (
                    <div className="space-y-3">
                      <textarea
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm resize-none h-40 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
                        value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Add notes..." autoFocus />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveNotes} disabled={saving} className="gap-1.5">
                          <Save className="h-3.5 w-3.5" />{saving ? "Saving..." : "Save"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {supplier.notes ? (
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/10 px-4 py-3">
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{supplier.notes}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center py-10 text-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] mb-3">
                            <StickyNote className="h-6 w-6" />
                          </div>
                          <p className="text-sm font-semibold">No notes</p>
                          <p className="text-xs text-[var(--muted-foreground)] mt-1">Add notes about payment terms, lead time, etc.</p>
                        </div>
                      )}
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setEditNotes(supplier.notes ?? ""); setEditing(true); }}>
                        <Edit3 className="h-3.5 w-3.5" />{supplier.notes ? "Edit Notes" : "Add Notes"}
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

function SupplierRow({ supplier, onClick }: { supplier: Supplier; onClick: () => void }) {
  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="group">
      <button type="button" onClick={onClick}
        className="w-full flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3.5 text-left transition-all hover:shadow-md hover:border-[var(--primary)]/20">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-bold">
          {supplier.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold truncate">{supplier.name}</span>
            <Badge className={cn("text-[10px] shrink-0", STATUS_BADGE[supplier.status])}>
              {supplier.status}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-[var(--muted-foreground)]">
            {supplier.contactPerson && (
              <span className="flex items-center gap-1 truncate"><User className="h-3 w-3 shrink-0" />{supplier.contactPerson}</span>
            )}
            {supplier.phone && (
              <span className="flex items-center gap-1 shrink-0"><Phone className="h-3 w-3" />{supplier.phone}</span>
            )}
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-6 shrink-0">
          <div className="text-right">
            <p className="text-xs text-[var(--muted-foreground)]">Orders</p>
            <p className="text-sm font-bold tabular-nums">{supplier.totalOrders ?? 0}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--muted-foreground)]">Total</p>
            <p className="text-sm font-bold tabular-nums">{formatCurrency(supplier.totalSpent ?? 0)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--muted-foreground)]">Balance</p>
            <p className={cn("text-sm font-bold tabular-nums", (supplier.outstandingBalance ?? 0) > 0 ? "text-amber-600" : "text-emerald-600")}>
              {formatCurrency(supplier.outstandingBalance ?? 0)}
            </p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    </motion.div>
  );
}

export default function SuppliersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = {};
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (statusFilter !== "all") params.status = statusFilter;
    return params;
  }, [debouncedSearch, statusFilter]);

  const { data: suppliers = [], isLoading, isError, refetch } = useGetSuppliersQuery(queryParams);
  const [createSupplier] = useCreateSupplierMutation();

  const stats = useMemo(() => {
    const total = suppliers.length;
    const active = suppliers.filter((s) => s.status === "active").length;
    const totalSpent = suppliers.reduce((sum, s) => sum + (s.totalSpent ?? 0), 0);
    const totalBalance = suppliers.reduce((sum, s) => sum + (s.outstandingBalance ?? 0), 0);
    return { total, active, totalSpent, totalBalance };
  }, [suppliers]);

  const filtered = useMemo(() => {
    return [...suppliers].sort((a, b) => (b.totalSpent ?? 0) - (a.totalSpent ?? 0));
  }, [suppliers]);

  const handleAdd = async (data: Partial<Supplier>) => {
    try {
      await createSupplier(data as Supplier & { name: string }).unwrap();
      toast.success("Supplier added");
      setShowAddForm(false);
    } catch { toast.error("Failed to add supplier"); }
  };

  return (
    <RoleGuard permission="suppliers">
      <PageMotion>
        <PageHeader onAdd={() => setShowAddForm(true)} />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Suppliers" value={stats.total} animate icon={<Truck className="h-5 w-5" />} />
          <StatsCard title="Active" value={stats.active} animate icon={<Package className="h-5 w-5" />} />
          <StatsCard title="Total Purchased" value={formatCurrency(stats.totalSpent)} icon={<DollarSign className="h-5 w-5" />} />
          <StatsCard
            title="Outstanding"
            value={formatCurrency(stats.totalBalance)}
            icon={<AlertCircle className="h-5 w-5" />}
            className={stats.totalBalance > 0 ? "border-amber-200" : ""}
          />
        </div>

        <AnimatePresence>
          {showAddForm && <AddSupplierForm onClose={() => setShowAddForm(false)} onSave={handleAdd} />}
        </AnimatePresence>

        <Card>
          <CardContent className="p-0">
            <div className="flex flex-col gap-3 border-b border-[var(--border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                <input type="text" placeholder="Search suppliers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2 pl-9 pr-4 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]" />
              </div>
              <div className="flex items-center gap-1.5">
                <Filter className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />
                <nav className="flex items-center gap-1 rounded-xl bg-[var(--muted)]/50 p-1">
                  {(["all", "active", "inactive"] as const).map((f) => (
                    <button key={f} type="button" onClick={() => setStatusFilter(f)}
                      className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-all capitalize",
                        statusFilter === f ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      )}>
                      {f}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            <div className="p-4">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[72px] rounded-xl" />)}
                </div>
              ) : isError ? (
                <ErrorState title="Failed to load suppliers" message="Could not fetch supplier data." onRetry={refetch} />
              ) : filtered.length === 0 ? (
                <EmptyState
                  title={searchQuery || statusFilter !== "all" ? "No matching suppliers" : "No suppliers yet"}
                  description={searchQuery || statusFilter !== "all" ? "Try adjusting your search or filters." : "Add your first supplier to start tracking purchases."}
                  icon={<Truck className="h-6 w-6" />}
                  action={!searchQuery && statusFilter === "all" ? (
                    <Button size="sm" onClick={() => setShowAddForm(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Add Supplier</Button>
                  ) : undefined}
                />
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-[var(--muted-foreground)] px-1 mb-3">
                    {filtered.length} supplier{filtered.length !== 1 ? "s" : ""}
                  </p>
                  <AnimatePresence mode="popLayout">
                    {filtered.map((s) => (
                      <SupplierRow key={s.id} supplier={s} onClick={() => { setSelectedSupplier(s); setDrawerOpen(true); }} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <SupplierDetailDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          supplier={selectedSupplier}
          onDeleted={() => setSelectedSupplier(null)}
        />
      </PageMotion>
    </RoleGuard>
  );
}
