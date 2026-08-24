"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import { logout, saveAuthToStorage } from "@/redux/api/auth/authSlice";
import { baseApi } from "@/redux/api/baseApi";
import { useGetPlatformStatsQuery } from "@/redux/api/adminEndpoints";
import { PageMotion } from "@/components/shared/PageMotion";
import { StatsCard } from "@/components/admin/StatsCard";
import {
  Building2,
  Users,
  ShoppingCart,
  DollarSign,
  Play,
  AlertTriangle,
  Pause,
  LogOut,
  Store,
  LayoutDashboard,
  CreditCard,
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { data: stats, isLoading } = useGetPlatformStatsQuery();

  const handleLogout = () => {
    dispatch(logout());
    dispatch(baseApi.util.resetApiState());
    saveAuthToStorage(null);
    router.push("/auth/login");
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
              <div>
                <h1 className="text-lg font-bold text-[var(--foreground)]">Platform Admin</h1>
                <p className="text-xs text-[var(--text-secondary)]">{user?.email}</p>
              </div>
            </div>
            <nav className="flex items-center gap-4">
              <Link
                href="/admin"
                className="text-sm font-medium text-[var(--primary)] px-3 py-1.5 rounded-lg bg-[var(--primary)]/10"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/restaurants"
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] px-3 py-1.5 rounded-lg hover:bg-[var(--muted)]"
              >
                <Store className="w-4 h-4 inline mr-1" />
                Restaurants
              </Link>
              <Link
                href="/admin/subscriptions"
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] px-3 py-1.5 rounded-lg hover:bg-[var(--muted)]"
              >
                <CreditCard className="w-4 h-4 inline mr-1" />
                Subscriptions
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">Platform Overview</h2>
            <p className="text-[var(--text-secondary)] mt-1">
              Monitor all restaurants and platform activity
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-32 rounded-2xl bg-[var(--card)] animate-pulse" />
              ))}
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                  title="Total Restaurants"
                  value={stats.totalOrganizations}
                  icon={<Building2 className="w-5 h-5 text-blue-500" />}
                />
                <StatsCard
                  title="Active"
                  value={stats.activeOrganizations}
                  icon={<Play className="w-5 h-5 text-emerald-500" />}
                />
                <StatsCard
                  title="Trial"
                  value={stats.trialOrganizations}
                  icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
                />
                <StatsCard
                  title="Suspended"
                  value={stats.suspendedOrganizations}
                  icon={<Pause className="w-5 h-5 text-red-500" />}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatsCard
                  title="Total Users"
                  value={stats.totalUsers}
                  icon={<Users className="w-5 h-5 text-violet-500" />}
                />
                <StatsCard
                  title="Total Orders"
                  value={stats.totalOrders}
                  icon={<ShoppingCart className="w-5 h-5 text-cyan-500" />}
                />
                <StatsCard
                  title="Total Revenue"
                  value={`$${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                  icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-[var(--text-secondary)]">
              Failed to load platform stats
            </div>
          )}
        </main>
      </div>
    </PageMotion>
  );
}
