"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { logout, saveAuthToStorage } from "@/redux/api/auth/authSlice";
import { baseApi } from "@/redux/api/baseApi";
import {
  useGetOrganizationsQuery,
  useUpdateOrganizationStatusMutation,
} from "@/redux/api/adminEndpoints";
import { PageMotion } from "@/components/shared/PageMotion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Search, Store, Building2, LayoutDashboard, CreditCard,
  LogOut, Play, Pause, Ban, MoreVertical, ChevronLeft,
  ChevronRight, Menu, X, Loader2,
} from "lucide-react";

const STATUS_BADGE: Record<string, { variant: "success" | "warning" | "destructive" | "outline"; label: string }> = {
  active: { variant: "success", label: "Active" },
  trial: { variant: "warning", label: "Trial" },
  suspended: { variant: "destructive", label: "Suspended" },
  inactive: { variant: "outline", label: "Inactive" },
};

export default function RestaurantsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useGetOrganizationsQuery({
    page, limit: 10,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const [updateStatus] = useUpdateOrganizationStatusMutation();

  useEffect(() => {
    if (!actionMenuId) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActionMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [actionMenuId]);

  const handleLogout = () => {
    setLoggingOut(true);
    setTimeout(() => {
      dispatch(logout());
      dispatch(baseApi.util.resetApiState());
      saveAuthToStorage(null);
      router.push("/auth/login");
    }, 600);
  };

  const handleStatusChange = async (orgId: string, status: string) => {
    await updateStatus({ id: orgId, status });
    setActionMenuId(null);
  };

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
              <Link href="/admin/restaurants" className="text-sm font-medium text-[var(--primary)] px-3 py-1.5 rounded-lg bg-[var(--primary)]/10">
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
              <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] px-3 py-2 rounded-lg hover:bg-[var(--muted)]">
                <LayoutDashboard className="w-4 h-4" />Dashboard
              </Link>
              <Link href="/admin/restaurants" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-sm font-medium text-[var(--primary)] px-3 py-2 rounded-lg bg-[var(--primary)]/10">
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

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Restaurants</h2>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Manage all registered restaurants</p>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] hidden sm:block">{user?.email}</p>
          </div>

          <Card>
            <div className="p-3 sm:p-4 border-b border-[var(--border)] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                <Input
                  placeholder="Search restaurants..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-[var(--muted-foreground)]">Loading...</div>
            ) : !data?.data?.length ? (
              <div className="p-12 text-center">
                <Building2 className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-3" />
                <p className="text-[var(--muted-foreground)]">No restaurants found</p>
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                        <th className="px-6 py-3">Restaurant</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Plan</th>
                        <th className="px-6 py-3">Users</th>
                        <th className="px-6 py-3">Created</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {data.data.map((org) => {
                        const sb = STATUS_BADGE[org.status] ?? STATUS_BADGE.inactive;
                        return (
                          <tr key={org.id} className="hover:bg-[var(--muted)]/50 transition-colors">
                            <td className="px-6 py-4">
                              <Link href={`/admin/restaurants/${org.id}`} className="hover:opacity-70 transition-opacity">
                                <p className="font-medium text-sm text-[var(--primary)]">{org.name}</p>
                                <p className="text-xs text-[var(--muted-foreground)]">{org.email || org.slug}</p>
                              </Link>
                            </td>
                            <td className="px-6 py-4"><Badge variant={sb.variant}>{sb.label}</Badge></td>
                            <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">{org.subscription?.plan?.name || "—"}</td>
                            <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">{String((org as unknown as Record<string, unknown>).userCount ?? "—")}</td>
                            <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">{new Date(org.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="relative inline-block" ref={actionMenuId === org.id ? menuRef : undefined}>
                                <button onClick={() => setActionMenuId(actionMenuId === org.id ? null : org.id)} className="p-1.5 rounded-lg hover:bg-[var(--muted)]">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                {actionMenuId === org.id && (
                                  <div className="fixed z-50 w-48 bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-lg py-1"
                                    ref={(el) => {
                                      if (!el) return;
                                      const btn = el.parentElement?.querySelector("button");
                                      if (!btn) return;
                                      const rect = btn.getBoundingClientRect();
                                      const menuH = el.offsetHeight;
                                      const spaceBelow = window.innerHeight - rect.bottom - 8;
                                      const top = spaceBelow >= menuH
                                        ? rect.bottom + 4
                                        : rect.top - menuH - 4;
                                      el.style.top = `${Math.max(8, top)}px`;
                                      el.style.left = `${rect.right - el.offsetWidth}px`;
                                    }}
                                  >
                                    <Link href={`/admin/restaurants/${org.id}`} className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] flex items-center gap-2 text-[var(--foreground)]">
                                      <Building2 className="w-4 h-4" />View Details
                                    </Link>
                                    {org.status !== "active" && (
                                      <button onClick={() => handleStatusChange(org.id, "active")} className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] flex items-center gap-2 text-emerald-600">
                                        <Play className="w-4 h-4" />Activate
                                      </button>
                                    )}
                                    {org.status !== "suspended" && (
                                      <button onClick={() => handleStatusChange(org.id, "suspended")} className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] flex items-center gap-2 text-amber-600">
                                        <Pause className="w-4 h-4" />Suspend
                                      </button>
                                    )}
                                    {org.status !== "inactive" && (
                                      <button onClick={() => handleStatusChange(org.id, "inactive")} className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] flex items-center gap-2 text-red-600">
                                        <Ban className="w-4 h-4" />Deactivate
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden divide-y divide-[var(--border)]">
                  {data.data.map((org) => {
                    const sb = STATUS_BADGE[org.status] ?? STATUS_BADGE.inactive;
                    return (
                      <div key={org.id} className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1 mr-3">
                            <p className="font-medium text-sm truncate">{org.name}</p>
                            <p className="text-xs text-[var(--muted-foreground)] truncate">{org.email || org.slug}</p>
                          </div>
                          <Badge variant={sb.variant}>{sb.label}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                          <span>Plan: {org.subscription?.plan?.name || "—"}</span>
                          <span>{new Date(org.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex gap-2">
                          {org.status !== "active" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-emerald-600" onClick={() => handleStatusChange(org.id, "active")}>
                              <Play className="w-3 h-3" />Activate
                            </Button>
                          )}
                          {org.status !== "suspended" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-amber-600" onClick={() => handleStatusChange(org.id, "suspended")}>
                              <Pause className="w-3 h-3" />Suspend
                            </Button>
                          )}
                          {org.status !== "inactive" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-red-600" onClick={() => handleStatusChange(org.id, "inactive")}>
                              <Ban className="w-3 h-3" />Deactivate
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {data.totalPages > 1 && (
                  <div className="px-4 sm:px-6 py-4 border-t border-[var(--border)] flex items-center justify-between">
                    <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
                      Page {data.page} of {data.totalPages} ({data.total} total)
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </main>
      </div>
    </PageMotion>
  );
}
