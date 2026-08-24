"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useGetOrganizationByIdQuery,
  useGetOrganizationPaymentsQuery,
  useUpdateOrganizationStatusMutation,
} from "@/redux/api/adminEndpoints";
import {
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
  ArrowLeft, Building2, Users, ShoppingCart, DollarSign,
  CreditCard, Clock, CheckCircle2, XCircle, Eye,
  Smartphone, Building, Calendar, Mail, Phone,
  MapPin, Crown, Shield, Loader2, Banknote,
} from "lucide-react";

const ORG_STATUS_BADGE: Record<string, { variant: "success" | "warning" | "destructive" | "outline"; label: string }> = {
  active: { variant: "success", label: "Active" },
  trial: { variant: "warning", label: "Trial" },
  suspended: { variant: "destructive", label: "Suspended" },
  inactive: { variant: "outline", label: "Inactive" },
};

const SUB_STATUS_BADGE: Record<string, { variant: "success" | "warning" | "destructive" | "outline"; label: string }> = {
  trialing: { variant: "warning", label: "Trial" },
  active: { variant: "success", label: "Active" },
  past_due: { variant: "destructive", label: "Past Due" },
  cancelled: { variant: "outline", label: "Cancelled" },
  expired: { variant: "destructive", label: "Expired" },
  suspended: { variant: "destructive", label: "Suspended" },
  pending_verification: { variant: "warning", label: "Pending" },
};

const PAYMENT_STATUS_BADGE: Record<string, { variant: "success" | "warning" | "destructive"; label: string }> = {
  PENDING: { variant: "warning", label: "Pending" },
  APPROVED: { variant: "success", label: "Approved" },
  REJECTED: { variant: "destructive", label: "Rejected" },
};

const PAYMENT_METHOD_LABEL: Record<string, { icon: React.ReactNode; label: string }> = {
  EASYPAISA: { icon: <Smartphone className="h-4 w-4 text-green-600" />, label: "EasyPaisa" },
  JAZZCASH: { icon: <Smartphone className="h-4 w-4 text-red-600" />, label: "JazzCash" },
  BANK_TRANSFER: { icon: <Building className="h-4 w-4 text-blue-600" />, label: "Bank Transfer" },
};

