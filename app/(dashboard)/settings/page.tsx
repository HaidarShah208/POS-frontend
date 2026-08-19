"use client";

import dynamic from "next/dynamic";
import { PageLoader } from "@/components/shared/PageLoader";
import { RoleGuard } from "@/components/auth/RoleGuard";

const SettingsView = dynamic(
  () => import("@/features/settings/SettingsView").then((m) => ({ default: m.SettingsView })),
  { loading: () => <PageLoader />, ssr: false }
);

export default function SettingsPage() {
  return (
    <RoleGuard permission="settings">
      <SettingsView />
    </RoleGuard>
  );
}
