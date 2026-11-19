"use client";

import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import {
  ArrowRight01Icon,
  Tag01Icon,
  DiscountIcon,
  CrownIcon,
  MoneyBag02Icon,
} from "hugeicons-react";

const SETTING_ITEMS = [
  {
    key: "categories",
    icon: Tag01Icon,
    title: "จัดสรรหมวดหมู่",
    description: "จัดหมวดหมู่วัสดุตกแต่งให้กับสินค้า กำหนดและแก้ไขชื่อหมวดหมู่สินค้า",
    path: "/dashboard/settings/categories",
  },
  {
    key: "platform",
    icon: MoneyBag02Icon,
    title: "ตั้งค่าแพลตฟอร์ม (GP / ค่าส่ง)",
    description: "กำหนดอัตราค่าธรรมเนียม GP ค่าส่ง และยอดขั้นต่ำสำหรับฟรีค่าส่ง",
    path: "/dashboard/settings/platform",
  },
  {
    key: "promotions",
    icon: DiscountIcon,
    title: "แคมเปญโปรโมชั่น",
    description: "จัดระเบียบการโปรโมชั่นทั้งหมด และตั้งค่าทำหน้าแนะนำสินค้า",
    disabled: true,
  },
  {
    key: "membership",
    icon: CrownIcon,
    title: "ตั้งค่าระดับสมาชิก",
    description: "จัดหมวดสมาชิกให้กับลูกค้า กำหนดสิทธิประโยชน์ระดับสมาชิก",
    disabled: true,
  },
];

export default function SettingsPage() {
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
    <div className="w-full space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden w-full">
        {SETTING_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => !item.disabled && router.push(item.path)}
              disabled={item.disabled}
              className={`w-full flex items-center gap-4 px-6 py-5 text-left transition-colors
                ${idx !== 0 ? "border-t border-gray-100" : ""}
                ${item.disabled
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-gray-50/70 active:bg-gray-100 cursor-pointer"
                }`}
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-500">
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{item.description}</p>
              </div>
              <ArrowRight01Icon size={18} className="text-gray-300 flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
