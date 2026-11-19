"use client";

import AccessoryCategoryManager from "@/components/dashboard/AccessoryCategoryManager";
import { useAuth } from "../../../../../context/AuthContext";
import { useRouter } from "next/navigation";


export default function AccessoryCategoriesPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (user?.role !== "admin") {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs w-full text-center text-gray-400 py-16">
        สิทธิ์การเข้าถึงถูกจำกัด — เฉพาะผู้ดูแลระบบเท่านั้น
      </div>
    );
  }

  return (
    <AccessoryCategoryManager onBack={() => router.push("/dashboard/settings/categories")} />
  );
}
