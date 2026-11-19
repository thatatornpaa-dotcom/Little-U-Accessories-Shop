"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { message, Spin } from "antd";
import { orderService } from "../../../../services/api";

import OrderHeader from "@/components/dashboard/orders/OrderHeader";
import CustomerDetailsCard from "@/components/dashboard/orders/CustomerDetailsCard";
import PaymentDetailsCard from "@/components/dashboard/orders/PaymentDetailsCard";
import OrderUpdatePanel from "@/components/dashboard/orders/OrderUpdatePanel";
import OrderItemsSection from "@/components/dashboard/orders/OrderItemsSection";
import PrintableReceipt from "@/components/dashboard/orders/PrintableReceipt";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "รอชำระเงิน", color: "warning" },
  { value: "PAID", label: "ชำระเงินแล้ว", color: "processing" },
  { value: "PRODUCING", label: "กำลังผลิต", color: "purple" },
  { value: "SHIPPED", label: "จัดส่งแล้ว", color: "blue" },
  { value: "DELIVERED", label: "ส่งสำเร็จ", color: "success" },
];

const TIMELINE_STEPS = [
  { key: "PENDING", label: "รับคำสั่งซื้อแล้ว" },
  { key: "PAID", label: "กำลังเตรียมสินค้า" },
  { key: "SHIPPED", label: "กำลังจัดส่ง" },
  { key: "DELIVERED", label: "จัดส่งสำเร็จ" },
];

const getStatusIndex = (status) => {
  const s = status?.toUpperCase();
  if (s === "PENDING") return 0;
  if (s === "PAID" || s === "PRODUCING") return 1;
  if (s === "SHIPPED") return 2;
  if (s === "DELIVERED") return 3;
  return -1;
};