export default function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: org, isLoading } = useGetOrganizationByIdQuery(id);
  const { data: payments, isLoading: paymentsLoading } = useGetOrganizationPaymentsQuery(id);
  const [updateStatus, { isLoading: updatingStatus }] = useUpdateOrganizationStatusMutation();
  const [approvePayment, { isLoading: approving }] = useApprovePaymentMutation();
  const [rejectPayment, { isLoading: rejecting }] = useRejectPaymentMutation();

  const [viewReceipt, setViewReceipt] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "";

  const handleStatusChange = async (status: string) => {
    await updateStatus({ id, status });
  };

  const handleApprove = async (paymentId: string) => {
    await approvePayment(paymentId);
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    await rejectPayment({ id: rejectTarget, notes: rejectNotes });
    setRejectTarget(null);
    setRejectNotes("");
  };

  if (isLoading) {
    return (
      <PageMotion>
        <div className="min-h-screen bg-[var(--muted)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            <div className="h-8 w-48 rounded-lg bg-[var(--card)] animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-[var(--card)] animate-pulse" />
              ))}
            </div>
            <div className="h-64 rounded-2xl bg-[var(--card)] animate-pulse" />
          </div>
        </div>
      </PageMotion>
    );
  }

  if (!org) {
    return (
      <PageMotion>
        <div className="min-h-screen bg-[var(--muted)] flex items-center justify-center">
          <Card>
            <CardContent className="p-12 text-center space-y-4">
              <Building2 className="w-12 h-12 mx-auto text-[var(--muted-foreground)]" />
              <p className="text-lg font-medium">Restaurant not found</p>
              <Button variant="outline" onClick={() => router.push("/admin/restaurants")}>
                <ArrowLeft className="w-4 h-4 mr-2" />Back to Restaurants
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageMotion>
    );
  }

  const orgBadge = ORG_STATUS_BADGE[org.status] ?? ORG_STATUS_BADGE.inactive;
  const sub = org.subscription;
  const subBadge = sub ? (SUB_STATUS_BADGE[sub.status] ?? SUB_STATUS_BADGE.trialing) : null;
  const orgUsers = (org as unknown as Record<string, unknown>).users as Array<{ id: string; name: string; email: string; role: string; createdAt: string }> | undefined;
  const orgStats = (org as unknown as Record<string, unknown>).stats as { totalOrders: number; totalRevenue: number; totalUsers: number } | undefined;

  return (
    <PageMotion>
      <div className="min-h-screen bg-[var(--muted)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Link href="/admin/restaurants" className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
              <ArrowLeft className="w-4 h-4" />Back to Restaurants
            </Link>
          </div>

          <Card>
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h1 className="text-xl font-bold">{org.name}</h1>
                    <Badge variant={orgBadge.variant}>{orgBadge.label}</Badge>
                    {subBadge && <Badge variant={subBadge.variant}>{subBadge.label}</Badge>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-[var(--muted-foreground)] mt-2">
                    {org.email && (
                      <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{org.email}</span>
                    )}
                    {org.phone && (
                      <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{org.phone}</span>
                    )}
                    {org.address && (
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{org.address}</span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />Registered: {new Date(org.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {org.status !== "active" && (
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleStatusChange("active")} disabled={updatingStatus}>
                      {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                      Activate
                    </Button>
                  )}
                  {org.status !== "suspended" && (
                    <Button size="sm" variant="destructive" onClick={() => handleStatusChange("suspended")} disabled={updatingStatus}>
                      {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
                      Suspend
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Total Orders" value={orgStats?.totalOrders ?? 0} icon={<ShoppingCart className="w-5 h-5 text-cyan-500" />} />
            <StatsCard title="Revenue" value={formatCurrency(orgStats?.totalRevenue ?? 0)} icon={<DollarSign className="w-5 h-5 text-emerald-500" />} />
            <StatsCard title="Staff" value={orgStats?.totalUsers ?? 0} icon={<Users className="w-5 h-5 text-violet-500" />} />
            <StatsCard title="Plan" value={sub?.plan?.name ?? "—"} icon={<Crown className="w-5 h-5 text-amber-500" />} />
          </div>

          {sub && (
            <Card>
              <CardContent className="p-5 sm:p-6">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[var(--primary)]" />
                  Subscription Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Plan</p>
                    <p className="font-medium">{sub.plan?.name ?? "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Status</p>
                    <Badge variant={subBadge?.variant ?? "outline"}>{subBadge?.label ?? sub.status}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">
                      {sub.expiresAt ? "Expires" : "Trial Ends"}
                    </p>
                    <p className="font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                      {sub.expiresAt
                        ? new Date(sub.expiresAt).toLocaleDateString()
                        : sub.trialEndsAt
                        ? new Date(sub.trialEndsAt).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Started</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                      {sub.startsAt ? new Date(sub.startsAt).toLocaleDateString() : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-5 sm:p-6">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Banknote className="w-4 h-4 text-[var(--primary)]" />
                Payment History
              </h3>

              {paymentsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-xl bg-[var(--muted)] animate-pulse" />
                  ))}
                </div>
              ) : !payments || payments.length === 0 ? (
                <div className="text-center py-8 text-[var(--muted-foreground)]">
                  <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No payment submissions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((p) => {
                    const statusBadge = PAYMENT_STATUS_BADGE[p.status] ?? PAYMENT_STATUS_BADGE.PENDING;
                    const method = PAYMENT_METHOD_LABEL[p.paymentMethod];
                    return (
                      <div key={p.id} className="rounded-xl border border-[var(--border)] p-4 hover:bg-[var(--muted)]/30 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="h-10 w-10 rounded-lg bg-[var(--muted)] flex items-center justify-center shrink-0">
                              {method?.icon ?? <CreditCard className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">{method?.label ?? p.paymentMethod}</span>
                                <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                                {p.plan && <Badge variant="outline" className="text-[10px]">{p.plan.name}</Badge>}
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-[var(--muted-foreground)]">
                                {p.accountTitle && <span>Account: {p.accountTitle}</span>}
                                {p.transactionId && <span>TXN: {p.transactionId}</span>}
                                <span>{new Date(p.createdAt).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-lg font-bold tabular-nums">{formatCurrency(Number(p.amount))}</span>
                            <div className="flex gap-1.5">
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
                                    <CheckCircle2 className="h-3 w-3" />{approving ? "..." : "Approve"}
                                  </Button>
                                  <Button variant="outline" size="sm" className="h-8 gap-1 text-xs text-red-600"
                                    onClick={() => { setRejectTarget(p.id); setRejectNotes(""); }}>
                                    <XCircle className="h-3 w-3" />Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {p.reviewNotes && (
                          <div className="mt-3 p-2 rounded-lg bg-red-50 text-red-700 text-xs">
                            Rejection reason: {p.reviewNotes}
                          </div>
                        )}
                        {p.reviewedAt && (
                          <p className="mt-2 text-[10px] text-[var(--muted-foreground)]">
                            Reviewed on {new Date(p.reviewedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {orgUsers && orgUsers.length > 0 && (
            <Card>
              <CardContent className="p-5 sm:p-6">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[var(--primary)]" />
                  Staff Members ({orgUsers.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                        <th className="pb-2 pr-4">Name</th>
                        <th className="pb-2 pr-4">Email</th>
                        <th className="pb-2 pr-4">Role</th>
                        <th className="pb-2">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orgUsers.map((u) => (
                        <tr key={u.id} className="border-b border-[var(--border)] last:border-0">
                          <td className="py-2.5 pr-4 font-medium">{u.name}</td>
                          <td className="py-2.5 pr-4 text-[var(--muted-foreground)]">{u.email}</td>
                          <td className="py-2.5 pr-4">
                            <Badge variant="outline" className="text-[10px] capitalize">{u.role.replace("_", " ")}</Badge>
                          </td>
                          <td className="py-2.5 text-[var(--muted-foreground)]">{new Date(u.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
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
            <Input value={rejectNotes} onChange={(e) => setRejectNotes(e.target.value)} placeholder="e.g. Receipt unclear, amount mismatch..." />
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
