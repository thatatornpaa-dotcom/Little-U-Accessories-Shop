"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { settingsService } from "../../../../services/api";
import { useAuth } from "../../../../context/AuthContext";
import {
  ArrowLeft01Icon,
  MoneyBag02Icon,
  RefreshIcon,
} from "hugeicons-react";

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

export default function PlatformSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin";

  const [gpPercent, setGpPercent] = useState("");
  const [shippingFee, setShippingFee] = useState("");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("");
  const [sampleAmount, setSampleAmount] = useState("1000");
  const [version, setVersion] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [conflict, setConflict] = useState(false);

  const applySettings = useCallback((settings) => {
    setGpPercent(
      String(
        Math.round(Number(settings.commissionRate || 0) * 100 * 100) / 100,
      ),
    );
    setShippingFee(String(Number(settings.shippingFee || 0)));
    setFreeShippingThreshold(String(Number(settings.freeShippingThreshold || 0)));
    setVersion(settings.version ?? null);
    setUpdatedAt(settings.updatedAt || null);
  }, []);

  const loadSettings = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setConflict(false);
    try {
      const data = await settingsService.getSettings();
      applySettings(data.settings || {});
    } catch (err) {
      setVersion(null);
      setError(err.message || "ไม่สามารถดึงการตั้งค่าแพลตฟอร์มได้");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, applySettings]);

  useEffect(() => {
    const timer = setTimeout(() => loadSettings(), 0);
    return () => clearTimeout(timer);
  }, [loadSettings]);

  const validate = () => {
    const gp = Number(gpPercent);
    const shipping = Number(shippingFee);
    const threshold = Number(freeShippingThreshold);

    if (gpPercent === "" || !Number.isFinite(gp) || gp < 0 || gp > 100) {
      return "GP ต้องอยู่ระหว่าง 0% ถึง 100%";
    }
    if (
      shippingFee === "" ||
      !Number.isFinite(shipping) ||
      shipping < 0
    ) {
      return "ค่าส่งต้องเป็นจำนวนเงินที่ไม่ติดลบ";
    }
    if (
      freeShippingThreshold === "" ||
      !Number.isFinite(threshold) ||
      threshold < 0
    ) {
      return "ยอดขั้นต่ำฟรีส่งต้องไม่ติดลบ";
    }
    return "";
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (version === null) {
      setError("กรุณาโหลดการตั้งค่าล่าสุดก่อนบันทึก");
      setSuccess("");
      return;
    }

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    setConflict(false);
    try {
      const data = await settingsService.updateSettings({
        commissionRate: Number(gpPercent) / 100,
        shippingFee: Number(shippingFee),
        freeShippingThreshold: Number(freeShippingThreshold),
        version,
      });
      applySettings(data.settings || {});
      setSuccess(
        data.message || "บันทึกการตั้งค่าแพลตฟอร์มแล้ว (มีผลกับออเดอร์ใหม่)",
      );
    } catch (err) {
      const message =
        err.message || "ไม่สามารถบันทึกการตั้งค่าแพลตฟอร์มได้";
      setError(message);
      if (message.includes("ถูกแก้ไขโดยผู้ใช้อื่น")) {
        setConflict(true);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs w-full text-center text-gray-400 py-16">
        สิทธิ์การเข้าถึงถูกจำกัด — เฉพาะผู้ดูแลระบบเท่านั้น
      </div>
    );
  }

  const gp = Number(gpPercent) || 0;
  const shipping = Number(shippingFee) || 0;
  const threshold = Number(freeShippingThreshold) || 0;
  const sample = Number(sampleAmount) || 0;
  const gpAmount = (sample * gp) / 100;
  const sellerReceives = sample - gpAmount;
  const buyerShipping = sample >= threshold ? 0 : shipping;

  return (
    <div className="w-full space-y-6">
      <button
        onClick={() => router.push("/dashboard/settings")}
        className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
      >
        <ArrowLeft01Icon size={14} />
        กลับไปหน้าตั้งค่า
      </button>

      <div>
        <h2 className="text-2xl font-extrabold text-brand">
          ตั้งค่าแพลตฟอร์ม (GP / ค่าส่ง)
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          กำหนดอัตราค่าธรรมเนียม GP และค่าจัดส่งที่ใช้กับออเดอร์ใหม่ทั่วทั้งแพลตฟอร์ม
        </p>
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
      {conflict && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <span>
            การตั้งค่าถูกแก้ไขโดยผู้ใช้อื่น — กรุณาโหลดข้อมูลล่าสุดก่อนบันทึกอีกครั้ง
          </span>
          <button
            onClick={loadSettings}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
          >
            <RefreshIcon size={14} />
            โหลดใหม่
          </button>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center text-sm text-gray-400">
          กำลังโหลดการตั้งค่า...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <form
            onSubmit={handleSave}
            className="xl:col-span-3 bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-5"
          >
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <MoneyBag02Icon size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800">
                  ค่าธรรมเนียมและค่าส่ง
                </h3>
                <p className="text-[11px] text-gray-400">
                  อัปเดตล่าสุด: {formatDateTime(updatedAt)}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600">
                GP ของแพลตฟอร์ม (%)
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={gpPercent}
                  onChange={(e) => setGpPercent(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand"
                  placeholder="5"
                />
                <span className="text-xs font-bold text-gray-400">%</span>
              </div>
              <p className="mt-1 text-[11px] text-gray-400">
                ตัวอย่าง: 5% หมายถึงหัก GP 5 บาทต่อยอดขาย 100 บาท
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600">
                ค่าจัดส่งต่อร้าน (บาท)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={shippingFee}
                onChange={(e) => setShippingFee(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600">
                ยอดขั้นต่ำสำหรับฟรีค่าส่ง (บาท)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand"
                placeholder="0"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                ยอดสินค้าของแต่ละร้านที่ถึงเกณฑ์นี้จะได้รับฟรีค่าส่ง
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={loadSettings}
                disabled={saving}
                className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:text-gray-300"
              >
                ยกเลิกการแก้ไข
              </button>
              <button
                type="submit"
                disabled={saving || version === null}
                className="rounded-lg bg-brand px-5 py-2 text-xs font-bold text-white hover:bg-brand/90 disabled:bg-gray-300"
              >
                {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
              </button>
            </div>
          </form>

          <div className="xl:col-span-2 space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-800">
                ตัวอย่างการคำนวณ
              </h3>
              <div>
                <label className="block text-xs font-bold text-gray-600">
                  ยอดขายสินค้า (บาท)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={sampleAmount}
                  onChange={(e) => setSampleAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </div>

              <div className="space-y-2 rounded-lg bg-gray-50 p-4 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <span>ยอดขายสินค้า</span>
                  <span className="font-bold text-gray-800">
                    {formatMoney(sample)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>GP {gp.toLocaleString("th-TH")}%</span>
                  <span className="font-bold text-rose-600">
                    -{formatMoney(gpAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                  <span>ร้านค้าได้รับ</span>
                  <span className="font-bold text-emerald-700">
                    {formatMoney(sellerReceives)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>ค่าส่งที่ผู้ซื้อจ่าย</span>
                  <span className="font-bold text-gray-800">
                    {formatMoney(buyerShipping)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>ยอดที่ผู้ซื้อจ่ายทั้งหมด</span>
                  <span className="font-bold text-brand">
                    {formatMoney(sample + buyerShipping)}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-gray-400">
                {sample >= threshold
                  ? `ยอดขายถึง ${formatMoney(threshold)} แล้ว จึงได้รับฟรีค่าส่ง`
                  : `อีก ${formatMoney(threshold - sample)} จะถึงยอดฟรีค่าส่ง`}
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-[11px] text-blue-700">
              การเปลี่ยนแปลงมีผลกับออเดอร์ใหม่เท่านั้น ออเดอร์ที่ชำระเงินแล้วจะใช้ค่าที่บันทึกไว้ตอนสร้างออเดอร์
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
