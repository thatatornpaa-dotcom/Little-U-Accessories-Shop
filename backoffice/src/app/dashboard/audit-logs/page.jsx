"use client";

import { useCallback, useEffect, useState } from "react";
import { auditService } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";

/**
 * Admin Backoffice — Audit Log
 * - เฉพาะ Admin เท่านั้น (backend ใช้ requireAdmin)
 * - แสดงประวัติการกระทำสำคัญ พร้อมข้อมูลก่อน/หลังการเปลี่ยนแปลง
 */
const ACTION_OPTIONS = [
  { value: "", label: "ทุกการกระทำ" },
  { value: "SHOP_APPROVE", label: "อนุมัติร้าน" },
  { value: "SHOP_REJECT", label: "ปฏิเสธร้าน" },
  { value: "SHOP_SUSPEND", label: "ระงับร้าน" },
  { value: "SHOP_REACTIVATE", label: "เปิดใช้งานร้าน" },
  { value: "PRODUCT_HIDE", label: "ซ่อนสินค้า" },
  { value: "PRODUCT_SUSPEND", label: "ระงับสินค้า" },
  { value: "PRODUCT_RESTORE", label: "คืนสถานะสินค้า" },
  { value: "PAYOUT_APPROVE", label: "อนุมัติถอนเงิน" },
  { value: "PAYOUT_REJECT", label: "ปฏิเสธถอนเงิน" },
  { value: "PAYOUT_TRANSFER", label: "บันทึกโอนเงิน" },
  { value: "SETTINGS_UPDATE", label: "แก้ไขตั้งค่าแพลตฟอร์ม" },
  { value: "ORDER_UPDATE", label: "อัปเดตคำสั่งซื้อ" },
];

const TARGET_OPTIONS = [
  { value: "", label: "ทุกประเภท" },
  { value: "SHOP", label: "ร้านค้า" },
  { value: "PRODUCT", label: "สินค้า" },
  { value: "PAYOUT", label: "คำขอถอนเงิน" },
  { value: "SETTINGS", label: "ตั้งค่า" },
  { value: "ORDER", label: "คำสั่งซื้อ" },
];

const ACTION_LABEL = Object.fromEntries(
  ACTION_OPTIONS.filter((option) => option.value).map((option) => [
    option.value,
    option.label,
  ]),
);

const TARGET_LABEL = Object.fromEntries(
  TARGET_OPTIONS.filter((option) => option.value).map((option) => [
    option.value,
    option.label,
  ]),
);

const ACTION_BADGE = {
  SHOP_APPROVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SHOP_REJECT: "bg-rose-50 text-rose-700 border-rose-200",
  SHOP_SUSPEND: "bg-rose-50 text-rose-700 border-rose-200",
  SHOP_REACTIVATE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PRODUCT_HIDE: "bg-amber-50 text-amber-700 border-amber-200",
  PRODUCT_SUSPEND: "bg-rose-50 text-rose-700 border-rose-200",
  PRODUCT_RESTORE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PAYOUT_APPROVE: "bg-blue-50 text-blue-700 border-blue-200",
  PAYOUT_REJECT: "bg-rose-50 text-rose-700 border-rose-200",
  PAYOUT_TRANSFER: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SETTINGS_UPDATE: "bg-blue-50 text-blue-700 border-blue-200",
  ORDER_UPDATE: "bg-purple-50 text-purple-700 border-purple-200",
};

