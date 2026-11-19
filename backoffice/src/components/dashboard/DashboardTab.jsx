"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag01Icon,
  UserIcon,
  MoneyBag02Icon,
  Coins01Icon,
  Store01Icon,
  Alert02Icon,
  ArrowRight01Icon,
  ChartLineData01Icon,
} from "hugeicons-react";
import { analyticsService } from "../../services/api";

const EMPTY_SUMMARY = {
  gmv: 0,
  commission: 0,
  netSeller: 0,
  shipping: 0,
  cancelledGmv: 0,
  takeRate: 0,
  paidOrders: 0,
  totalOrders: 0,
  totalProducts: 0,
  totalCustomers: 0,
  activeShops: 0,
  pendingShops: 0,
  hiddenProducts: 0,
  pendingPayouts: 0,
};

const toDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getRange = (days) => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  return { from: toDateInput(from), to: toDateInput(to) };
};

const formatMoney = (value) =>
  `฿${Number(value || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("th-TH");

const formatDay = (value) =>
  value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "2-digit",
      })
    : "—";

export default function DashboardTab({ user }) {
  const isAdmin = user?.role === "admin";

  const [preset, setPreset] = useState(30);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rangeReady, setRangeReady] = useState(false);
  const [data, setData] = useState({
    summary: EMPTY_SUMMARY,
    byShop: [],
    byDay: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const range = getRange(30);
    const timer = setTimeout(() => {
      setFrom(range.from);
      setTo(range.to);
      setRangeReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const loadAnalytics = useCallback(async () => {
    if (!rangeReady) return;

    setLoading(true);
    setError("");
    try {
      const response = await analyticsService.getAnalytics({ from, to });
      setData({
        summary: { ...EMPTY_SUMMARY, ...(response.summary || {}) },
        byShop: response.byShop || [],
        byDay: response.byDay || [],
      });
    } catch (err) {
      setError(err.message || "ไม่สามารถดึงข้อมูล Analytics ได้");
    } finally {
      setLoading(false);
    }
  }, [from, to, rangeReady]);

  useEffect(() => {
    const timer = setTimeout(() => loadAnalytics(), 0);
    return () => clearTimeout(timer);
  }, [loadAnalytics]);

  const applyPreset = (days) => {
    const range = getRange(days);
    setPreset(days);
    setFrom(range.from);
    setTo(range.to);
    setRangeReady(true);
  };

  const summary = data.summary;
  const maxDayGmv = Math.max(
    1,
    ...data.byDay.map((day) => Number(day.gmv || 0)),
  );

  const pendingActions = [
    {
      key: "shops",
      count: Number(summary.pendingShops || 0),
      label: "ร้านค้ารออนุมัติ",
      href: "/dashboard/shops",
      tone: "amber",
    },
    {
      key: "payouts",
      count: Number(summary.pendingPayouts || 0),
      label: "คำขอถอนเงินรออนุมัติ",
      href: "/dashboard/payouts",
      tone: "blue",
      adminOnly: true,
    },
    {
      key: "hidden",
      count: Number(summary.hiddenProducts || 0),
      label: "สินค้าถูกซ่อน/ระงับ",
      href: "/dashboard/products?status=HIDDEN",
      tone: "rose",
    },
  ].filter((item) => !item.adminOnly || isAdmin);

  const visiblePendingActions = pendingActions.filter(
    (item) => item.count > 0,
  );

  return (
    <div className="space-y-8">
      {/* Header + date range */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              ภาพรวมแพลตฟอร์ม (Platform Analytics)
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              ข้อมูลยอดขายและค่าธรรมเนียมจากออเดอร์ที่ชำระเงินสำเร็จ
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => applyPreset(days)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition ${
                  preset === days
                    ? "bg-brand text-white"
                    : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {days} วัน
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold text-gray-500" htmlFor="from">
            ตั้งแต่
          </label>
          <input
            id="from"
            type="date"
            value={from}
            max={to}
            onChange={(e) => {
              setPreset("custom");
              setFrom(e.target.value);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <label className="text-xs font-bold text-gray-500" htmlFor="to">
            ถึง
          </label>
          <input
            id="to"
            type="date"
            value={to}
            min={from}
            onChange={(e) => {
              setPreset("custom");
              setTo(e.target.value);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          />
          {preset === "custom" && (
            <span className="text-[11px] font-bold text-brand">
              กำหนดช่วงเอง
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center text-gray-400 text-sm">
          <span className="inline-block w-6 h-6 border-2 border-brand/20 border-t-brand rounded-full animate-spin mr-3 align-middle" />
          กำลังโหลดรายงานวิเคราะห์การขาย...
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                <MoneyBag02Icon size={24} />
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                  GMV
                </span>
                <strong className="block text-xl font-bold text-gray-800 mt-0.5">
                  {formatMoney(summary.gmv)}
                </strong>
                <span className="text-xs text-gray-400 font-semibold">
                  ยอดขายรวมจากออเดอร์ที่ชำระเงิน
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                <Coins01Icon size={24} />
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                  รายได้ GP
                </span>
                <strong className="block text-xl font-bold text-gray-800 mt-0.5">
                  {formatMoney(summary.commission)}
                </strong>
                <span className="text-xs text-gray-400 font-semibold">
                  Take rate {(Number(summary.takeRate || 0) * 100).toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                <ShoppingBag01Icon size={24} />
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                  คำสั่งซื้อที่ชำระเงิน
                </span>
                <strong className="block text-xl font-bold text-gray-800 mt-0.5">
                  {formatNumber(summary.paidOrders)} รายการ
                </strong>
                <span className="text-xs text-gray-400 font-semibold">
                  จากทั้งหมด {formatNumber(summary.totalOrders)} ออเดอร์
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                <Store01Icon size={24} />
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                  ร้านค้าที่เปิดใช้งาน
                </span>
                <strong className="block text-xl font-bold text-gray-800 mt-0.5">
                  {formatNumber(summary.activeShops)} ร้าน
                </strong>
                <span className="text-xs text-gray-400 font-semibold">
                  รออนุมัติ {formatNumber(summary.pendingShops)} ร้าน
                </span>
              </div>
            </div>
          </div>

          {/* Secondary financial metrics */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                ร้านค้าได้รับ (Net Seller)
              </p>
              <p className="mt-1 text-sm font-bold text-gray-800">
                {formatMoney(summary.netSeller)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                ค่าส่งที่เก็บได้
              </p>
              <p className="mt-1 text-sm font-bold text-gray-800">
                {formatMoney(summary.shipping)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                GMV ที่ถูกยกเลิก/คืนเงิน
              </p>
              <p className="mt-1 text-sm font-bold text-rose-600">
                {formatMoney(summary.cancelledGmv)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                สินค้าทั้งหมด
              </p>
              <p className="mt-1 text-sm font-bold text-gray-800">
                {formatNumber(summary.totalProducts)} ชิ้น
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                ลูกค้าทั้งหมด
              </p>
              <p className="mt-1 text-sm font-bold text-gray-800">
                {formatNumber(summary.totalCustomers)} ราย
              </p>
            </div>
          </div>

          {/* Pending action alerts */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Alert02Icon size={17} className="text-amber-500" />
              <h3 className="text-sm font-bold text-gray-800">
                รายการที่ต้องดำเนินการ
              </h3>
            </div>
            {visiblePendingActions.length === 0 ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-xs font-semibold text-emerald-700">
                ไม่มีรายการค้างดำเนินการ — ร้านค้า สินค้า และคำขอถอนเงินอยู่ในสถานะเรียบร้อย
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {visiblePendingActions.map((item) => {
                  const tone = {
                    amber: "border-amber-200 bg-amber-50 text-amber-700",
                    blue: "border-blue-200 bg-blue-50 text-blue-700",
                    rose: "border-rose-200 bg-rose-50 text-rose-700",
                  }[item.tone];

                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={`flex items-center justify-between gap-3 rounded-xl border px-5 py-4 transition hover:brightness-[0.98] ${tone}`}
                    >
                      <div>
                        <p className="text-xs font-semibold">{item.label}</p>
                        <p className="mt-0.5 text-xl font-extrabold">
                          {formatNumber(item.count)}
                        </p>
                      </div>
                      <ArrowRight01Icon size={20} />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* By day chart */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <ChartLineData01Icon size={18} className="text-brand" />
                  GMV รายวัน
                </h3>
                <p className="mt-1 text-xs text-gray-400">
                  ยอดขายจากออเดอร์ที่ชำระเงิน แยกตามวันของช่วงที่เลือก
                </p>
              </div>
              <span className="text-xs font-semibold text-gray-400">
                {formatDay(from)} — {formatDay(to)}
              </span>
            </div>

            {data.byDay.length === 0 ? (
              <div className="py-10 text-center text-xs text-gray-400">
                ไม่มีข้อมูลยอดขายในช่วงเวลานี้
              </div>
            ) : (
              <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                {data.byDay.map((day) => {
                  const gmv = Number(day.gmv || 0);
                  const width = Math.max(
                    gmv > 0 ? 2 : 0,
                    Math.round((gmv / maxDayGmv) * 100),
                  );
                  return (
                    <div
                      key={day.date}
                      className="flex items-center gap-3 text-xs"
                      title={`GP ${formatMoney(day.commission)} · ${formatNumber(day.orders)} ออเดอร์`}
                    >
                      <span className="w-24 shrink-0 font-semibold text-gray-500">
                        {formatDay(day.date)}
                      </span>
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-brand transition-all duration-500"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <span className="w-32 shrink-0 text-right font-bold text-gray-700">
                        {formatMoney(gmv)}
                      </span>
                      <span className="w-20 shrink-0 text-right text-gray-400">
                        {formatNumber(day.orders)} ออเดอร์
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* By shop table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4">
              <h3 className="text-sm font-bold text-gray-800">
                ยอดขายแยกตามร้านค้า
              </h3>
              <p className="mt-1 text-xs text-gray-400">
                เรียงตาม GMV จากมากไปน้อย
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-bold">ร้านค้า</th>
                    <th className="px-6 py-3 text-right font-bold">ออเดอร์</th>
                    <th className="px-6 py-3 text-right font-bold">GMV</th>
                    <th className="px-6 py-3 text-right font-bold">GP</th>
                    <th className="px-6 py-3 text-right font-bold">
                      ร้านค้าได้รับ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.byShop.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-gray-400"
                      >
                        ไม่มีข้อมูลร้านค้าในช่วงเวลานี้
                      </td>
                    </tr>
                  ) : (
                    data.byShop.map((shop) => (
                      <tr key={shop.shopId}>
                        <td className="px-6 py-3.5">
                          <p className="font-bold text-gray-800">
                            {shop.shopName}
                          </p>
                          {shop.shopSlug && (
                            <p className="text-[11px] text-gray-400">
                              /shop/{shop.shopSlug}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right text-gray-600">
                          {formatNumber(shop.orders)}
                        </td>
                        <td className="px-6 py-3.5 text-right font-bold text-gray-800">
                          {formatMoney(shop.gmv)}
                        </td>
                        <td className="px-6 py-3.5 text-right text-gray-600">
                          {formatMoney(shop.commission)}
                        </td>
                        <td className="px-6 py-3.5 text-right font-bold text-emerald-700">
                          {formatMoney(shop.netSeller)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Category-style summary kept in existing visual language */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-8 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                สรุปภาพรวมการขาย
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                สัดส่วนรายได้แพลตฟอร์มเทียบกับยอดที่ร้านค้าได้รับ
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-neutral-50/50 p-6 rounded-2xl border border-neutral-200/50 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200/50">
                  <h4 className="text-sm font-bold text-[#008290] flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#008290]" />
                    รายได้แพลตฟอร์ม
                  </h4>
                  <span className="text-sm font-extrabold text-gray-800">
                    {formatMoney(summary.commission)}
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="bg-[#008290] h-full rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Number(summary.takeRate || 0) * 100,
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 font-semibold">
                  Take rate {(Number(summary.takeRate || 0) * 100).toFixed(2)}% ของ GMV
                </p>
              </div>

              <div className="bg-neutral-50/50 p-6 rounded-2xl border border-neutral-200/50 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200/50">
                  <h4 className="text-sm font-bold text-[#A07050] flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#A07050]" />
                    รายได้ร้านค้า
                  </h4>
                  <span className="text-sm font-extrabold text-gray-800">
                    {formatMoney(summary.netSeller)}
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="bg-[#A07050] h-full rounded-full"
                    style={{
                      width: `${
                        Number(summary.gmv || 0) > 0
                          ? Math.min(
                              100,
                              (Number(summary.netSeller || 0) /
                                Number(summary.gmv || 1)) *
                                100,
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 font-semibold">
                  หลังหัก GP (ยังไม่รวมค่าส่ง)
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Profile Details Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 w-full">
        <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-4">
          <div className="w-12 h-12 rounded-lg bg-brand flex items-center justify-center text-white font-bold">
            <UserIcon size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              ข้อมูลผู้ใช้งานระบบหลังบ้าน
            </h3>
            <p className="text-xs text-gray-400">
              ตรวจสอบรายละเอียดสิทธิ์และข้อมูลบัญชีของคุณ
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
              ชื่อจริง
            </span>
            <span className="text-sm font-bold text-gray-700 mt-0.5 block">
              {user?.firstName || "ไม่มีข้อมูล"}
            </span>
          </div>
          <div>
            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
              นามสกุล
            </span>
            <span className="text-sm font-bold text-gray-700 mt-0.5 block">
              {user?.lastName || "ไม่มีข้อมูล"}
            </span>
          </div>
          <div>
            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
              ที่อยู่อีเมล
            </span>
            <span className="text-sm font-bold text-gray-700 mt-0.5 block">
              {user?.email || "ไม่มีข้อมูล"}
            </span>
          </div>
          <div>
            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
              สิทธิ์การเข้าถึง
            </span>
            <span className="text-sm font-bold text-brand mt-0.5 block capitalize">
              {user?.role === "admin"
                ? "ผู้ดูแลระบบ (Admin)"
                : "พนักงานทั่วไป (Staff)"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
