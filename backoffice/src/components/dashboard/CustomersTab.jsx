"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { userService, orderService } from "../../services/api";
import {
  ArrowLeft01Icon,
  UserGroupIcon,
  Mail01Icon,
  Call02Icon,
  Location01Icon,
  Calendar03Icon,
  Search01Icon,
  ShoppingBag01Icon,
  Cancel01Icon,
} from "hugeicons-react";

const dateFormatter = new Intl.DateTimeFormat("th-TH", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default function CustomerManager({ onBack }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null); // ลูกค้าที่กำลังดูรายละเอียด (modal)
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (selected) {
      loadCustomerOrders(selected.id);
    } else {
      setCustomerOrders([]);
    }
  }, [selected]);

  const loadCustomerOrders = async (userId) => {
    try {
      setLoadingOrders(true);
      const res = await orderService.getAdminOrders();
      if (res.success) {
        const list = (res.orders || []).filter(
          (o) => o.userId === userId || o.user?.id === userId
        );
        setCustomerOrders(list);
      }
    } catch (err) {
      console.error("Failed to load customer orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await userService.getUsers();
      const list = res.users ?? res.data ?? (Array.isArray(res) ? res : []);
      setCustomers(list);
    } catch (err) {
      setError(
        err.message?.includes("404")
          ? "ยังไม่มี API /api/users ในฝั่ง Backend กรุณาสร้าง endpoint นี้ก่อน (Admin only)"
          : "โหลดข้อมูลลูกค้าล้มเหลว: " + err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      const fullName = `${c.firstName ?? ""} ${c.lastName ?? ""}`.toLowerCase();
      return (
        fullName.includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q)
      );
    });
  }, [customers, search]);

  const fullName = (c) =>
    [c.firstName, c.lastName].filter(Boolean).join(" ") || "ไม่ระบุชื่อ";

  const initials = (c) =>
    ((c.firstName?.[0] ?? "") + (c.lastName?.[0] ?? c.email?.[0] ?? "")).toUpperCase() || "?";

  return (
    <div className="w-full space-y-6">
      {/* Back link */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
      >
        <ArrowLeft01Icon size={14} />
        กลับไปหน้าแดชบอร์ด
      </button>

      {/* Page title */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-brand">ข้อมูลลูกค้า (Customers)</h2>
          <p className="text-sm text-gray-400 mt-1">
            รายชื่อลูกค้าที่สมัครสมาชิกทั้งหมด {!loading && `— ทั้งหมด ${customers.length} คน`}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search01Icon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ, อีเมล, เบอร์โทร..."
            className="w-full text-sm border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium px-4 py-3 rounded-xl">
          ⚠️ {error}
        </div>
      )}

      {/* Customer list */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            <span className="inline-block w-5 h-5 border-2 border-brand/20 border-t-brand rounded-full animate-spin mr-2 align-middle" />
            กำลังโหลด...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-300 text-sm">
            {search ? "ไม่พบลูกค้าที่ค้นหา" : "ยังไม่มีลูกค้าสมัครสมาชิก"}
          </div>
        ) : (
          filtered.map((c, idx) => (
            <div
              key={c.id}
              onClick={() => setSelected(c)}
              className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors cursor-pointer group ${
                idx !== 0 ? "border-t border-gray-100" : ""
              }`}
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center flex-shrink-0 font-bold text-sm">
                {initials(c)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{fullName(c)}</p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                  <span className="flex items-center gap-1 truncate">
                    <Mail01Icon size={12} />
                    {c.email}
                  </span>
                  {c.phone && (
                    <span className="hidden sm:flex items-center gap-1">
                      <Call02Icon size={12} />
                      {c.phone}
                    </span>
                  )}
                </div>
              </div>

              {/* Order count badge (ถ้า backend รวม _count มาให้) */}
              {typeof c._count?.orders === "number" && (
                <span className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg flex-shrink-0">
                  <ShoppingBag01Icon size={13} />
                  {c._count.orders} ออเดอร์
                </span>
              )}

              <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 flex-shrink-0">
                <Calendar03Icon size={13} />
                {c.createdAt ? dateFormatter.format(new Date(c.createdAt)) : "-"}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-2xl p-8 space-y-6 shadow-xl transition-all scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-base">
                  {initials(selected)}
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-base">{fullName(selected)}</p>
                  <p className="text-xs text-gray-400">{selected.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-300 hover:text-gray-650 hover:bg-neutral-100 p-1.5 rounded-full cursor-pointer active:scale-95 transition-all"
              >
                <Cancel01Icon size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-sm border-t border-neutral-100 pt-4">
              <div className="flex items-center gap-2.5 text-gray-600">
                <Call02Icon size={15} className="text-neutral-400" />
                <span className="font-medium">{selected.phone || "ไม่ระบุเบอร์โทร"}</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-600">
                <Calendar03Icon size={15} className="text-neutral-400" />
                <span className="font-medium text-xs">
                  สมัครสมาชิกเมื่อ{" "}
                  {selected.createdAt ? dateFormatter.format(new Date(selected.createdAt)) : "-"}
                </span>
              </div>
            </div>

            {/* รายการที่อยู่จัดส่ง (Multi-address support) */}
            <div className="border-t border-neutral-100 pt-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Location01Icon size={14} className="text-neutral-400" />
                  ที่อยู่จัดส่งที่บันทึกไว้ ({selected.addresses?.length || (selected.address ? 1 : 0)})
                </h4>
              </div>

              {selected.addresses && selected.addresses.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selected.addresses.map((addr) => {
                    const tambonText = addr.tambon ? `ต.${addr.tambon}, ` : "";
                    const amphoeText = addr.amphoe ? `อ.${addr.amphoe}, ` : "";
                    const fullAddr = `${addr.addressLine || ""}, ${tambonText}${amphoeText}${addr.province || ""} ${addr.postalCode || ""}`.replace(/^,\s*/, "").trim();

                    return (
                      <div
                        key={addr.id}
                        className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-3 text-xs space-y-1.5 relative transition-all hover:border-brand/30"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-gray-800">
                              {addr.recipientName || fullName(selected)}
                            </span>
                            {addr.phone && (
                              <span className="text-gray-400 font-normal">({addr.phone})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200/80 text-gray-700">
                              {addr.label || "ที่บ้าน"}
                            </span>
                            {addr.isDefault && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand text-white">
                                ค่าเริ่มต้น
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-gray-600 leading-relaxed">{fullAddr}</p>

                        {addr.note && (
                          <p className="text-[11px] text-gray-400 italic">
                            หมายเหตุ: {addr.note}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : selected.address ? (
                <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-3 text-xs">
                  <p className="text-gray-700 font-medium">{selected.address}</p>
                </div>
              ) : (
                <div className="bg-neutral-50 rounded-xl p-3.5 text-center text-xs text-neutral-400 font-medium">
                  ไม่ระบุที่อยู่จัดส่ง
                </div>
              )}
            </div>

            {/* Orders list section */}
            <div className="border-t border-neutral-100 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                ประวัติการสั่งซื้อ
              </h4>

              {loadingOrders ? (
                <div className="py-8 text-center text-xs text-neutral-400">
                  <span className="inline-block w-4.5 h-4.5 border-2 border-brand/20 border-t-brand rounded-full animate-spin mr-2 align-middle" />
                  กำลังโหลดข้อมูลคำสั่งซื้อ...
                </div>
              ) : customerOrders.length === 0 ? (
                <div className="py-6 text-center text-xs text-neutral-400 font-medium bg-neutral-50 rounded-2xl">
                  ยังไม่มีประวัติคำสั่งซื้อ
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {customerOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-3.5 bg-neutral-50 hover:bg-neutral-100/75 border border-neutral-200/60 rounded-2xl flex items-center justify-between text-xs transition-all active:scale-[0.99]"
                    >
                      <div>
                        <div className="font-mono font-bold text-neutral-800">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString("th-TH", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-neutral-750">
                          ฿{order.totalPrice?.toLocaleString() || order.totalAmount?.toLocaleString() || 0}
                        </span>
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="px-3 py-1.5 bg-brand text-white font-bold rounded-xl text-[10px] hover:bg-brand/90 active:scale-95 transition-all shadow-3xs"
                        >
                          ดูรายละเอียด
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}