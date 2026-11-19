import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Little U Accessories Shop",
  description: "Small Things Make You Happier — Little U Accessories Shop",
};

/**
 * Layout ของฝั่ง Buyer / Storefront
 * - มี Header + Footer ของหน้าร้าน
 * - ไม่ใช้ร่วมกับ Seller Center (แยกที่ src/app/(seller))
 */
export default function StorefrontLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9FA] text-[#3B262B]">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}