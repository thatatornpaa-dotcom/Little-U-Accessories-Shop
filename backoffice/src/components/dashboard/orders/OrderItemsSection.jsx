import { Divider } from "antd";

// Clean SVG Icons
const SlidersIcon = () => (
  <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  </svg>
);

const GemIcon = () => (
  <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 13m8-13H4m16 0l-4 13M4 7l8 13M4 7l4 13" />
  </svg>
);

const TYPE_TRANSLATIONS = {
  READY_TO_SHIP: "สินค้าพร้อมส่ง",
  MADE_TO_ORDER: "สินค้าสั่งทำพิเศษ",
};

const CATEGORY_TRANSLATIONS = {
  BRACELET: "กำไลข้อมือ",
  ANKLET: "กำไลข้อเท้า",
};

export default function OrderItemsSection({ order, subtotal, shippingFee, netTotal }) {
  return (
    <div className="bg-white border border-neutral-200/75 rounded-3xl p-8 shadow-xs no-print space-y-6">
      <h3 className="text-lg font-semibold tracking-tight text-neutral-900">สินค้าในคำสั่งซื้อ</h3>

      <div className="divide-y divide-neutral-100">
        {order.items?.map((item, idx) => {
          const itemBasePrice = Number(item.price);
          let itemTotal = itemBasePrice * item.quantity;
          item.accessories?.forEach((accItem) => {
            itemTotal += Number(accItem.price) * accItem.quantity;
          });

          return (
            <div key={idx} className="py-6 first:pt-0 last:pb-0 flex flex-col md:flex-row justify-between gap-6">
              <div className="flex-1 space-y-3">
                <div>
                  <h4 className="text-base font-semibold text-neutral-900">{item.product?.name}</h4>
                  <div className="flex gap-1.5 mt-1">
                    <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
                      {TYPE_TRANSLATIONS[item.product?.type] || item.product?.type}
                    </span>
                    <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
                      {CATEGORY_TRANSLATIONS[item.product?.category] || item.product?.category}
                    </span>
                  </div>
                </div>

                {/* Grid for custom specifications and accessories details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
                  {/* Specifications details */}
                  {item.customDetails && Object.keys(item.customDetails).length > 0 && (
                    <div className="bg-neutral-50/75 border border-neutral-200/60 p-4 rounded-xl text-xs space-y-3 w-full">
                      <div className="flex items-center gap-2 font-semibold text-neutral-800 text-xs">
                        <SlidersIcon />
                        <span>สเปกสายรัดข้อเท้า / ข้อมือ</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        {Object.entries(item.customDetails).map(([k, v]) => {
                          let priceAdj = 0;
                          if (item.product?.customOptions) {
                            for (const opt of item.product.customOptions) {
                              const matchedVal = opt.values?.find(val => val.value === String(v));
                              if (matchedVal && matchedVal.priceAdjustment) {
                                priceAdj = Number(matchedVal.priceAdjustment);
                                break;
                              }
                            }
                          }
                          return (
                            <div key={k} className="border-l-2 border-neutral-300 pl-3">
                              <span className="text-neutral-500 block text-[10px] uppercase font-bold tracking-wider mb-0.5">{k}</span>
                              <span className="font-bold text-neutral-900 text-sm">
                                {String(v)}
                                {priceAdj > 0 && <span className="text-brand text-xs font-semibold ml-1">(+฿{priceAdj})</span>}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Accessories chosen */}
                  {item.accessories && item.accessories.length > 0 && (
                    <div className="bg-neutral-50/75 border border-neutral-200/60 p-4 rounded-xl text-xs space-y-3 w-full">
                      <div className="flex items-center gap-2 font-semibold text-neutral-800 text-xs">
                        <GemIcon />
                        <span>อะไหล่ & หินเสริมมงคล</span>
                      </div>
                      <div className="divide-y divide-neutral-100">
                        {item.accessories.map((acc, accIdx) => (
                          <div key={accIdx} className="flex justify-between items-center py-2 first:pt-0 last:pb-0">
                            <span className="text-neutral-700 font-semibold">{acc.accessory?.name} <span className="text-neutral-400 font-normal">(x{acc.quantity})</span></span>
                            <span className="font-bold text-neutral-900">+฿{(Number(acc.price) * acc.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex md:flex-col justify-between md:justify-start items-end gap-2 shrink-0 min-w-[150px]">
                <div className="text-right">
                  <p className="text-[11px] text-neutral-400">ราคาชิ้นพื้นฐาน</p>
                  <p className="text-sm font-semibold text-neutral-800">฿{itemBasePrice.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-neutral-400 font-medium">จำนวน</p>
                  <p className="text-sm font-bold text-neutral-900">x{item.quantity}</p>
                </div>
                <div className="text-right md:pt-4">
                  <p className="text-[11px] text-neutral-400 font-bold">ราคารวมรายการ</p>
                  <p className="text-base font-extrabold text-neutral-900">฿{itemTotal.toLocaleString()}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals Box */}
      <div className="border-t border-neutral-100 pt-6 flex justify-end">
        <div className="w-80 space-y-3 text-sm text-neutral-500">
          <div className="flex justify-between">
            <span>ราคารวมสินค้า:</span>
            <span className="font-semibold text-neutral-800">฿{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>ค่าจัดส่งพัสดุ:</span>
            <span className="font-semibold text-neutral-800">
              {shippingFee === 0 ? <span className="text-emerald-600 font-bold">ฟรีค่าจัดส่ง</span> : `฿${shippingFee}`}
            </span>
          </div>
          <Divider className="my-2 border-neutral-100" />
          <div className="flex justify-between text-base items-center">
            <strong className="text-neutral-900 font-semibold">ราคาสุทธิ:</strong>
            <strong className="text-neutral-950 text-xl font-bold">฿{netTotal.toLocaleString()}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
