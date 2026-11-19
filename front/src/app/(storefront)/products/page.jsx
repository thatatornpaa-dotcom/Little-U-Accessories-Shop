"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProductGrid from "@/components/product/ProductGrid";
import ProductFilter from "@/components/product/ProductFilter";
import { productService } from "@/services/product.service";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [type, setType] = useState("all");

  useEffect(() => {
    // Read category and type from URL parameters if present
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlCategory = params.get("category");
      const urlType = params.get("type");
      if (urlCategory) setCategory(urlCategory);
      if (urlType) setType(urlType);
    }

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await productService.getProducts();
        if (data.success) {
          setProducts(data.products || data);
        } else {
          setProducts(data);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError(err.message || "ไม่สามารถโหลดสินค้าได้");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const actualProducts = Array.isArray(products)
      ? products
      : products.products && Array.isArray(products.products)
      ? products.products
      : [];

    return actualProducts.filter((product) => {
      const matchSearch = product.name
        ? product.name.toLowerCase().includes(search.toLowerCase())
        : false;

      // Normalize category comparison and allow name-based fallback matching
      const matchCategory =
        category === "all" ||
        product.category?.toLowerCase() === category.toLowerCase() ||
        (category === "anklet" &&
          product.name?.toLowerCase().includes("anklet")) ||
        (category === "bracelet" &&
          product.name?.toLowerCase().includes("bracelet"));

      const matchType = type === "all" || product.type === type;

      return matchSearch && matchCategory && matchType;
    });
  }, [products, search, category, type]);

  return (
    <main className="min-h-screen bg-[#FFF9FA]">
      {/* Hero */}
      <section className="bg-gradient-to-r from-[#FFF5F7] to-[#FCE8ED] border-b border-[#FADCE3]">
        <div className="max-w-[1440px] mx-auto px-6 py-16">
          <p className="uppercase tracking-[5px] text-[#E87A90] font-bold text-xs">
            Little U Accessories Shop
          </p>

          <h1 className="text-5xl font-black mt-4 text-[#3B262B]">ร้านค้า</h1>

          <p className="mt-4 text-zinc-600 max-w-2xl leading-7">
            เลือกชมเครื่องประดับและแอคเซสเซอรีน่ารักๆ จากคอลเลกชันของ Little U
            ทั้งสินค้าพร้อมส่งและสั่งทำพิเศษที่สามารถออกแบบได้ตามสไตล์ของคุณ
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="max-w-[1440px] mx-auto px-6 pt-8 text-sm text-zinc-500">
        <div className="flex items-center gap-2 font-anuphan">
          <Link href="/" className="text-[#E87A90] font-bold hover:underline">
            หน้าแรก
          </Link>
          <span>/</span>
          <span className="text-[#3B262B] font-bold">ร้านค้า</span>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 py-10">
        {/* Filter */}
        <ProductFilter
          search={search}
          setSearch={setSearch}
          category={category}
          setCategory={setCategory}
          type={type}
          setType={setType}
        />

        <div className="mt-10">
          {loading && (
            <div className="text-center py-20 text-zinc-400 font-medium font-anuphan">
              <span className="inline-block w-8 h-8 border-4 border-[#E87A90]/25 border-t-[#E87A90] rounded-full animate-spin mb-4" />
              <p>กำลังโหลดสินค้า...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-20 text-red-500 font-medium font-anuphan">
              เกิดข้อผิดพลาด: {error}
            </div>
          )}

          {!loading && !error && <ProductGrid products={filteredProducts} />}
        </div>
      </div>
    </main>
  );
}