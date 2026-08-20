"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageMotion } from "@/components/shared/PageMotion";
import { StatsCard } from "@/components/admin/StatsCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose,
} from "@/components/ui/drawer";
import {
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} from "@/redux/api/rolesEndpoints";
import { ALL_PERMISSIONS, type Permission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { RoleDefinition } from "@/types/api/index";
import {
  Shield, Plus, X, Save, Trash2, Lock, ChevronRight,
  Users, Check, ShieldCheck, Loader2,
} from "lucide-react";

const PERM_GROUPS = [...new Set(ALL_PERMISSIONS.map((p) => p.group))];

function RoleFormDrawer({
  open,
  onClose,
  role,
}: {
  open: boolean;
  onClose: () => void;
  role?: RoleDefinition;
}) {
  const [createRole, { isLoading: creating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: updating }] = useUpdateRoleMutation();
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [perms, setPerms] = useState<Set<string>>(new Set(role?.permissions ?? []));
  const isEdit = !!role;
  const isSaving = creating || updating;

  const togglePerm = (p: string) => {
    const next = new Set(perms);
    if (next.has(p)) next.delete(p); else next.add(p);
    setPerms(next);
  };

  const toggleGroup = (group: string) => {
    const groupPerms = ALL_PERMISSIONS.filter((p) => p.group === group).map((p) => p.id);
    const allSelected = groupPerms.every((p) => perms.has(p));
    const next = new Set(perms);
    groupPerms.forEach((p) => allSelected ? next.delete(p) : next.add(p));
    setPerms(next);
  };

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error("Role name is required"); return; }
    if (perms.size === 0) { toast.error("Select at least one permission"); return; }
    const permArr = Array.from(perms);
    try {
      if (isEdit) {
        await updateRole({ id: role.id, name: name.trim(), description: description.trim(), permissions: permArr }).unwrap();
        toast.success("Role updated");
      } else {
        await createRole({ name: name.trim(), description: description.trim(), permissions: permArr }).unwrap();
        toast.success("Role created");
      }
      onClose();
    } catch (err) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr?.data?.error || "Failed to save role");
    }
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-w-xl ml-auto h-full rounded-none border-l border-[var(--border)]">
        <DrawerHeader className="border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-bold">{isEdit ? "Edit Role" : "Create Custom Role"}</DrawerTitle>
            <DrawerClose asChild><Button variant="ghost" size="icon" className="h-8 w-8"><X className="h-4 w-4" /></Button></DrawerClose>
          </div>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Role Name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Inventory Manager" />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this role" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold">Permissions ({perms.size}/{ALL_PERMISSIONS.length})</h4>
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setPerms(new Set(ALL_PERMISSIONS.map((p) => p.id)))}>Select All</Button>
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setPerms(new Set())}>Clear</Button>
              </div>
            </div>
            <div className="space-y-4">
              {PERM_GROUPS.map((group) => {
                const groupPerms = ALL_PERMISSIONS.filter((p) => p.group === group);
                const allSelected = groupPerms.every((p) => perms.has(p.id));
                const someSelected = groupPerms.some((p) => perms.has(p.id));
                return (
                  <div key={group} className="rounded-xl border border-[var(--border)] overflow-hidden">
                    <button type="button" onClick={() => toggleGroup(group)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-[var(--muted)]/30">
                      <div className={cn("flex h-5 w-5 items-center justify-center rounded border text-xs transition-colors",
                        allSelected ? "bg-[var(--primary)] border-[var(--primary)] text-white" : someSelected ? "border-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)]")}>
                        {allSelected && <Check className="h-3 w-3" />}
                        {someSelected && !allSelected && <div className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />}
                      </div>
                      <span className="text-sm font-semibold">{group}</span>
                      <span className="text-[10px] text-[var(--muted-foreground)] ml-auto">{groupPerms.filter((p) => perms.has(p.id)).length}/{groupPerms.length}</span>
                    </button>
                    <div className="border-t border-[var(--border)] px-4 py-2 grid grid-cols-2 gap-1.5">
                      {groupPerms.map((p) => (
                        <button key={p.id} type="button" onClick={() => togglePerm(p.id)}
                          className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all text-left",
                            perms.has(p.id) ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "hover:bg-[var(--muted)]/50 text-[var(--muted-foreground)]")}>
                          <div className={cn("flex h-4 w-4 items-center justify-center rounded border text-[10px] shrink-0",
                            perms.has(p.id) ? "bg-[var(--primary)] border-[var(--primary)] text-white" : "border-[var(--border)]")}>
                            {perms.has(p.id) && <Check className="h-2.5 w-2.5" />}
                          </div>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="shrink-0 border-t border-[var(--border)] px-6 py-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSaving} className="gap-1.5">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? "Update" : "Create"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default function RolesPage() {
  const { data: roles = [], isLoading } = useGetRolesQuery();
  const [deleteRole] = useDeleteRoleMutation();
  const [formOpen, setFormOpen] = useState(false);
  const [editRole, setEditRole] = useState<RoleDefinition | undefined>();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const systemRoles = useMemo(() => roles.filter((r) => r.isSystem), [roles]);
  const customRoles = useMemo(() => roles.filter((r) => !r.isSystem), [roles]);

  const handleDelete = async (id: string) => {
    try {
      await deleteRole(id).unwrap();
      toast.success("Role deleted");
      setExpandedId(null);
    } catch (err) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr?.data?.error || "Failed to delete role");
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
    <RoleGuard permission="roles">
      <PageMotion>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
            <p className="text-sm text-[var(--muted-foreground)]">Manage access control for your team</p>
          </div>
          <Button onClick={() => { setEditRole(undefined); setFormOpen(true); }} className="gap-2 shrink-0 mt-2 sm:mt-0">
            <Plus className="h-4 w-4" />Create Role
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="System Roles" value={systemRoles.length} icon={<ShieldCheck className="h-5 w-5" />} />
          <StatsCard title="Custom Roles" value={customRoles.length} animate icon={<Shield className="h-5 w-5" />} />
          <StatsCard title="Total Permissions" value={ALL_PERMISSIONS.length} icon={<Lock className="h-5 w-5" />} />
          <StatsCard title="Permission Groups" value={PERM_GROUPS.length} icon={<Users className="h-5 w-5" />} />
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold">All Roles</h2>
          <AnimatePresence mode="popLayout">
            {roles.map((role) => {
              const isExpanded = expandedId === role.id;
              return (
                <motion.div key={role.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                    <button type="button" onClick={() => setExpandedId(isExpanded ? null : role.id)}
                      className="w-full flex items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-[var(--muted)]/30">
                      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                        role.isSystem ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600")}>
                        {role.isSystem ? <ShieldCheck className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{role.name}</span>
                          <Badge className={cn("text-[10px]", role.isSystem ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700")}>
                            {role.isSystem ? "System" : "Custom"}
                          </Badge>
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{role.description}</p>
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)] shrink-0">{role.permissions.length} permissions</span>
                      <ChevronRight className={cn("h-4 w-4 text-[var(--muted-foreground)] shrink-0 transition-transform", isExpanded && "rotate-90")} />
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="border-t border-[var(--border)] px-4 py-4 space-y-3">
                            <div>
                              <p className="text-xs font-semibold text-[var(--muted-foreground)] mb-2">Permission Matrix</p>
                              <div className="space-y-2">
                                {PERM_GROUPS.map((group) => {
                                  const groupPerms = ALL_PERMISSIONS.filter((p) => p.group === group);
                                  const granted = groupPerms.filter((p) => role.permissions.includes(p.id));
                                  return (
                                    <div key={group}>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-medium">{group}</span>
                                        <span className="text-[10px] text-[var(--muted-foreground)]">{granted.length}/{groupPerms.length}</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {groupPerms.map((p) => {
                                          const has = role.permissions.includes(p.id);
                                          return (
                                            <Badge key={p.id} className={cn("text-[10px] gap-0.5",
                                              has ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600")}>
                                              {has ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                                              {p.label}
                                            </Badge>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            {!role.isSystem && (
                              <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
                                <Button size="sm" variant="outline" className="gap-1.5 text-xs"
                                  onClick={() => { setEditRole(role); setFormOpen(true); }}>
                                  <Shield className="h-3 w-3" />Edit
                                </Button>
                                <Button size="sm" variant="outline" className="gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => handleDelete(role.id)}>
                                  <Trash2 className="h-3 w-3" />Delete
                                </Button>
                              </div>
                            )}
                            {role.isSystem && (
                              <p className="text-[10px] text-[var(--muted-foreground)] italic flex items-center gap-1"><Lock className="h-3 w-3" />System roles cannot be modified</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {customRoles.length === 0 && (
          <EmptyState title="No custom roles" description="Create custom roles to fine-tune access control for your team." icon={<Shield className="h-6 w-6" />}
            action={<Button size="sm" onClick={() => { setEditRole(undefined); setFormOpen(true); }} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Create Role</Button>} />
        )}

        <RoleFormDrawer open={formOpen} onClose={() => { setFormOpen(false); setEditRole(undefined); }} role={editRole} />
      </PageMotion>
    </RoleGuard>
  );
}
