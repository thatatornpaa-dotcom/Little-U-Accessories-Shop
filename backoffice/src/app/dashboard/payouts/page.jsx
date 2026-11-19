"use client";

import { useCallback, useEffect, useState } from "react";
import {
  payoutService,
  uploadService,
} from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";

/**
 * Admin Backoffice — คำขอถอนเงินของร้านค้า
 * - เฉพาะ Admin เท่านั้น (backend ใช้ requireAdmin)
 * - ขั้นตอน: PENDING -> APPROVED -> TRANSFERRED หรือ REJECTED
 */
const STATUS_TABS = [
  { value: "PENDING", label: "รออนุมัติ" },
  { value: "APPROVED", label: "อนุมัติแล้ว" },
  { value: "TRANSFERRED", label: "โอนแล้ว" },
  { value: "REJECTED", label: "ถูกปฏิเสธ" },
  { value: "", label: "ทั้งหมด" },
];

const STATUS_BADGE = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-blue-50 text-blue-700 border-blue-200",
  TRANSFERRED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
};

const STATUS_LABEL = {
  PENDING: "รออนุมัติ",
  APPROVED: "อนุมัติแล้ว",
  TRANSFERRED: "โอนแล้ว",
  REJECTED: "ถูกปฏิเสธ",
};

const formatMoney = (value) =>
  `฿${Number(value || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

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

export default function PayoutsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [status, setStatus] = useState("PENDING");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [payouts, setPayouts] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processing, setProcessing] = useState(false);

  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const [transferTarget, setTransferTarget] = useState(null);
  const [transferReference, setTransferReference] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadPayouts = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await payoutService.getPayouts({ status, search });
      setPayouts(data.payouts || []);
      setCounts(data.counts || {});
    } catch (err) {
      setError(err.message || "ไม่สามารถดึงรายการถอนเงินได้");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, status, search]);

  useEffect(() => {
    const timer = setTimeout(() => loadPayouts(), 0);
    return () => clearTimeout(timer);
  }, [loadPayouts]);

  const handleApprove = async (payout) => {
    if (
      !confirm(
        `อนุมัติคำขอถอนเงินของ "${payout.shop?.name || "ร้านค้า"}" จำนวน ${formatMoney(
          payout.amount,
        )} ใช่หรือไม่?`,
      )
    ) {
      return;
    }

    setProcessing(true);
    setError("");
    setSuccess("");
    try {
      const data = await payoutService.approvePayout(payout.id);
      setSuccess(data.message || "อนุมัติคำขอถอนเงินแล้ว");
      await loadPayouts();
    } catch (err) {
      setError(err.message || "ไม่สามารถอนุมัติคำขอถอนเงินได้");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      setError("กรุณาระบุเหตุผลที่ปฏิเสธ");
      return;
    }

    setProcessing(true);
    setError("");
    setSuccess("");
    try {
      const data = await payoutService.rejectPayout(
        rejectTarget.id,
        rejectReason.trim(),
      );
      setSuccess(data.message || "ปฏิเสธคำขอถอนเงินแล้ว");
      setRejectTarget(null);
      await loadPayouts();
    } catch (err) {
      setError(err.message || "ไม่สามารถปฏิเสธคำขอถอนเงินได้");
    } finally {
      setProcessing(false);
    }
  };

  const openTransfer = (payout) => {
    setTransferTarget(payout);
    setTransferReference("");
    setProofUrl("");
  };

  const handleProofUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingProof(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("files", file);
      const data = await uploadService.uploadImages(formData, "payouts");
      const url = data.urls?.[0];
      if (!url) {
        throw new Error("ไม่ได้รับ URL ของไฟล์ที่อัปโหลด");
      }
      setProofUrl(url);
      setSuccess("อัปโหลดหลักฐานการโอนแล้ว");
    } catch (err) {
      setError(err.message || "อัปโหลดหลักฐานการโอนไม่สำเร็จ");
    } finally {
      setUploadingProof(false);
      event.target.value = "";
    }
  };

  const handleTransfer = async () => {
    if (!transferTarget) return;
    if (!transferReference.trim() && !proofUrl.trim()) {
      setError("กรุณาระบุเลขอ้างอิงการโอน หรือแนบหลักฐานการโอนอย่างน้อยหนึ่งอย่าง");
      return;
    }

    setProcessing(true);
    setError("");
    setSuccess("");
    try {
      const data = await payoutService.transferPayout(transferTarget.id, {
        transferReference: transferReference.trim(),
        proofUrl: proofUrl.trim(),
      });
      setSuccess(data.message || "บันทึกการโอนเงินสำเร็จ");
      setTransferTarget(null);
      await loadPayouts();
    } catch (err) {
      setError(err.message || "ไม่สามารถบันทึกการโอนเงินได้");
    } finally {
      setProcessing(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs w-full text-center text-gray-400 py-16">
        สิทธิ์การเข้าถึงถูกจำกัด — เฉพาะผู้ดูแลระบบเท่านั้น
      </div>
    );
  }

  const busy = processing || uploadingProof;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">
            คำขอถอนเงินของร้านค้า
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            อนุมัติ ปฏิเสธ และบันทึกหลักฐานการโอนเงินให้ร้านค้า
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value || "ALL"}
              onClick={() => setStatus(tab.value)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition ${
                status === tab.value
                  ? "bg-brand text-white"
                  : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              {tab.value && counts[tab.value] > 0 && (
                <span
                  className={`ml-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] ${
                    status === tab.value
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {counts[tab.value]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="ค้นหาชื่อร้าน หรืออีเมลเจ้าของร้าน..."
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </div>
        <span className="text-xs text-gray-400">
          ทั้งหมด {payouts.length.toLocaleString("th-TH")} รายการ
        </span>
      </div>

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
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-3 font-bold">ร้านค้า</th>
                <th className="px-5 py-3 font-bold">ยอดเงิน</th>
                <th className="px-5 py-3 font-bold">บัญชีรับเงิน</th>
                <th className="px-5 py-3 font-bold">สถานะ</th>
                <th className="px-5 py-3 font-bold">วันที่</th>
                <th className="px-5 py-3 text-right font-bold">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    กำลังโหลดรายการถอนเงิน...
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    ไม่มีคำขอถอนเงินในสถานะนี้
                  </td>
                </tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout.id} className="align-top">
                    <td className="px-5 py-4 text-xs text-gray-600">
                      <p className="font-bold text-gray-800">
                        {payout.shop?.name || "—"}
                      </p>
                      {payout.shop?.slug && (
                        <p className="text-[11px] text-gray-400">
                          /shop/{payout.shop.slug}
                        </p>
                      )}
                      <p className="mt-1">
                        {payout.shop?.owner?.firstName}{" "}
                        {payout.shop?.owner?.lastName}
                      </p>
                      <p className="text-gray-400">
                        {payout.shop?.owner?.email || ""}
                      </p>
                      <p className="mt-1 text-gray-400">
                        ยอดคงเหลือร้าน: {formatMoney(payout.shop?.balance)}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-600">
                      <p className="text-sm font-bold text-gray-800">
                        {formatMoney(payout.amount)}
                      </p>
                      <p>ค่าธรรมเนียม: {formatMoney(payout.fee)}</p>
                      <p className="font-bold text-brand">
                        ยอดโอนสุทธิ: {formatMoney(payout.netAmount)}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-600">
                      <p className="font-bold text-gray-800">
                        {payout.bankName || "—"}
                      </p>
                      <p>{payout.bankAccountNumber || "—"}</p>
                      <p className="text-gray-400">
                        {payout.bankAccountName || ""}
                      </p>
                      {payout.proofUrl && (
                        <a
                          href={payout.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block font-bold text-brand hover:underline"
                        >
                          ดูหลักฐานการโอน
                        </a>
                      )}
                      {payout.transferReference && (
                        <p className="text-gray-400">
                          Ref: {payout.transferReference}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                          STATUS_BADGE[payout.status] ||
                          "border-gray-200 bg-gray-50 text-gray-500"
                        }`}
                      >
                        {STATUS_LABEL[payout.status] || payout.status}
                      </span>
                      {payout.rejectionReason && (
                        <p className="mt-2 max-w-[200px] text-[11px] text-rose-500">
                          {payout.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500">
                      <p>ขอเมื่อ: {formatDateTime(payout.createdAt)}</p>
                      <p className="mt-1">
                        ดำเนินการ: {formatDateTime(payout.processedAt)}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {payout.status === "PENDING" && (
                          <button
                            onClick={() => handleApprove(payout)}
                            disabled={busy}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:bg-gray-300"
                          >
                            อนุมัติ
                          </button>
                        )}
                        {payout.status === "APPROVED" && (
                          <button
                            onClick={() => openTransfer(payout)}
                            disabled={busy}
                            className="px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand/90 disabled:bg-gray-300"
                          >
                            บันทึกการโอน
                          </button>
                        )}
                        {["PENDING", "APPROVED"].includes(payout.status) && (
                          <button
                            onClick={() => {
                              setRejectTarget(payout);
                              setRejectReason("");
                            }}
                            disabled={busy}
                            className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50 disabled:text-gray-300"
                          >
                            ปฏิเสธ
                          </button>
                        )}
                        {["TRANSFERRED", "REJECTED"].includes(
                          payout.status,
                        ) && (
                          <span className="text-[11px] text-gray-300">
                            ดำเนินการแล้ว
                          </span>
                        )}
                      </div>
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
              ปฏิเสธคำขอถอนเงินของ &quot;{rejectTarget.shop?.name}&quot;
            </h4>
            <p className="mt-1 text-xs text-gray-500">
              ยอดกันเงินจะถูกปลดคืนให้ร้าน และร้านจะเห็นเหตุผลนี้
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="เช่น ข้อมูลบัญชีไม่ถูกต้อง / ยอดเงินไม่ตรงกับ Ledger"
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

      {transferTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h4 className="text-lg font-bold text-gray-800">
              บันทึกการโอนเงิน
            </h4>
            <p className="mt-1 text-xs text-gray-500">
              ร้าน &quot;{transferTarget.shop?.name}&quot; · ยอดโอน{" "}
              {formatMoney(transferTarget.amount)}
            </p>

            <label className="mt-4 block text-xs font-bold text-gray-600">
              เลขอ้างอิงการโอน (Transfer Reference)
            </label>
            <input
              value={transferReference}
              onChange={(e) => setTransferReference(e.target.value)}
              placeholder="เช่น 20261112000123"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand"
            />

            <label className="mt-4 block text-xs font-bold text-gray-600">
              URL หลักฐานการโอน (ไม่บังคับ)
            </label>
            <input
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand"
            />

            <div className="mt-3">
              <label className="block text-xs font-bold text-gray-600">
                หรืออัปโหลดรูปหลักฐาน
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleProofUpload}
                disabled={uploadingProof}
                className="mt-1 block w-full text-xs text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-2 file:text-xs file:font-bold file:text-brand"
              />
              {uploadingProof && (
                <p className="mt-1 text-[11px] text-gray-400">
                  กำลังอัปโหลด...
                </p>
              )}
              {proofUrl && (
                <p className="mt-1 break-all text-[11px] text-emerald-600">
                  แนบหลักฐานแล้ว: {proofUrl}
                </p>
              )}
            </div>

            <p className="mt-3 text-[11px] text-amber-600">
              ต้องระบุเลขอ้างอิงหรือแนบหลักฐานอย่างน้อยหนึ่งอย่าง
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setTransferTarget(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-bold text-gray-500"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleTransfer}
                disabled={busy}
                className="rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand/90 disabled:bg-gray-300"
              >
                {processing ? "กำลังบันทึก..." : "ยืนยันการโอน"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