function HorizontalTimeline({ status, updatedAt }) {
  const currentIndex = getStatusIndex(status);
  const isCancelled = status === "CANCELLED";

  if (isCancelled) {
    return (
      <div className="bg-rose-50 border border-rose-150/70 p-5 rounded-3xl flex items-center gap-3 no-print">
        <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-sm">
          ✕
        </div>
        <div>
          <h4 className="text-xs font-bold text-rose-950">คำสั่งซื้อนี้ถูกยกเลิก</h4>
          <p className="text-[10px] text-rose-600 font-medium">รายการจัดส่งและเตรียมสินค้าทั้งหมดถูกระงับ</p>
        </div>
      </div>
    );
  }

  return (
    <div className=" no-print">
      <div className="flex items-center justify-between gap-2 max-w-4xl mx-auto px-4">
        {TIMELINE_STEPS.map((step, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const isLast = idx === TIMELINE_STEPS.length - 1;

          return (
            <div key={step.key} className="flex-1 flex items-center last:flex-initial">
              <div className="flex flex-col items-center relative">
                {/* Circle step indicator */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    isDone
                      ? "bg-brand text-white shadow-2xs"
                      : "bg-neutral-50 text-neutral-400 border border-neutral-200"
                  }`}
                >
                  {isDone ? "✓" : idx + 1}
                </div>
                
                {/* Labels */}
                <div className="absolute top-10 whitespace-nowrap text-center flex flex-col items-center w-32 left-1/2 -translate-x-1/2">
                  <span className={`text-[14px] font-bold ${isDone ? "text-neutral-800" : "text-neutral-400"}`}>
                    {step.label}
                  </span>
                  {isCurrent && (
                    <span className="text-[12px] text-brand font-semibold mt-0.5 bg-brand/5 px-1.5 py-0.5 rounded-full border border-brand/10">
                      สถานะปัจจุบัน
                    </span>
                  )}
                  {idx === 0 && updatedAt && (
                    <span className="text-[9px] text-neutral-400 font-medium mt-0.5">
                      {new Date(updatedAt).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div className="flex-1 mx-4 h-0.5 relative bg-neutral-100">
                  <div
                    className="absolute inset-y-0 left-0 bg-brand transition-all duration-500"
                    style={{ width: idx < currentIndex ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Spacer to push label absolute positioning content down */}
      <div className="h-10" />
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Form states
  const [status, setStatus] = useState("PENDING");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("MockShipping");

  useEffect(() => {
    if (id) {
      loadOrderDetails();
    }
  }, [id]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await orderService.getAdminOrders();
      if (res.success && res.orders) {
        const foundOrder = res.orders.find((o) => o.id === id);
        if (foundOrder) {
          setOrder(foundOrder);
          setStatus(foundOrder.status);
          setTrackingNumber(foundOrder.shipping?.trackingNumber || "");
          setCarrier(foundOrder.shipping?.carrier || "MockShipping");
          return;
        }
      }

      // Fallback
      try {
        const resSingle = await orderService.getAdminOrderById(id);
        if (resSingle.success && resSingle.order) {
          setOrder(resSingle.order);
          setStatus(resSingle.order.status);
          setTrackingNumber(resSingle.order.shipping?.trackingNumber || "");
          setCarrier(resSingle.order.shipping?.carrier || "MockShipping");
          return;
        }
      } catch (singleErr) {
        console.warn("Direct fetch fallback failed:", singleErr);
      }

      message.error("ไม่พบข้อมูลคำสั่งซื้อนี้ในระบบ");
    } catch (err) {
      console.error("Error loading order:", err);
      message.error(err.message || "เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrder = async () => {
    try {
      setUpdating(true);
      const payload = {
        status,
        trackingNumber,
        carrier,
        shippingStatus: trackingNumber ? "IN_TRANSIT" : "PENDING",
      };

      const res = await orderService.updateAdminOrder(id, payload);
      if (res.success) {
        message.success("อัปเดตสถานะและข้อมูลจัดส่งเรียบร้อยแล้ว");
        loadOrderDetails();
      } else {
        message.error("อัปเดตไม่สำเร็จ");
      }
    } catch (err) {
      console.error("Error updating order:", err);
      message.error(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <Spin size="large" />
        <span className="mt-4 text-xs font-semibold text-neutral-400 tracking-wider uppercase">Loading Order Details</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-lg font-bold text-neutral-800">Order not found</div>
        <Link href="/dashboard/orders" className="mt-2 text-sm text-neutral-500 hover:text-black underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  // Calculations
  const subtotal = order.items?.reduce((acc, item) => {
    const itemBasePrice = Number(item.price);
    let itemTotalPrice = itemBasePrice * item.quantity;
    item.accessories?.forEach((accItem) => {
      itemTotalPrice += Number(accItem.price) * accItem.quantity;
    });
    return acc + itemTotalPrice;
  }, 0) || 0;

  const storedShippingFee = Number(order.shippingFee || 0);
  const derivedShippingFee = Math.max(
    0,
    Number(order.totalPrice || 0) - subtotal,
  );
  const shippingFee =
    storedShippingFee > 0 ? storedShippingFee : derivedShippingFee;
  const netTotal = Number(order.totalPrice || (subtotal + shippingFee));

  return (
    <div className="w-full px-8 space-y-8 font-sans antialiased text-neutral-900 pb-16">
      <style jsx global>{`
        @page {
          size: auto;
          margin: 0; /* Remove default headers/footers (URL, date, page numbers) */
        }
        @media print {
          .no-print, aside, header {
            display: none !important;
          }
          #print-area {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20mm !important; /* Set margin inside document so it doesn't touch the paper edge */
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

      {/* Wrapper to hide screen content on print */}
      <div className="space-y-8 no-print">
        {/* APPLE STYLE HEADER */}
        <OrderHeader
          order={order}
          statusOptions={STATUS_OPTIONS}
          onPrint={handlePrint}
        />

        <HorizontalTimeline
          status={order?.status}
          updatedAt={order?.updatedAt || order?.createdAt}
        />

        {/* APPLE STYLE 3-COLUMN METADATA GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
          {/* Column 1: Customer Details */}
          <CustomerDetailsCard order={order} />

          {/* Column 2: Payment Details */}
          <PaymentDetailsCard order={order} netTotal={netTotal} />

          {/* Column 3: Order Update Actions */}
          <OrderUpdatePanel
            status={status}
            setStatus={setStatus}
            carrier={carrier}
            setCarrier={setCarrier}
            trackingNumber={trackingNumber}
            setTrackingNumber={setTrackingNumber}
            updating={updating}
            statusOptions={STATUS_OPTIONS}
            onUpdate={handleUpdateOrder}
          />
        </div>

        {/* APPLE STYLE ORDER ITEMS AREA */}
        <OrderItemsSection
          order={order}
          subtotal={subtotal}
          shippingFee={shippingFee}
          netTotal={netTotal}
        />
      </div>

      {/* ======================================================== */}
      {/* PRINTABLE RECEIPT TEMPLATE (A4 Styled & Cleaned for Print) */}
      {/* ======================================================== */}
      <PrintableReceipt
        order={order}
        subtotal={subtotal}
        shippingFee={shippingFee}
        netTotal={netTotal}
      />
    </div>
  );
}
