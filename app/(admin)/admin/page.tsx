"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import { logout, saveAuthToStorage } from "@/redux/api/auth/authSlice";
import { baseApi } from "@/redux/api/baseApi";
import { useGetPlatformStatsQuery } from "@/redux/api/adminEndpoints";
import {
  useGetAdminPaymentsQuery,
  useApprovePaymentMutation,
  useRejectPaymentMutation,
} from "@/redux/api/subscriptionEndpoints";
import { PageMotion } from "@/components/shared/PageMotion";
import { StatsCard } from "@/components/admin/StatsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter, ModalClose,
} from "@/components/ui/modal";
import { formatCurrency } from "@/lib/utils";
import {
  Building2, Users, ShoppingCart, DollarSign,
  Play, AlertTriangle, Pause, LogOut, Store,
  LayoutDashboard, CreditCard, Menu, X,
  CheckCircle2, XCircle, Clock, Eye, Banknote,
  Smartphone, Building, Loader2,
} from "lucide-react";

const PAYMENT_STATUS_BADGE: Record<string, { variant: "success" | "warning" | "destructive" | "outline"; label: string }> = {
  PENDING: { variant: "warning", label: "Pending" },
  APPROVED: { variant: "success", label: "Approved" },
  REJECTED: { variant: "destructive", label: "Rejected" },
};

const PAYMENT_METHOD_ICON: Record<string, React.ReactNode> = {
  EASYPAISA: <Smartphone className="h-4 w-4 text-green-600" />,
  JAZZCASH: <Smartphone className="h-4 w-4 text-red-600" />,
  BANK_TRANSFER: <Building className="h-4 w-4 text-blue-600" />,
};

