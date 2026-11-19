export default function PrintableReceipt({ order, subtotal, shippingFee, netTotal }) {
  return (
    <div id="print-area" className="hidden print:block">
      <div className="max-w-[700px] mx-auto p-8 bg-white text-black text-sm">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-neutral-300 pb-5">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">BARE & BOLD</h1>
            <p className="text-[11px] text-neutral-500 mt-1">
              ระบบร้านค้าสร้อยข้อมือคัสตอมออนไลน์เฉพาะบุคคล<br />
              support@bareandbold.com | bareandbold.com
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">ใบเสร็จรับเงิน / ใบกำกับภาษีอย่างย่อ</h2>
            <p className="text-[11px] text-neutral-500 mt-1">
              <strong>เลขที่ออเดอร์:</strong> #{order.id}<br />
              <strong>วันที่พิมพ์:</strong> {new Date().toLocaleDateString("th-TH")}
            </p>
          </div>
        </div>

        {/* Customer Metadata */}
        <div className="grid grid-cols-2 gap-8 py-6 border-b border-neutral-200">
          <div>
            <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">ผู้ซื้อ / ผู้รับพัสดุ</h3>
            <p className="text-sm font-bold text-neutral-900">
              {order.recipientName || `${order.user?.firstName || ""} ${order.user?.lastName || ""}`}
            </p>
            <p className="text-xs text-neutral-600 mt-0.5">เบอร์โทร: {order.recipientPhone || order.user?.phone || "-"}</p>
            <p className="text-xs text-neutral-600 mt-0.5">อีเมล: {order.user?.email || "Guest Customer"}</p>
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">สถานที่จัดส่งปลายทาง</h3>
            <p className="text-xs text-neutral-800 leading-relaxed font-medium">
              {order.shippingAddress}
            </p>
            {order.shipping?.trackingNumber && (
              <p className="text-[11px] text-neutral-500 mt-2">
                <strong>ขนส่ง:</strong> {order.shipping?.carrier || "MockShipping"} | <strong>เลขพัสดุ:</strong> {order.shipping?.trackingNumber}
              </p>
            )}
          </div>
        </div>

        {/* Payment info block */}
        <div className="grid grid-cols-3 gap-4 py-3 bg-neutral-50 rounded-xl p-4 my-6 border border-neutral-100 text-xs">
          <div>
            <span className="text-neutral-400 block text-[10px] uppercase">สถานะชำระเงิน</span>
            <strong className="text-emerald-700 uppercase font-bold text-xs">{order.payment?.status || "SUCCESS"}</strong>
          </div>
          <div>
            <span className="text-neutral-400 block text-[10px] uppercase">ช่องทางชำระเงิน</span>
            <strong className="text-neutral-800 uppercase font-bold text-xs">PromptPay QR</strong>
          </div>
          <div>
            <span className="text-neutral-400 block text-[10px] uppercase">วันที่ยืนยันรายการ</span>
            <strong className="text-neutral-800 font-bold text-xs">
              {order.payment?.paidAt ? new Date(order.payment.paidAt).toLocaleDateString("th-TH") : new Date(order.createdAt).toLocaleDateString("th-TH")}
            </strong>
          </div>
        </div>

        {/* Items breakdown */}
        <table className="w-full text-xs text-left border-collapse my-6">
          <thead>
            <tr className="border-b border-neutral-300 text-neutral-400 font-bold uppercase tracking-wider">
              <th className="py-2.5">รายการสร้อยข้อมือคัสตอม / สำเร็จรูป</th>
              <th className="py-2.5 text-center w-16">จำนวน</th>
              <th className="py-2.5 text-right w-24">ราคา/ชิ้น</th>
              <th className="py-2.5 text-right w-24">รวมเงิน</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {order.items?.map((item, idx) => {
              const itemBasePrice = Number(item.price);
              let itemTotal = itemBasePrice * item.quantity;
              item.accessories?.forEach((accItem) => {
                itemTotal += Number(accItem.price) * accItem.quantity;
              });

              return (
                <tr key={idx}>
                  <td className="py-4 pr-3">
                    <div className="font-bold text-neutral-900 text-xs">{item.product?.name}</div>
                    {item.customDetails && Object.keys(item.customDetails).length > 0 && (
                      <div className="text-[10px] text-neutral-500 mt-1 pl-1.5 border-l-2 border-amber-200">
                        คัสตอม: {Object.entries(item.customDetails).map(([k, v]) => `${k}: ${v}`).join(" | ")}
                      </div>
                    )}
                    {item.accessories && item.accessories.length > 0 && (
                      <div className="text-[10px] text-neutral-500 mt-0.5 pl-1.5 border-l-2 border-neutral-200">
                        ตกแต่งเสริม: {item.accessories.map((a) => `${a.accessory?.name} (+฿${parseFloat(a.price).toFixed(2)})`).join(", ")}
                      </div>
                    )}
                  </td>
                  <td className="py-4 text-center font-bold text-neutral-800">{item.quantity}</td>
                  <td className="py-4 text-right text-neutral-700">฿{itemBasePrice.toLocaleString()}</td>
                  <td className="py-4 text-right font-bold text-neutral-900">฿{itemTotal.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t border-neutral-300 pt-4 flex justify-end">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-neutral-500">
              <span>ราคารวมสินค้า:</span>
              <span>฿{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>ค่าจัดส่ง:</span>
              <span>{shippingFee === 0 ? "ฟรี" : `฿${shippingFee}`}</span>
            </div>
            <div className="flex justify-between border-t border-neutral-200 pt-2 text-sm">
              <strong className="text-neutral-900 font-bold">ยอดสุทธิ:</strong>
              <strong className="text-neutral-900 font-extrabold text-base">฿{netTotal.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-[10px] text-neutral-400 mt-20 border-t border-neutral-200 pt-6">
          <p className="font-semibold text-neutral-500">THANK YOU FOR SUPPORTING BARE & BOLD</p>
          <p className="mt-1">ใบเสร็จรับเงินอย่างเป็นทางการสำหรับการสั่งซื้อเครื่องประดับสายงานทำมือ</p>
        </div>
      </div>
    </div>
  );
}
