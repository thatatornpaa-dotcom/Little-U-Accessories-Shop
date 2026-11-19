export default function PaymentDetailsCard({ order, netTotal }) {
  return (
    <div className="bg-white border border-neutral-200/75 rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2 text-neutral-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <span className="text-[11px] font-bold uppercase tracking-wider">ธุรกรรมการชำระเงิน</span>
      </div>
      <div className="space-y-3">
        <div>
          <p className="text-[11px] text-neutral-400">ช่องทางชำระเงิน</p>
          <p className="text-sm font-semibold text-neutral-800">
            {order.payment?.paymentMethod === "PROMPT_PAY" || order.payment?.paymentMethod === "PROMPTPAY"
              ? "PromptPay QR"
              : order.payment?.paymentMethod || "PromptPay QR"}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-neutral-400">สถานะชำระเงิน</p>
          <div className="mt-1">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              order.payment?.status === "SUCCESS"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}>
              {order.payment?.status || "PENDING"}
            </span>
          </div>
        </div>
        <div>
          <p className="text-[11px] text-neutral-400">ยอดเงินเรียกชำระ</p>
          <p className="text-base font-bold text-neutral-900">
            ฿{parseFloat(order.payment?.amount || netTotal).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-neutral-400">ชำระเงินสำเร็จเมื่อ</p>
          <p className="text-xs font-medium text-neutral-600">
            {order.payment?.paidAt ? new Date(order.payment.paidAt).toLocaleString("th-TH") : "ยังไม่ได้รับการยืนยัน"}
          </p>
        </div>
      </div>
    </div>
  );
}
