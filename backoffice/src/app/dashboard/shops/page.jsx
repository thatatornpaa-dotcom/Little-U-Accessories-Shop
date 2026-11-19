"use client";

import { useCallback, useEffect, useState } from "react";
import { shopService } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";

/**
 * Admin Backoffice — อนุมัติร้านค้า
 * - Staff ดูรายการได้ แต่จะไม่เห็นข้อมูล KYC/บัญชีเต็ม และอนุมัติไม่ได้
 * - Admin เท่านั้นที่เห็นปุ่มอนุมัติ/ปฏิเสธ
 * - การอนุมัติจะเปลี่ยน role ของเจ้าของร้านเป็น SELLER ที่ฝั่ง backend
 */
const STATUS_TABS = [
  { value: "PENDING", label: "รออนุมัติ" },
  { value: "APPROVED", label: "อนุมัติแล้ว" },
  { value: "REJECTED", label: "ถูกปฏิเสธ" },
  { value: "SUSPENDED", label: "ถูกระงับ" },
  { value: "", label: "ทั้งหมด" },
];

const STATUS_BADGE = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
  SUSPENDED: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function ShopsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [status, setStatus] = useState("PENDING");
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const loadShops = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await shopService.getShops(status);
      setShops(data.shops || []);
    } catch (err) {
      setError(err.message || "ไม่สามารถดึงรายการร้านค้าได้");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    const timer = setTimeout(() => loadShops(), 0);
    return () => clearTimeout(timer);
  }, [loadShops]);

  const handleApprove = async (shop) => {
    if (!confirm(`อนุมัติร้าน "${shop.name}" ใช่หรือไม่?`)) return;
    setProcessing(true);
    setError("");
    try {
      await shopService.approveShop(shop.id);
      setSuccess(`อนุมัติร้าน "${shop.name}" สำเร็จ`);
      await loadShops();
    } catch (err) {
      setError(err.message || "อนุมัติร้านไม่สำเร็จ");
    } finally {
      setProcessing(false);
    }
  };

  const openReject = (shop) => {
    setRejectTarget(shop);
    setRejectReason("");
  };

  const openSuspend = (shop) => {
    setSuspendTarget(shop);
    setSuspendReason("");
  };

  const handleSuspend = async () => {
    if (!suspendReason.trim()) {
      setError("กรุณาระบุเหตุผลที่ระงับร้าน");
      return;
    }
    setProcessing(true);
    setError("");
    setSuccess("");
    try {
      await shopService.suspendShop(suspendTarget.id, suspendReason.trim());
      setSuccess(`ระงับร้าน "${suspendTarget.name}" แล้ว`);
      setSuspendTarget(null);
      await loadShops();
    } catch (err) {
      setError(err.message || "ระงับร้านไม่สำเร็จ");
    } finally {
      setProcessing(false);
    }
  };

  const handleReactivate = async (shop) => {
    if (!confirm(`เปิดใช้งานร้าน "${shop.name}" อีกครั้งใช่หรือไม่?`)) return;
    setProcessing(true);
    setError("");
    setSuccess("");
    try {
      await shopService.reactivateShop(shop.id);
      setSuccess(`เปิดใช้งานร้าน "${shop.name}" แล้ว`);
      await loadShops();
    } catch (err) {
      setError(err.message || "เปิดใช้งานร้านไม่สำเร็จ");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError("กรุณาระบุเหตุผลที่ปฏิเสธ");
      return;
    }
    setProcessing(true);
    setError("");
    try {
      await shopService.rejectShop(rejectTarget.id, rejectReason.trim());
      setSuccess(`ปฏิเสธร้าน "${rejectTarget.name}" แล้ว`);
      setRejectTarget(null);
      await loadShops();
    } catch (err) {
      setError(err.message || "ปฏิเสธร้านไม่สำเร็จ");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">ร้านค้าในแพลตฟอร์ม</h3>
          <p className="text-xs text-gray-500 mt-1">
            ตรวจสอบข้อมูลร้านและเอกสาร KYC ก่อนอนุมัติ
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatus(tab.value)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition ${
                status === tab.value
                  ? "bg-brand text-white"
                  : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {!isAdmin && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-700">
          คุณเป็น Staff — ดูรายการได้อย่างเดียว การอนุมัติ/ปฏิเสธต้องเป็น Admin
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-3 font-bold">ร้านค้า</th>
                <th className="px-5 py-3 font-bold">เจ้าของ</th>
                <th className="px-5 py-3 font-bold">Tax ID / บัญชี</th>
                <th className="px-5 py-3 font-bold">สถานะ</th>
                <th className="px-5 py-3 font-bold">วันที่สมัคร</th>
                <th className="px-5 py-3 text-right font-bold">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    กำลังโหลดรายการร้านค้า...
                  </td>
                </tr>
              ) : shops.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    ไม่มีร้านค้าในสถานะนี้
                  </td>
                </tr>
              ) : (
                shops.map((shop) => (
                  <tr key={shop.id} className="align-top">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                          {shop.logoUrl ? (
                            <img
                              src={shop.logoUrl}
                              alt={shop.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg">
                              🏪
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-800 truncate">
                            {shop.name}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            /shop/{shop.slug}
                          </p>
                          {shop.description && (
                            <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 max-w-[260px]">
                              {shop.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-600">
                      <p className="font-bold text-gray-800">
                        {shop.owner?.firstName} {shop.owner?.lastName}
                      </p>
                      <p>{shop.owner?.email}</p>
                      <p>{shop.owner?.phone || "—"}</p>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-600">
                      <p>Tax: {shop.taxId || "—"}</p>
                      <p>
                        {shop.bankName || "—"} · {shop.bankAccountNumber || "—"}
                      </p>
                      <p className="text-gray-400">
                        {shop.bankAccountName || ""}
                      </p>
                      {shop.idCardUrl && (
                        <a
                          href={shop.idCardUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand hover:underline font-bold"
                        >
                          ดูบัตรประชาชน
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                          STATUS_BADGE[shop.status] || STATUS_BADGE.SUSPENDED
                        }`}
                      >
                        {shop.status}
                      </span>
                      {shop.status === "REJECTED" && shop.rejectionReason && (
                        <p className="mt-2 max-w-[200px] text-[11px] text-rose-500">
                          {shop.rejectionReason}
                        </p>
                      )}
                      {shop.status === "SUSPENDED" && shop.suspendedReason && (
                        <p className="mt-2 max-w-[200px] text-[11px] text-gray-500">
                          {shop.suspendedReason}
                        </p>
                      )}
                      {shop.status === "SUSPENDED" && shop.suspendedAt && (
                        <p className="mt-1 text-[10px] text-gray-400">
                          ระงับเมื่อ{" "}
                          {new Date(shop.suspendedAt).toLocaleDateString("th-TH", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {new Date(shop.createdAt).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {isAdmin ? (
                        <div className="flex flex-wrap justify-end gap-2">
                          {(shop.status === "PENDING" ||
                            shop.status === "REJECTED") && (
                            <button
                              onClick={() => handleApprove(shop)}
                              disabled={processing}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:bg-gray-300"
                            >
                              อนุมัติ
                            </button>
                          )}
                          {shop.status === "PENDING" && (
                            <button
                              onClick={() => openReject(shop)}
                              disabled={processing}
                              className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50 disabled:text-gray-300"
                            >
                              ปฏิเสธ
                            </button>
                          )}
                          {shop.status === "APPROVED" && (
                            <button
                              onClick={() => openSuspend(shop)}
                              disabled={processing}
                              className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50 disabled:text-gray-300"
                            >
                              ระงับร้าน
                            </button>
                          )}
                          {shop.status === "SUSPENDED" && (
                            <button
                              onClick={() => handleReactivate(shop)}
                              disabled={processing}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:bg-gray-300"
                            >
                              เปิดใช้งาน
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h4 className="text-lg font-bold text-gray-800">
              ปฏิเสธร้าน &quot;{rejectTarget.name}&quot;
            </h4>
            <p className="mt-1 text-xs text-gray-500">
              เจ้าของร้านจะเห็นเหตุผลนี้และแก้ไขส่งใหม่ได้
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="เช่น เอกสารบัตรประชาชนไม่ชัดเจน / เลขบัญชีไม่ตรงกับชื่อร้าน"
              className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setRejectTarget(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-bold text-gray-500"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:bg-gray-300"
              >
                {processing ? "กำลังดำเนินการ..." : "ยืนยันการปฏิเสธ"}
              </button>
            </div>
          </div>
        </div>
      )}
      {suspendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h4 className="text-lg font-bold text-gray-800">
              ระงับร้าน &quot;{suspendTarget.name}&quot;
            </h4>
            <p className="mt-1 text-xs text-gray-500">
              ร้านจะไม่แสดงต่อผู้ซื้อและไม่สามารถขายสินค้าได้ จนกว่าจะเปิดใช้งานอีกครั้ง
            </p>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              rows={4}
              placeholder="เช่น พบการขายสินค้าผิดกฎหมาย / ร้องเรียนจากลูกค้าหลายครั้ง"
              className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setSuspendTarget(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-bold text-gray-500"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSuspend}
                disabled={processing}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:bg-gray-300"
              >
                {processing ? "กำลังดำเนินการ..." : "ยืนยันการระงับร้าน"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
