"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Hero from "@/components/home/Hero";
import PromoBanners from "@/components/home/PromoBanners";
import TrustBadges from "@/components/home/TrustBadges";
import ProductCard from "@/components/product/ProductCard";
import { productService } from "@/services/product.service";

export default function Storefront() {
  const [activeTab, setActiveTab] = useState("new"); // new, best, sale
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getProducts();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on active tab
  const getFilteredProducts = () => {
    if (activeTab === "sale") {
      // Products with discount (originalPrice is present)
      return products.filter(
        (p) => p.originalPrice !== null && p.originalPrice !== undefined,
      );
    }
    if (activeTab === "best") {
      // Simulating best sellers (or fallback to showing custom products)
      return products.filter((p) => p.type === "MADE_TO_ORDER");
    }
    // "new" or default list (sorted newest first)
    return [...products].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  };

  const filteredProducts = getFilteredProducts();

  return (
    <div className="min-h-screen bg-[#FFF9FA] text-[#3B262B] font-sans antialiased">
      {/* 2. Hero Section */}
      <Hero />

      {/* 3. Promo Banners Grid */}
      <PromoBanners />

      {/* 4. Trust Guarantee Badges */}
      <TrustBadges />

      {/* 5. Filter Category Tabs */}
      <section className="font-anuphan max-w-[1440px] mx-auto px-6 pt-16 pb-8 flex justify-center gap-8 border-b border-[#FADCE3]">
        <button
          onClick={() => setActiveTab("new")}
          className={`pb-2 text-base font-extrabold uppercase tracking-widest transition-all cursor-pointer ${
            activeTab === "new"
              ? "text-[#E87A90] border-b-2 border-[#E87A90]"
              : "text-[#777777] hover:text-[#3B262B]"
          }`}
        >
          มาใหม่
        </button>
        <button
          onClick={() => setActiveTab("best")}
          className={`pb-2 text-base font-extrabold uppercase tracking-widest transition-all cursor-pointer ${
            activeTab === "best"
              ? "text-[#E87A90] border-b-2 border-[#E87A90]"
              : "text-[#777777] hover:text-[#3B262B]"
          }`}
        >
          สั่งทำพิเศษ
        </button>
        <button
          onClick={() => setActiveTab("sale")}
          className={`pb-2 text-base font-extrabold uppercase tracking-widest transition-all cursor-pointer ${
            activeTab === "sale"
              ? "text-[#E87A90] border-b-2 border-[#E87A90]"
              : "text-[#777777] hover:text-[#3B262B]"
          }`}
        >
          ลดราคา
        </button>
      </section>

      {/* 6. Products Catalog Grid */}
      <section className="max-w-[1440px] mx-auto px-6 py-12">
        {loading ? (
          <div className="text-center py-20 text-zinc-400 font-medium font-anuphan">
            <span className="inline-block w-8 h-8 border-4 border-[#E87A90]/25 border-t-[#E87A90] rounded-full animate-spin mb-4" />
            <p>กำลังโหลดสินค้าแนะนำสำหรับคุณ...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-zinc-400 font-medium font-anuphan border border-dashed border-[#FADCE3] rounded-2xl bg-white/70">
            <span className="text-4xl block mb-3">🎀</span>
            <p>ยังไม่มีสินค้าในหมวดหมู่นี้ในขณะนี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {filteredProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}