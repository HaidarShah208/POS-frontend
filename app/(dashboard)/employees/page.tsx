"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageMotion } from "@/components/shared/PageMotion";
import { StatsCard } from "@/components/admin/StatsCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose,
} from "@/components/ui/drawer";
import { useGetOrgUsersQuery, useDeleteUserMutation } from "@/redux/api/usersEndpoints";
import { useRegisterMutation } from "@/redux/api/authEndpoints";
import { useGetRolesQuery } from "@/redux/api/rolesEndpoints";
import { useGetBranchesQuery } from "@/redux/api/branchesEndpoints";
import { useAppSelector } from "@/hooks/redux";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  UserCog, Plus, Search, X, Trash2,
  Users, Shield, Eye, EyeOff, Loader2, Save, Mail,
} from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-amber-100 text-amber-700",
  admin: "bg-purple-100 text-purple-700",
  cashier: "bg-blue-100 text-blue-700",
  kitchen: "bg-orange-100 text-orange-700",
};

function StaffFormDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: roles = [], isLoading: rolesLoading } = useGetRolesQuery();
  const { data: branches = [] } = useGetBranchesQuery();
  const [registerUser, { isLoading: registering }] = useRegisterMutation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleSlug, setRoleSlug] = useState("");
  const [branchId, setBranchId] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const assignableRoles = useMemo(
    () => roles.filter((r) => !["super_admin", "owner"].includes(r.slug)),
    [roles]
  );

  useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setPassword("");
      setShowPassword(false);
      if (assignableRoles.length > 0) setRoleSlug(assignableRoles[0].slug);
      if (branches.length > 0) setBranchId(branches[0].id);
    }
  }, [open, assignableRoles, branches]);

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (!email.trim()) { toast.error("Email is required"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (!roleSlug || !branchId) { toast.error("Select role and branch"); return; }
    try {
      await registerUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: roleSlug,
        branchId,
      }).unwrap();
      toast.success(`Staff member "${name.trim()}" created`);
      onClose();
    } catch (err) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr?.data?.error || "Failed to create user");
    }
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-w-xl ml-auto h-full rounded-none border-l border-[var(--border)]">
        <DrawerHeader className="border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-bold">Add Staff Member</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><X className="h-4 w-4" /></Button>
            </DrawerClose>
          </div>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Full Name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ali Khan" />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Email *</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. ali@restaurant.com" />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Password *</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-[var(--muted-foreground)] mt-1">Staff will use this email & password to login</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Role *</label>
              {rolesLoading ? (
                <div className="h-10 rounded-lg border border-[var(--border)] flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--muted-foreground)]" />
                </div>
              ) : (
                <select
                  value={roleSlug}
                  onChange={(e) => setRoleSlug(e.target.value)}
                  className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                >
                  {assignableRoles.map((r) => (
                    <option key={r.id} value={r.slug}>
                      {r.name} {!r.isSystem ? "(Custom)" : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Branch *</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="shrink-0 border-t border-[var(--border)] px-6 py-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={registering} className="gap-1.5">
            {registering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {registering ? "Creating..." : "Create"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default function StaffPage() {
  const currentUser = useAppSelector((s) => s.auth?.user);
  const { data: users = [], isLoading } = useGetOrgUsersQuery();
  const { data: roles = [] } = useGetRolesQuery();
  const [deleteUser] = useDeleteUserMutation();
  const [formOpen, setFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const roleNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    roles.forEach((r) => { map[r.slug] = r.name; });
    return map;
  }, [roles]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase().trim();
    return users.filter((u) =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach((u) => { counts[u.role] = (counts[u.role] || 0) + 1; });
    return counts;
  }, [users]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget.id).unwrap();
      toast.success(`${deleteTarget.name} removed`);
      setDeleteTarget(null);
    } catch (err) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr?.data?.error || "Failed to delete user");
      setDeleteTarget(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  return (
    <RoleGuard permission="employees">
      <PageMotion>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Staff Management</h1>
            <p className="text-sm text-[var(--muted-foreground)]">Manage your team members and their access</p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="gap-2 shrink-0 mt-2 sm:mt-0">
            <Plus className="h-4 w-4" />Add Staff
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Staff" value={users.length} animate icon={<Users className="h-5 w-5" />} />
          <StatsCard title="Admins" value={roleCounts["admin"] ?? 0} icon={<Shield className="h-5 w-5" />} />
          <StatsCard title="Cashiers" value={roleCounts["cashier"] ?? 0} icon={<UserCog className="h-5 w-5" />} />
          <StatsCard title="Kitchen" value={roleCounts["kitchen"] ?? 0} icon={<UserCog className="h-5 w-5" />} />
        </div>

        {users.length > 0 && (
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email or role..."
              className="pl-9"
            />
          </div>
        )}

        {users.length === 0 ? (
          <EmptyState
            title="No staff members"
            description="Add your team members so they can log in and use the POS system."
            icon={<Users className="h-6 w-6" />}
            action={
              <Button size="sm" onClick={() => setFormOpen(true)} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />Add Staff
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filtered.map((user) => {
                const roleName = roleNameMap[user.role] || user.role;
                const colorClass = ROLE_COLORS[user.role] || "bg-gray-100 text-gray-700";
                const isSelf = user.id === currentUser?.id;
                const isOwner = user.role === "owner";
                return (
                  <motion.div
                    key={user.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3.5 transition-colors hover:bg-[var(--muted)]/20">
                      <div className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                        colorClass
                      )}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold truncate">{user.name}</span>
                          {isSelf && <Badge className="text-[10px] bg-emerald-100 text-emerald-700">You</Badge>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Mail className="h-3 w-3 text-[var(--muted-foreground)]" />
                          <span className="text-xs text-[var(--muted-foreground)] truncate">{user.email}</span>
                        </div>
                      </div>
                      <Badge className={cn("text-[10px] shrink-0", colorClass)}>
                        {roleName}
                      </Badge>
                      {user.createdAt && (
                        <span className="text-[10px] text-[var(--muted-foreground)] shrink-0 hidden sm:block">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      )}
                      {!isSelf && !isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-[var(--muted-foreground)] hover:text-red-600"
                          onClick={() => setDeleteTarget({ id: user.id, name: user.name })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {filtered.length === 0 && searchQuery && (
              <div className="py-10 text-center text-sm text-[var(--muted-foreground)]">
                No staff matching &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        )}

        <StaffFormDrawer open={formOpen} onClose={() => setFormOpen(false)} />

        <ConfirmDialog
          open={!!deleteTarget}
          title="Remove Staff Member"
          description={`Are you sure you want to remove "${deleteTarget?.name}"? They will no longer be able to log in.`}
          confirmLabel="Remove"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </PageMotion>
    </RoleGuard>
  );
}
