"use client";

import { useAuth } from "../../../../context/AuthContext";
import { useRouter } from "next/navigation";
import {
  ArrowRight01Icon,
  ArrowLeft01Icon,
  ShoppingBag01Icon,
} from "hugeicons-react";

const CATEGORY_SECTIONS = [
  { key: "accessory-categories", title: "หมวดหมู่วัสดุตกแต่ง", desc: "จัดการหมวดหมู่หลักของอะไหล่และชิ้นส่วนตกแต่งสร้อยข้อมือ", path: "/dashboard/settings/categories/accessory" },
  { key: "brands", title: "แบรนด์สินค้า", desc: "จัดการแบรนด์สินค้าคู่ค้าร่วมรายการ", disabled: true },
  { key: "conditions", title: "สภาพสินค้า", desc: "ตั้งค่าสภาพหรือสถานะจำเพาะของตัวเลือกสินค้า", disabled: true },
  { key: "order-channels", title: "ช่องทางการสั่งซื้อ", desc: "บันทึกแหล่งที่มาของคำสั่งซื้อระบบจัดเก็บข้อมูล", disabled: true },
  { key: "departments", title: "แผนก", desc: "จัดการกลุ่มงานย่อยภายในองค์กรพนักงาน", disabled: true },
  { key: "articles", title: "หมวดหมู่บทความ", desc: "จัดระเบียบบทความประเภทข่าวสารเนื้อหา", disabled: true },
  { key: "positions", title: "ตำแหน่ง", desc: "กำหนดชื่อตำแหน่งระดับการทำงานของพนักงาน", disabled: true },
  { key: "shipping", title: "ตั้งค่าขนส่ง", desc: "แก้ไขระบบจัดส่งพัสดุและบริษัทคู่ค้า", disabled: true },
];

export default function CategoriesMenuPage() {
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
    <div className="w-full space-y-6">
      {/* Back Link */}
      <button
        onClick={() => router.push("/dashboard/settings")}
        className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
      >
        <ArrowLeft01Icon size={14} />
        กลับไปหน้าตั้งค่า
      </button>

      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-brand">จัดสรรหมวดหมู่</h2>
        <p className="text-sm text-gray-400 mt-1">ควบคุมและปรับแต่งหมวดหมู่หลักต่างๆ ภายในระบบหลังบ้าน</p>
      </div>

      {/* Sub Category Grid list */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden w-full">
        {CATEGORY_SECTIONS.map((item, idx) => (
          <button
            key={item.key}
            onClick={() => {
              if (!item.disabled) {
                router.push(item.path);
              }
            }}
            disabled={item.disabled}
            className={`w-full flex items-center justify-between px-6 py-4.5 text-left transition-colors
              ${idx !== 0 ? "border-t border-gray-100" : ""}
              ${item.disabled
                ? "opacity-50 cursor-not-allowed bg-gray-50/20"
                : "hover:bg-gray-50/70 active:bg-gray-100 cursor-pointer"
              }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                <ShoppingBag01Icon size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{item.title}</p>
              </div>
            </div>
            <ArrowRight01Icon size={16} className="text-gray-300 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
