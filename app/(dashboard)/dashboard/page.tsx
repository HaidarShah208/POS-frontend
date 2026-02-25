"use client";

import dynamic from "next/dynamic";
import { PageLoader } from "@/components/shared/PageLoader";

const DashboardView = dynamic(
  () => import("@/features/dashboard/DashboardView").then((m) => ({ default: m.DashboardView })),
  { loading: () => <PageLoader />, ssr: false }
);

export default function DashboardPage() {
  return <DashboardView />;
}
