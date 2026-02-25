"use client";

import dynamic from "next/dynamic";
import { PageLoader } from "@/components/shared/PageLoader";

const ProductsView = dynamic(
  () => import("@/features/products/ProductsView").then((m) => ({ default: m.ProductsView })),
  { loading: () => <PageLoader />, ssr: false }
);

export default function ProductsPage() {
  return <ProductsView />;
}