const PAGE_SIZE = 30;

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const formatJson = (value) => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export default function AuditLogsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [action, setAction] = useState("");
  const [targetType, setTargetType] = useState("");
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLogs = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await auditService.getAuditLogs({
        page,
        pageSize: PAGE_SIZE,
        action,
        targetType,
      });
      setLogs(data.logs || []);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      setError(err.message || "ไม่สามารถดึง Audit Log ได้");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, page, action, targetType]);

  useEffect(() => {
    const timer = setTimeout(() => loadLogs(), 0);
    return () => clearTimeout(timer);
  }, [loadLogs]);

  if (!isAdmin) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs w-full text-center text-gray-400 py-16">
        สิทธิ์การเข้าถึงถูกจำกัด — เฉพาะผู้ดูแลระบบเท่านั้น
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">
            ประวัติการดำเนินการ (Audit Log)
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            ตรวจสอบย้อนหลังว่าผู้ดูแลระบบคนใดเปลี่ยนแปลงข้อมูลสำคัญของแพลตฟอร์ม
          </p>
        </div>
        <span className="text-xs text-gray-400">
          ทั้งหมด {total.toLocaleString("th-TH")} รายการ
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-[11px] font-bold text-gray-500">
            การกระทำ
          </label>
          <select
            value={action}
            onChange={(e) => {
              setPage(1);
              setAction(e.target.value);
            }}
            className="mt-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          >
            {ACTION_OPTIONS.map((option) => (
              <option key={option.value || "ALL"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-500">
            ประเภทเป้าหมาย
          </label>
          <select
            value={targetType}
            onChange={(e) => {
              setPage(1);
              setTargetType(e.target.value);
            }}
            className="mt-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          >
            {TARGET_OPTIONS.map((option) => (
              <option key={option.value || "ALL"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {(action || targetType) && (
          <button
            onClick={() => {
              setPage(1);
              setAction("");
              setTargetType("");
            }}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50"
          >
            ล้างตัวกรอง
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-3 font-bold">เวลา</th>
                <th className="px-5 py-3 font-bold">ผู้ใช้งาน</th>
                <th className="px-5 py-3 font-bold">การกระทำ</th>
                <th className="px-5 py-3 font-bold">เป้าหมาย</th>
                <th className="px-5 py-3 font-bold">เหตุผล</th>
                <th className="px-5 py-3 font-bold">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    กำลังโหลด Audit Log...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    ไม่พบรายการที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="align-top">
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-600">
                      <p className="font-bold text-gray-800">
                        {log.actorEmail || "—"}
                      </p>
                      <span className="mt-1 inline-flex rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-bold text-gray-500">
                        {log.actorRole === "ADMIN" || log.actorRole === "admin"
                          ? "ผู้ดูแลระบบ"
                          : log.actorRole === "STAFF" ||
                              log.actorRole === "staff"
                            ? "พนักงาน"
                            : log.actorRole || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                          ACTION_BADGE[log.action] ||
                          "border-gray-200 bg-gray-50 text-gray-500"
                        }`}
                      >
                        {ACTION_LABEL[log.action] || log.action || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-600">
                      <p className="font-bold text-gray-800">
                        {TARGET_LABEL[log.targetType] || log.targetType || "—"}
                      </p>
                      {log.targetId && (
                        <p className="mt-0.5 break-all text-[11px] text-gray-400">
                          {log.targetId}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-600">
                      {log.reason ? (
                        <p className="max-w-[220px] whitespace-pre-wrap">
                          {log.reason}
                        </p>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <details className="group">
                        <summary className="cursor-pointer text-[11px] font-bold text-brand hover:underline">
                          ดูข้อมูลก่อน / หลัง
                        </summary>
                        <div className="mt-2 space-y-2">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              ก่อน
                            </p>
                            <pre className="mt-0.5 max-h-40 max-w-[320px] overflow-auto rounded-lg bg-gray-50 p-2 text-[10px] leading-relaxed text-gray-600">
                              {formatJson(log.beforeJson)}
                            </pre>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              หลัง
                            </p>
                            <pre className="mt-0.5 max-h-40 max-w-[320px] overflow-auto rounded-lg bg-gray-50 p-2 text-[10px] leading-relaxed text-gray-600">
                              {formatJson(log.afterJson)}
                            </pre>
                          </div>
                        </div>
                      </details>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-3">
          <span className="text-xs text-gray-400">
            หน้า {page} จาก {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1 || loading}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:text-gray-300"
            >
              ก่อนหน้า
            </button>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages || loading}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:text-gray-300"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
