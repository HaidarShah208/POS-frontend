"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/hooks/redux";
import { logout, saveAuthToStorage } from "@/redux/api/auth/authSlice";
import { useGetOrganizationsQuery } from "@/redux/api/adminEndpoints";
import { PageMotion } from "@/components/shared/PageMotion";
import {
  Store,
  LayoutDashboard,
  CreditCard,
  LogOut,
  Clock,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  trialing: "bg-amber-100 text-amber-700",
  active: "bg-emerald-100 text-emerald-700",
  past_due: "bg-orange-100 text-orange-700",
  cancelled: "bg-gray-100 text-gray-600",
  expired: "bg-red-100 text-red-700",
  suspended: "bg-red-100 text-red-700",
};

export default function SubscriptionsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { data, isLoading } = useGetOrganizationsQuery({ limit: 100 });

  const handleLogout = () => {
    dispatch(logout());
    saveAuthToStorage(null);
    router.push("/auth/login");
  };

  const orgsWithSubs = data?.data?.filter((o) => o.subscription) ?? [];

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
              <Link href="/admin/restaurants" className="text-sm text-[var(--text-secondary)] hover:text-[var(--foreground)] px-3 py-1.5 rounded-lg hover:bg-[var(--muted)]">
                <Store className="w-4 h-4 inline mr-1" />
                Restaurants
              </Link>
              <Link href="/admin/subscriptions" className="text-sm font-medium text-[var(--primary)] px-3 py-1.5 rounded-lg bg-[var(--primary)]/10">
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
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">Subscriptions</h2>
            <p className="text-[var(--text-secondary)] mt-1">Manage restaurant subscription statuses</p>
          </div>

          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-[var(--text-secondary)]">Loading...</div>
            ) : !orgsWithSubs.length ? (
              <div className="p-12 text-center">
                <CreditCard className="w-12 h-12 mx-auto text-[var(--text-secondary)] mb-3" />
                <p className="text-[var(--text-secondary)]">No subscriptions found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                    <th className="px-6 py-3">Restaurant</th>
                    <th className="px-6 py-3">Plan</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Trial Ends</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {orgsWithSubs.map((org) => (
                    <tr key={org.id} className="hover:bg-[var(--muted)]/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-[var(--foreground)]">{org.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{org.slug}</p>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {org.subscription?.plan?.name || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[org.subscription?.status || ""] || "bg-gray-100 text-gray-600"}`}>
                          {org.subscription?.status || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                        {org.subscription?.trialEndsAt ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(org.subscription.trialEndsAt).toLocaleDateString()}
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </PageMotion>
  );
}
