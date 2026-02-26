"use client";

import dynamic from "next/dynamic";
import { PageLoader } from "@/components/shared/PageLoader";

const OnlineOrdersView = dynamic(
  () => import("@/features/online-orders/OnlineOrdersView").then((m) => ({ default: m.OnlineOrdersView })),
  { loading: () => <PageLoader />, ssr: false }
);

export default function OnlineOrdersPage() {
  return <OnlineOrdersView />;
}
