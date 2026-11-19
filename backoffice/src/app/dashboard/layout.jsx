"use client";

import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();

  // Determine activeTab based on pathname
  let activeTab = "dashboard";
  if (pathname.includes("/dashboard/shops")) activeTab = "shops";
  else if (pathname.includes("/dashboard/products")) activeTab = "products";
  else if (pathname.includes("/dashboard/customization")) activeTab = "customization";
  else if (pathname.includes("/dashboard/orders")) activeTab = "orders";
  else if (pathname.includes("/dashboard/customers")) activeTab = "customers";
  else if (pathname.includes("/dashboard/payouts")) activeTab = "payouts";
  else if (pathname.includes("/dashboard/staff")) activeTab = "staff";
  else if (pathname.includes("/dashboard/audit-logs")) activeTab = "audit-logs";
  else if (pathname.includes("/dashboard/settings")) activeTab = "settings";

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-600 font-sans">
        <span className="w-8 h-8 border-4 border-brand/20 border-t-brand rounded-full animate-spin mb-4" />
        <span className="text-sm font-medium">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  const tabTitles = {
    dashboard: "แผงควบคุม",
    shops: "ร้านค้า / อนุมัติร้าน",
    products: "รายการสินค้า",
    customization: "การปรับแต่งสินค้า (Customization)",
    orders: "รายการสั่งซื้อ",
    customers: "ข้อมูลลูกค้า",
    payouts: "คำขอถอนเงิน",
    staff: "จัดการพนักงาน",
    "audit-logs": "ประวัติการดำเนินการ",
    settings: "ตั้งค่าระบบ",
  };

  return (
    <div className="flex-1 flex h-screen max-h-screen bg-gray-50 text-gray-800 font-sans antialiased overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        user={user}
        activeTab={activeTab}
        logout={logout}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen max-h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-xs shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {tabTitles[activeTab] || "ระบบหลังบ้าน"}
            </h2>
          </div>
          <div className="text-sm font-medium text-gray-500">
            ยินดีต้อนรับ, <strong className="text-gray-800">{user?.firstName}</strong>
          </div>
        </header>

        {/* Dynamic Content Panel */}
        <div className="flex-1 p-8 overflow-y-auto flex flex-col min-h-0">
          {children}
        </div>
      </main>
    </div>
  );
}
