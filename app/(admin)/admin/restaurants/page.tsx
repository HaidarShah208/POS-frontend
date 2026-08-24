"use client";

import { useState } from "react";
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
import {
  Search,
  Store,
  Building2,
  LayoutDashboard,
  CreditCard,
  LogOut,
  Play,
  Pause,
  Ban,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  trial: "bg-amber-100 text-amber-700",
  suspended: "bg-red-100 text-red-700",
  inactive: "bg-gray-100 text-gray-600",
};

export default function RestaurantsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const { data, isLoading } = useGetOrganizationsQuery({
    page,
    limit: 10,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const [updateStatus] = useUpdateOrganizationStatusMutation();

  const handleLogout = () => {
    dispatch(logout());
    dispatch(baseApi.util.resetApiState());
    saveAuthToStorage(null);
    router.push("/auth/login");
  };

  const handleStatusChange = async (orgId: string, status: string) => {
    await updateStatus({ id: orgId, status });
    setActionMenuId(null);
  };

  return (
    <PageMotion>
      <div className="min-h-screen bg-[var(--muted)]">
        <header className="bg-[var(--card)] border-b border-[var(--border)] px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--primary)] flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-[var(--foreground)]">Platform Admin</h1>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/admin" className="text-sm text-[var(--text-secondary)] hover:text-[var(--foreground)] px-3 py-1.5 rounded-lg hover:bg-[var(--muted)]">
                Dashboard
              </Link>
              <Link href="/admin/restaurants" className="text-sm font-medium text-[var(--primary)] px-3 py-1.5 rounded-lg bg-[var(--primary)]/10">
                <Store className="w-4 h-4 inline mr-1" />
                Restaurants
              </Link>
              <Link href="/admin/subscriptions" className="text-sm text-[var(--text-secondary)] hover:text-[var(--foreground)] px-3 py-1.5 rounded-lg hover:bg-[var(--muted)]">
                <CreditCard className="w-4 h-4 inline mr-1" />
                Subscriptions
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50">
                <LogOut className="w-4 h-4" />
              </button>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[var(--foreground)]">Restaurants</h2>
              <p className="text-[var(--text-secondary)] mt-1">Manage all registered restaurants</p>
            </div>
            <div className="text-sm text-[var(--text-secondary)]">{user?.email}</div>
          </div>

          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  placeholder="Search restaurants..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-[var(--text-secondary)]">Loading...</div>
            ) : !data?.data?.length ? (
              <div className="p-12 text-center">
                <Building2 className="w-12 h-12 mx-auto text-[var(--text-secondary)] mb-3" />
                <p className="text-[var(--text-secondary)]">No restaurants found</p>
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                      <th className="px-6 py-3">Restaurant</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Plan</th>
                      <th className="px-6 py-3">Users</th>
                      <th className="px-6 py-3">Created</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {data.data.map((org) => (
                      <tr key={org.id} className="hover:bg-[var(--muted)]/50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-[var(--foreground)]">{org.name}</p>
                            <p className="text-xs text-[var(--text-secondary)]">{org.email || org.slug}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[org.status] || STATUS_COLORS.inactive}`}>
                            {org.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                          {org.subscription?.plan?.name || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                          {String((org as unknown as Record<string, unknown>).userCount ?? "—")}
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                          {new Date(org.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right relative">
                          <button
                            onClick={() => setActionMenuId(actionMenuId === org.id ? null : org.id)}
                            className="p-1.5 rounded-lg hover:bg-[var(--muted)] text-[var(--text-secondary)]"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {actionMenuId === org.id && (
                            <div className="absolute right-6 top-full mt-1 w-48 bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-lg z-10 py-1">
                              {org.status !== "active" && (
                                <button onClick={() => handleStatusChange(org.id, "active")} className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] flex items-center gap-2 text-emerald-600">
                                  <Play className="w-4 h-4" /> Activate
                                </button>
                              )}
                              {org.status !== "suspended" && (
                                <button onClick={() => handleStatusChange(org.id, "suspended")} className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] flex items-center gap-2 text-amber-600">
                                  <Pause className="w-4 h-4" /> Suspend
                                </button>
                              )}
                              {org.status !== "inactive" && (
                                <button onClick={() => handleStatusChange(org.id, "inactive")} className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] flex items-center gap-2 text-red-600">
                                  <Ban className="w-4 h-4" /> Deactivate
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {data.totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between">
                    <p className="text-sm text-[var(--text-secondary)]">
                      Page {data.page} of {data.totalPages} ({data.total} total)
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="p-2 rounded-lg border border-[var(--border)] disabled:opacity-30"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                        disabled={page >= data.totalPages}
                        className="p-2 rounded-lg border border-[var(--border)] disabled:opacity-30"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </PageMotion>
  );
}
