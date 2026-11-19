"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { productService } from "../../../../services/api";
import ProductForm from "../../../../components/dashboard/ProductForm";

export default function CreateProductPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      const res = await productService.createProduct(payload);
      if (res.success) {
        router.push("/dashboard/products");
      }
    } catch (err) {
      alert(err.message || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProductForm
      onSubmit={handleSubmit}
      submitting={submitting}
      title="เพิ่มสินค้าใหม่"
      subtitle="ออกแบบและลงข้อมูลคลังสินค้าของท่าน"
      submitText="บันทึกสินค้า"
    />
  );
}
