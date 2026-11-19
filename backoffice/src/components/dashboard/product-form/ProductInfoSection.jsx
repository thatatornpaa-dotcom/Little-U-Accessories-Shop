import { Select } from "antd";

export default function ProductInfoSection({
  name,
  setName,
  description,
  setDescription,
  price,
  setPrice,
  originalPrice,
  setOriginalPrice,
  stock,
  setStock,
  type,
  setType,
  category,
  setCategory,
}) {
  return (
    <div className="space-y-6">
      {/* Product Details Card */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-2xs space-y-6">
        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
          ข้อมูลสำคัญและตัวเลือกเสริม
        </h4>

        <div>
          <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
            ชื่อสินค้า
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="กรอกชื่อสินค้า..."
            className="w-full text-sm border border-neutral-200 hover:border-neutral-300 rounded-xl px-4 py-3 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand font-medium text-neutral-800 transition-colors duration-150"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
              ประเภทสินค้า
            </label>
            <Select
              value={type}
              onChange={(val) => {
                setType(val);
                if (val === "MADE_TO_ORDER") {
                  setStock("0");
                }
              }}
              className="w-full text-sm"
              size="large"
              options={[
                {
                  value: "READY_TO_SHIP",
                  label: "พร้อมส่ง (Ready to Ship)",
                },
                {
                  value: "MADE_TO_ORDER",
                  label: "สั่งทำพิเศษ (Made to Order)",
                },
              ]}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
              หมวดหมู่สินค้า
            </label>
            <Select
              value={category}
              onChange={(val) => setCategory(val)}
              className="w-full text-sm"
              size="large"
              options={[
                {
                  value: "BRACELET",
                  label: "กำไลข้อมือ (Bracelet)",
                },
                {
                  value: "ANKLET",
                  label: "กำไลข้อเท้า (Anklet)",
                },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
                  ราคาขายจริง (THB)
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  placeholder="เช่น 1290"
                  className="w-full text-sm border border-neutral-200 hover:border-neutral-300 rounded-xl px-4 py-3 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand font-semibold text-brand transition-colors duration-150"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
                  ราคาเต็มก่อนลด
                </label>
                <input
                  type="number"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="ไม่มีส่วนลด"
                  className="w-full text-sm border border-neutral-200 hover:border-neutral-300 rounded-xl px-4 py-3 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-neutral-500 font-medium line-through decoration-neutral-400 transition-colors duration-150"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
              จำนวน (สต็อก)
            </label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
              disabled={type === "MADE_TO_ORDER"}
              placeholder="เช่น 50"
              className="w-full text-sm border border-neutral-200 hover:border-neutral-300 rounded-xl px-4 py-3 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand disabled:bg-neutral-50 disabled:text-neutral-400 transition-colors duration-150"
            />
          </div>
        </div>

        {type === "MADE_TO_ORDER" && (
          <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-150/75 rounded-lg px-3 py-1.5 block font-semibold leading-relaxed">
            สินค้าสั่งทำพิเศษ (Made-to-order) จะถูกตั้งสต็อกเป็น 0 เสมอตามระบบงานคัสตอม
          </span>
        )}
      </div>

      {/* Description Card */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-2xs space-y-4">
        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider">
          รายละเอียดสินค้า (สไตล์เขียนบล็อก)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="เขียนรายละเอียดสินค้า บรรยายสรรพคุณ ลวดลาย การประกอบชิ้นส่วน..."
          className="w-full text-sm border border-neutral-200 hover:border-neutral-300 rounded-2xl px-5 py-4 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand h-48 leading-relaxed font-sans placeholder-neutral-300 transition-colors duration-150"
        />
      </div>
    </div>
  );
}