export default function AdminDashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { data: stats, isLoading } = useGetPlatformStatsQuery();
  const [paymentFilter, setPaymentFilter] = useState("PENDING");
  const { data: paymentsData } = useGetAdminPaymentsQuery({ status: paymentFilter });
  const [approvePayment, { isLoading: approving }] = useApprovePaymentMutation();
  const [rejectPayment, { isLoading: rejecting }] = useRejectPaymentMutation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [viewReceipt, setViewReceipt] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  const payments = paymentsData?.data ?? [];

  const handleLogout = () => {
    setLoggingOut(true);
    setTimeout(() => {
      dispatch(logout());
      dispatch(baseApi.util.resetApiState());
      saveAuthToStorage(null);
      router.push("/auth/login");
    }, 600);
  };

  const handleApprove = async (id: string) => {
    await approvePayment(id);
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    await rejectPayment({ id: rejectTarget, notes: rejectNotes });
    setRejectTarget(null);
    setRejectNotes("");
  };

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "";

  return (
    <PageMotion>
      <div className="min-h-screen bg-[var(--muted)]">
        <header className="bg-[var(--card)] border-b border-[var(--border)] px-4 sm:px-6 py-3 sm:py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--primary)] flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-[var(--foreground)]">Platform Admin</h1>
                <p className="text-xs text-[var(--muted-foreground)]">{user?.email}</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-2">
              <Link href="/admin" className="text-sm font-medium text-[var(--primary)] px-3 py-1.5 rounded-lg bg-[var(--primary)]/10">
                Dashboard
              </Link>
              <Link href="/admin/restaurants" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] px-3 py-1.5 rounded-lg hover:bg-[var(--muted)]">
                <Store className="w-4 h-4 inline mr-1" />Restaurants
              </Link>
              <Link href="/admin/subscriptions" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] px-3 py-1.5 rounded-lg hover:bg-[var(--muted)]">
                <CreditCard className="w-4 h-4 inline mr-1" />Subscriptions
              </Link>
              <button onClick={handleLogout} disabled={loggingOut} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50">
                {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              </button>
            </nav>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-[var(--muted)]">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden mt-3 pt-3 border-t border-[var(--border)] space-y-1">
              <p className="text-xs text-[var(--muted-foreground)] px-3 mb-2">{user?.email}</p>
              <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-sm font-medium text-[var(--primary)] px-3 py-2 rounded-lg bg-[var(--primary)]/10">
                <LayoutDashboard className="w-4 h-4" />Dashboard
              </Link>
              <Link href="/admin/restaurants" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] px-3 py-2 rounded-lg hover:bg-[var(--muted)]">
                <Store className="w-4 h-4" />Restaurants
              </Link>
              <Link href="/admin/subscriptions" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] px-3 py-2 rounded-lg hover:bg-[var(--muted)]">
                <CreditCard className="w-4 h-4" />Subscriptions
              </Link>
              <button onClick={handleLogout} disabled={loggingOut} className="flex items-center gap-2 text-sm text-red-500 px-3 py-2 rounded-lg hover:bg-red-50 w-full text-left disabled:opacity-50">
                {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          )}
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Platform Overview</h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">Monitor all restaurants and platform activity</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-28 sm:h-32 rounded-2xl bg-[var(--card)] animate-pulse" />
              ))}
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <StatsCard title="Total Restaurants" value={stats.totalOrganizations} icon={<Building2 className="w-5 h-5 text-blue-500" />} />
                <StatsCard title="Active" value={stats.activeOrganizations} icon={<Play className="w-5 h-5 text-emerald-500" />} />
                <StatsCard title="Trial" value={stats.trialOrganizations} icon={<AlertTriangle className="w-5 h-5 text-amber-500" />} />
                <StatsCard title="Suspended" value={stats.suspendedOrganizations} icon={<Pause className="w-5 h-5 text-red-500" />} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
 
                <StatsCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={<DollarSign className="w-5 h-5 text-emerald-500" />} />
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-[var(--muted-foreground)]">Failed to load platform stats</div>
          )}

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-[var(--primary)]" />
                  Payment Submissions
                </h3>
                <p className="text-sm text-[var(--muted-foreground)]">Review and approve restaurant payments</p>
              </div>
              <div className="flex gap-2">
                {["PENDING", "APPROVED", "REJECTED"].map((s) => (
                  <Button key={s} variant={paymentFilter === s ? "default" : "outline"} size="sm" onClick={() => setPaymentFilter(s)}>
                    {s === "PENDING" && <Clock className="h-3 w-3 mr-1" />}
                    {s === "APPROVED" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {s === "REJECTED" && <XCircle className="h-3 w-3 mr-1" />}
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </Button>
                ))}
              </div>
            </div>

            {payments.length === 0 ? (
              <Card>
                <CardContent className="p-8 sm:p-12 text-center">
                  <Banknote className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-3" />
                  <p className="text-[var(--muted-foreground)]">No {paymentFilter.toLowerCase()} payments</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {payments.map((p) => {
                  const statusBadge = PAYMENT_STATUS_BADGE[p.status] ?? PAYMENT_STATUS_BADGE.PENDING;
                  return (
                    <Card key={p.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <Link href={`/admin/restaurants/${p.organizationId}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                            <div className="h-10 w-10 rounded-xl bg-[var(--muted)] flex items-center justify-center shrink-0">
                              {PAYMENT_METHOD_ICON[p.paymentMethod] ?? <CreditCard className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{p.organization?.name ?? "Unknown"}</p>
                              <p className="text-xs text-[var(--muted-foreground)]">
                                {p.paymentMethod} · {p.transactionId ?? "—"} · {new Date(p.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </Link>

                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-lg font-bold tabular-nums">{formatCurrency(Number(p.amount))}</span>
                            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                            {p.plan && <Badge variant="outline" className="text-[10px]">{p.plan.name}</Badge>}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {p.receiptImage && (
                              <Button variant="outline" size="sm" className="h-8 gap-1 text-xs"
                                onClick={() => setViewReceipt(`${backendUrl}/api/files/receipt/${p.receiptImage}`)}>
                                <Eye className="h-3 w-3" />Receipt
                              </Button>
                            )}
                            {p.status === "PENDING" && (
                              <>
                                <Button size="sm" className="h-8 gap-1 text-xs bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => handleApprove(p.id)} disabled={approving}>
                                  <CheckCircle2 className="h-3 w-3" />Approve
                                </Button>
                                <Button variant="outline" size="sm" className="h-8 gap-1 text-xs text-red-600 hover:text-red-700"
                                  onClick={() => { setRejectTarget(p.id); setRejectNotes(""); }}>
                                  <XCircle className="h-3 w-3" />Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {p.reviewNotes && (
                          <div className="mt-3 p-2 rounded-lg bg-red-50 text-red-700 text-xs">
                            Rejection reason: {p.reviewNotes}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      <Modal open={!!viewReceipt} onOpenChange={(o) => !o && setViewReceipt(null)}>
        <ModalContent className="max-w-lg">
          <ModalHeader><ModalTitle>Payment Receipt</ModalTitle></ModalHeader>
          {viewReceipt && (
            <img src={viewReceipt} alt="Payment receipt" className="w-full rounded-lg border border-[var(--border)]" />
          )}
          <ModalFooter>
            <ModalClose asChild><Button variant="outline">Close</Button></ModalClose>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <ModalContent>
          <ModalHeader><ModalTitle>Reject Payment</ModalTitle></ModalHeader>
          <div className="space-y-3">
            <p className="text-sm text-[var(--muted-foreground)]">Please provide a reason for rejection.</p>
            <Input
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="e.g. Receipt unclear, amount mismatch..."
            />
          </div>
          <ModalFooter>
            <ModalClose asChild><Button variant="outline">Cancel</Button></ModalClose>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectNotes.trim() || rejecting}>
              {rejecting ? "Rejecting..." : "Reject Payment"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageMotion>
  );
}
