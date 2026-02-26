"use client";

import { useAppSelector } from "@/hooks/redux";
import { hasPermission, type Permission } from "@/lib/permissions";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type RoleGuardProps = {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function RoleGuard(props: RoleGuardProps) {
  const user = useAppSelector((s) => s.auth?.user);
  const allowed = user && hasPermission(user.role, props.permission);
  if (allowed) return <>{props.children}</>;
  if (props.fallback) return <>{props.fallback}</>;
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8 text-center">
      <h2 className="text-xl font-semibold">Access Denied</h2>
      <p className="text-[var(--muted-foreground)] max-w-sm">
        You don&apos;t have permission to view this page.
      </p>
      <Button asChild variant="outline">
        <Link href="/dashboard">Go to Dashboard</Link>
      </Button>
    </div>
  );
}
