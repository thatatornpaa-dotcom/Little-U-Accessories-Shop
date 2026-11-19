"use client";

import { useCallback, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  moderationService,
  productService,
} from "../../../../services/api";
import ProductForm from "../../../../components/dashboard/ProductForm";

function EditProductForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [initialValues, setInitialValues] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadProductDetails = useCallback(async () => {
    if (!id) return;
    try {
      setLoadingProduct(true);
      const res = await moderationService.getProductById(id);
      if (res.success && res.product) {
        setInitialValues({
          name: res.product.name,
          description: res.product.description || "",
          price: parseFloat(res.product.price),
          stock: res.product.stock,
          type: res.product.type,
          category: res.product.category || "BRACELET",
          images: res.product.images ? res.product.images.map(img => img.url) : [],
          customOptions: res.product.customOptions ? res.product.customOptions.map(opt => ({
            name: opt.name,
            required: opt.isRequired !== undefined ? opt.isRequired : true,
            values: opt.values ? opt.values.map(v => ({ name: v.value, priceAdjustment: parseFloat(v.priceAdjustment) || 0 })) : []
          })) : [],
          accessories: res.product.accessories ? res.product.accessories.map(acc => acc.accessoryId || acc.accessory?.id) : []
        });
      }
    } catch (err) {
      alert("โหลดข้อมูลสินค้าล้มเหลว: " + err.message);
      router.push("/dashboard/products");
    } finally {
      setLoadingProduct(false);
    }
  }, [id, router]);

  useEffect(() => {
    const timer = setTimeout(() => loadProductDetails(), 0);
    return () => clearTimeout(timer);
  }, [loadProductDetails]);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      const res = await productService.updateProduct(id, payload);
      if (res.success) {
        router.push("/dashboard/products");
      }
    } catch (err) {
      alert(err.message || "Failed to update product");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProduct || !initialValues) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <span className="w-8 h-8 border-4 border-brand/20 border-t-brand rounded-full animate-spin mb-4" />
        <span className="text-sm text-gray-500">กำลังโหลดรายละเอียดสินค้า...</span>
      </div>
    );
  }

  return (
    <ProductForm
      initialValues={initialValues}
      onSubmit={handleSubmit}
      submitting={submitting}
      title="แก้ไขข้อมูลสินค้า"
      subtitle="อัปเดตรายละเอียดสินค้าในระบบ"
      submitText="อัปเดตสินค้า"
    />
  );
}

export default function EditProductPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center p-12">
        <span className="w-8 h-8 border-4 border-brand/20 border-t-brand rounded-full animate-spin mb-4" />
        <span className="text-sm text-gray-500">กำลังโหลดรายละเอียดสินค้า...</span>
      </div>
    }>
      <EditProductForm />
    </Suspense>
  );
}
