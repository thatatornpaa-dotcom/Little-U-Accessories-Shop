"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductsTab from "../../../components/dashboard/ProductsTab";

function ProductsContent() {
  const searchParams = useSearchParams();
  const status = (searchParams.get("status") || "").toUpperCase();
  const initialStatus = ["VISIBLE", "HIDDEN", "SUSPENDED"].includes(status)
    ? status
    : "";

  return <ProductsTab initialStatus={initialStatus} />;
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center p-12">
          <span className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand/20 border-t-brand" />
          <span className="text-sm text-gray-500">กำลังโหลดรายการสินค้า...</span>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
