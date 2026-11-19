export default function CustomOptionsSection({
  category,
  customOptions,
  setCustomOptions,
  showCustomManager,
  setShowCustomManager,
}) {
  return (
    <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-2xs space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            ตัวเลือกการ Custom สินค้า (Custom Options)
          </h4>
          <p className="text-[11px] text-neutral-500 font-medium mt-1">
            กำหนดกลุ่มตัวเลือกที่ลูกค้าสามารถเลือกได้เมื่อสั่งทำ เช่น ขนาด, วัสดุห่วง
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCustomManager(!showCustomManager)}
          className="px-4 py-2 bg-brand/10 hover:bg-brand/20 text-brand rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-95"
        >
          จัดการตัวเลือกคัสตอม
        </button>
      </div>

      {showCustomManager && (
        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-3 shadow-xs">
          <h5 className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
            เลือกตัวเลือกที่ต้องการเปิดใช้งาน:
          </h5>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <span className="text-xs text-neutral-500 font-bold bg-neutral-55 px-2.5 py-1 rounded-lg border border-neutral-200">
              ขนาดของสินค้าถูกกำหนดตามหมวดหมู่โดยอัตโนมัติ ({category === "BRACELET" ? "ขนาดข้อมือ" : "ขนาดข้อเท้า"})
            </span>
            <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 cursor-pointer">
              <input
                type="checkbox"
                checked={customOptions.some(
                  (opt) =>
                    opt.name.includes("วัสดุห่วงเชื่อม") ||
                    opt.name.includes("Material") ||
                    opt.name === "วัสดุห่วงเชื่อม / โซ่ปรับระดับ",
                )}
                onChange={(e) => {
                  if (e.target.checked) {
                    setCustomOptions((prev) => [
                      ...prev,
                      {
                        name: "วัสดุห่วงเชื่อม / โซ่ปรับระดับ",
                        required: true,
                        values: [
                          { name: "Silver", priceAdjustment: 0 },
                          { name: "Gold", priceAdjustment: 0 },
                          { name: "Rose Gold", priceAdjustment: 0 },
                        ],
                      },
                    ]);
                  } else {
                    setCustomOptions((prev) =>
                      prev.filter(
                        (opt) =>
                          !opt.name.includes("วัสดุห่วงเชื่อม") &&
                          !opt.name.includes("Material") &&
                          opt.name !== "วัสดุห่วงเชื่อม / โซ่ปรับระดับ",
                      ),
                    );
                  }
                }}
                className="rounded border-neutral-300 text-brand focus:ring-brand w-4 h-4 cursor-pointer"
              />
              วัสดุห่วงเชื่อม / โซ่ปรับระดับ
            </label>
          </div>
        </div>
      )}

      {/* Options list */}
      {customOptions.map((opt, optIdx) => (
        <div
          key={optIdx}
          className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/60 shadow-2xs space-y-3"
        >
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={opt.name}
              onChange={(e) => {
                const newOpts = [...customOptions];
                newOpts[optIdx].name = e.target.value;
                setCustomOptions(newOpts);
              }}
              placeholder="ชื่อหัวข้อตัวเลือก เช่น ขนาดข้อมือ, วัสดุ"
              className="flex-1 text-xs font-bold border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:border-brand font-sans"
            />
            <button
              type="button"
              onClick={() =>
                setCustomOptions(
                  customOptions.filter((_, idx) => idx !== optIdx),
                )
              }
              className="text-xs text-rose-500 hover:text-rose-700 font-bold px-2 py-1 cursor-pointer active:scale-95 transition-transform"
            >
              ลบหมวดนี้
            </button>
          </div>

          {/* Values list */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              รายการตัวเลือกย่อย:
            </span>
            <div className="flex flex-wrap gap-2">
              {opt.values.map((val, valIdx) => (
                <div
                  key={valIdx}
                  className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200/80 rounded-full pl-3 pr-2 py-1 text-xs transition-all hover:bg-neutral-100"
                >
                  <input
                    type="text"
                    value={val.name}
                    onChange={(e) => {
                      const newOpts = [...customOptions];
                      newOpts[optIdx].values[valIdx].name =
                        e.target.value;
                      setCustomOptions(newOpts);
                    }}
                    className="w-16 text-xs bg-transparent border-0 font-bold text-neutral-700 focus:outline-none"
                    placeholder="ตัวเลือก"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newOpts = [...customOptions];
                      newOpts[optIdx].values = newOpts[
                        optIdx
                      ].values.filter((_, idx) => idx !== valIdx);
                      setCustomOptions(newOpts);
                    }}
                    className="w-4 h-4 rounded-full bg-neutral-200 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center text-neutral-400 transition-colors font-bold text-[9px] cursor-pointer ml-1 active:scale-90"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newOpts = [...customOptions];
                  newOpts[optIdx].values.push({
                    name: "ตัวเลือกใหม่",
                    priceAdjustment: 0,
                  });
                  setCustomOptions(newOpts);
                }}
                className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full text-xs font-bold cursor-pointer transition-colors active:scale-95"
              >
                + เพิ่มตัวเลือก
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
