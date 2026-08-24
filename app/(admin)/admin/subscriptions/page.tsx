"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/hooks/redux";
import { logout, saveAuthToStorage } from "@/redux/api/auth/authSlice";
import { baseApi } from "@/redux/api/baseApi";
import { useGetOrganizationsQuery } from "@/redux/api/adminEndpoints";
import { PageMotion } from "@/components/shared/PageMotion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Store, LayoutDashboard, CreditCard, LogOut,
  Clock, Menu, X, Loader2,
} from "lucide-react";

const SUB_STATUS_BADGE: Record<string, { variant: "success" | "warning" | "destructive" | "outline"; label: string }> = {
  trialing: { variant: "warning", label: "Trial" },
  active: { variant: "success", label: "Active" },
  past_due: { variant: "destructive", label: "Past Due" },
  cancelled: { variant: "outline", label: "Cancelled" },
  expired: { variant: "destructive", label: "Expired" },
  suspended: { variant: "destructive", label: "Suspended" },
  pending_verification: { variant: "warning", label: "Pending Verification" },
};

const ORG_STATUS_BADGE: Record<string, { variant: "success" | "warning" | "destructive" | "outline"; label: string }> = {
  active: { variant: "success", label: "Active" },
  trial: { variant: "warning", label: "Trial" },
  suspended: { variant: "destructive", label: "Suspended" },
  inactive: { variant: "outline", label: "Inactive" },
};

export default function SubscriptionsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const { data, isLoading } = useGetOrganizationsQuery({ limit: 100 });

  const handleLogout = () => {
    setLoggingOut(true);
    setTimeout(() => {
      dispatch(logout());
      dispatch(baseApi.util.resetApiState());
      saveAuthToStorage(null);
      router.push("/auth/login");
    }, 600);
  };

  const orgsWithSubs = data?.data?.filter((o) => o.subscription) ?? [];

  return (
    <PageMotion>
      <div className="min-h-screen bg-[var(--muted)]">
        <header className="bg-[var(--card)] border-b border-[var(--border)] px-4 sm:px-6 py-3 sm:py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--primary)] flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-[var(--foreground)] hidden sm:block">Platform Admin</h1>
            </div>
            <nav className="hidden md:flex items-center gap-2">
              <Link href="/admin" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] px-3 py-1.5 rounded-lg hover:bg-[var(--muted)]">Dashboard</Link>
              <Link href="/admin/restaurants" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] px-3 py-1.5 rounded-lg hover:bg-[var(--muted)]">
                <Store className="w-4 h-4 inline mr-1" />Restaurants
              </Link>
              <Link href="/admin/subscriptions" className="text-sm font-medium text-[var(--primary)] px-3 py-1.5 rounded-lg bg-[var(--primary)]/10">
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
              <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] px-3 py-2 rounded-lg hover:bg-[var(--muted)]">
                <LayoutDashboard className="w-4 h-4" />Dashboard
              </Link>
              <Link href="/admin/restaurants" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] px-3 py-2 rounded-lg hover:bg-[var(--muted)]">
                <Store className="w-4 h-4" />Restaurants
              </Link>
              <Link href="/admin/subscriptions" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-sm font-medium text-[var(--primary)] px-3 py-2 rounded-lg bg-[var(--primary)]/10">
                <CreditCard className="w-4 h-4" />Subscriptions
              </Link>
              <button onClick={handleLogout} disabled={loggingOut} className="flex items-center gap-2 text-sm text-red-500 px-3 py-2 rounded-lg hover:bg-red-50 w-full text-left disabled:opacity-50">
                {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          )}
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Subscriptions</h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">Manage restaurant subscription statuses</p>
          </div>

          <Card>
            {isLoading ? (
              <div className="p-8 text-center text-[var(--muted-foreground)]">Loading...</div>
            ) : !orgsWithSubs.length ? (
              <div className="p-12 text-center">
                <CreditCard className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-3" />
                <p className="text-[var(--muted-foreground)]">No subscriptions found</p>
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                        <th className="px-6 py-3">Restaurant</th>
                        <th className="px-6 py-3">Current Plan</th>
                        <th className="px-6 py-3">Restaurant Status</th>
                        <th className="px-6 py-3">Validity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {orgsWithSubs.map((org) => {
                        const subBadge = SUB_STATUS_BADGE[org.subscription?.status || ""] ?? { variant: "outline" as const, label: org.subscription?.status || "—" };
                        const orgBadge = ORG_STATUS_BADGE[org.status] ?? ORG_STATUS_BADGE.inactive;
                        return (
                          <tr key={org.id} className="hover:bg-[var(--muted)]/50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-medium text-sm">{org.name}</p>
                              <p className="text-xs text-[var(--muted-foreground)]">{org.email || org.slug}</p>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="outline">{org.subscription?.plan?.name || "—"}</Badge>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant={orgBadge.variant}>{orgBadge.label}</Badge>
                            </td>
                        
                            <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">
                              {org.subscription?.expiresAt ? (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />Expires: {new Date(org.subscription.expiresAt).toLocaleDateString()}
                                </span>
                              ) : org.subscription?.trialEndsAt ? (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />Trial: {new Date(org.subscription.trialEndsAt).toLocaleDateString()}
                                </span>
                              ) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden divide-y divide-[var(--border)]">
                  {orgsWithSubs.map((org) => {
                    const subBadge = SUB_STATUS_BADGE[org.subscription?.status || ""] ?? { variant: "outline" as const, label: org.subscription?.status || "—" };
                    const orgBadge = ORG_STATUS_BADGE[org.status] ?? ORG_STATUS_BADGE.inactive;
                    return (
                      <div key={org.id} className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1 mr-3">
                            <p className="font-medium text-sm truncate">{org.name}</p>
                            <p className="text-xs text-[var(--muted-foreground)] truncate">{org.email || org.slug}</p>
                          </div>
                          <Badge variant={orgBadge.variant}>{orgBadge.label}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-[var(--muted-foreground)]">Plan:</span>
                            <Badge variant="outline" className="text-[10px]">{org.subscription?.plan?.name || "—"}</Badge>
                          </div>
                          <Badge variant={subBadge.variant} className="text-[10px]">{subBadge.label}</Badge>
                        </div>
                        {(org.subscription?.expiresAt || org.subscription?.trialEndsAt) && (
                          <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {org.subscription.expiresAt
                              ? `Expires: ${new Date(org.subscription.expiresAt).toLocaleDateString()}`
                              : `Trial: ${new Date(org.subscription.trialEndsAt!).toLocaleDateString()}`}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </Card>
        </main>
      </div>
    </PageMotion>
  );
}
