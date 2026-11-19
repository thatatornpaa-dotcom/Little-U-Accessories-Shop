import { Select, Modal, Input } from "antd";

export default function AccessoriesSection({
  availableAccessories,
  selectedAccessoryIds,
  setSelectedAccessoryIds,
  isAccessoryModalOpen,
  setIsAccessoryModalOpen,
  accessorySearchQuery,
  setAccessorySearchQuery,
  activeAccessoryTab,
  setActiveAccessoryTab,
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider">
          วัสดุตกแต่งที่จะผูกกับสินค้านี้ (Accessories)
        </label>
        <button
          type="button"
          onClick={() => setIsAccessoryModalOpen(true)}
          className="px-4 py-2 bg-brand/10 hover:bg-brand/20 text-brand rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-95"
        >
          จัดการวัสดุตกแต่ง ({selectedAccessoryIds.length} ชิ้น)
        </button>
      </div>

      {selectedAccessoryIds.length === 0 ? (
        <div className="p-4 bg-gray-55 border border-dashed border-gray-200 rounded-2xl text-xs text-gray-400 text-center">
          ยังไม่มีการผูกวัสดุตกแต่ง — คลิกที่ปุ่มด้านบนเพื่อเลือก
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto p-4 border border-neutral-200/80 rounded-2xl bg-white shadow-2xs">
          {availableAccessories
            .filter((acc) => selectedAccessoryIds.includes(acc.id))
            .map((acc) => (
              <div
                key={acc.id}
                className="flex items-center gap-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/85 rounded-xl pl-2 pr-3 py-1.5 text-xs transition-all"
              >
                {acc.imageUrl ? (
                  <img
                    src={acc.imageUrl}
                    alt={acc.name}
                    className="w-6 h-6 rounded-md object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-md bg-neutral-250 flex items-center justify-center text-[8px] text-neutral-450 font-bold flex-shrink-0">
                    No Img
                  </div>
                )}
                <div className="min-w-0 max-w-[120px]">
                  <div className="font-semibold text-neutral-700 truncate">{acc.name}</div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedAccessoryIds(
                      selectedAccessoryIds.filter((id) => id !== acc.id)
                    )
                  }
                  className="text-neutral-400 hover:text-rose-500 font-bold text-xs cursor-pointer ml-1 active:scale-90"
                >
                  ✕
                </button>
              </div>
            ))}
        </div>
      )}

      {/* Accessory Selector Modal */}
      <Modal
        title={
          <div className="pb-3 border-b border-neutral-100">
            <h3 className="text-base font-bold text-neutral-800">เลือกวัสดุตกแต่ง (Manage Accessories)</h3>
            <p className="text-xs text-neutral-400 font-normal mt-0.5">
              เลือกของตกแต่งที่ต้องการผูกกับสินค้าชิ้นนี้
            </p>
          </div>
        }
        open={isAccessoryModalOpen}
        onCancel={() => setIsAccessoryModalOpen(false)}
        footer={[
          <button
            key="close"
            type="button"
            onClick={() => setIsAccessoryModalOpen(false)}
            className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-[0.97]"
          >
            ยืนยันการเลือก ({selectedAccessoryIds.length} รายการ)
          </button>
        ]}
        width={800}
        centered
      >
        <div className="py-4 space-y-4">
          {/* Category selector & Search bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="w-full sm:w-48 flex-shrink-0">
              <Select
                value={activeAccessoryTab}
                onChange={setActiveAccessoryTab}
                className="w-full h-10 text-xs"
                options={[
                  { value: "ALL", label: "ทุกหมวดหมู่" },
                  { value: "CHARM", label: "จี้ประดับ (Charm)" },
                  { value: "BEAD", label: "ลูกปัดหินนำโชค (Bead)" },
                  { value: "CORD", label: "เชือกถัก/สายรัด (Cord)" },
                ]}
              />
            </div>
            <div className="flex-1">
              <Input.Search
                placeholder="ค้นหาชื่อวัสดุตกแต่ง..."
                value={accessorySearchQuery}
                onChange={(e) => setAccessorySearchQuery(e.target.value)}
                className="h-10 w-full"
                allowClear
              />
            </div>
          </div>

          {/* Select All / Deselect All Controls */}
          {(() => {
            const filteredList = availableAccessories.filter((acc) => {
              const catMatch = activeAccessoryTab === "ALL" || acc.category?.name === activeAccessoryTab;
              const searchMatch = !accessorySearchQuery || acc.name.toLowerCase().includes(accessorySearchQuery.toLowerCase());
              return catMatch && searchMatch;
            });

            const isAllSelected = filteredList.length > 0 && filteredList.every(acc => selectedAccessoryIds.includes(acc.id));

            const toggleSelectAll = () => {
              if (isAllSelected) {
                // Deselect all in the filtered list
                const filteredIds = filteredList.map(acc => acc.id);
                setSelectedAccessoryIds(prev => prev.filter(id => !filteredIds.includes(id)));
              } else {
                // Select all in the filtered list
                const filteredIds = filteredList.map(acc => acc.id);
                setSelectedAccessoryIds(prev => Array.from(new Set([...prev, ...filteredIds])));
              }
            };

            return (
              <div className="flex items-center justify-between text-xs text-neutral-500 bg-neutral-55 px-4 py-2 rounded-xl border border-neutral-200/60">
                <span>แสดงทั้งหมด {filteredList.length} รายการ</span>
                {filteredList.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-brand font-bold hover:underline cursor-pointer flex items-center gap-1 active:scale-95"
                  >
                    {isAllSelected ? "ยกเลิกการเลือกทั้งหมด" : "เลือกทั้งหมดในหมวดหมู่นี้"}
                  </button>
                )}
              </div>
            );
          })()}

          {/* Accessories Grid */}
          <div className="max-h-[350px] overflow-y-auto p-1 space-y-4">
            {(() => {
              const filteredList = availableAccessories.filter((acc) => {
                const catMatch = activeAccessoryTab === "ALL" || acc.category?.name === activeAccessoryTab;
                const searchMatch = !accessorySearchQuery || acc.name.toLowerCase().includes(accessorySearchQuery.toLowerCase());
                return catMatch && searchMatch;
              });

              if (filteredList.length === 0) {
                return (
                  <div className="py-12 text-center text-xs text-neutral-400 font-medium">
                    ไม่พบของตกแต่งที่ตรงกับเงื่อนไขการค้นหา
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredList.map((acc) => {
                    const isSelected = selectedAccessoryIds.some(
                      (id) => String(id) === String(acc.id),
                    );
                    const toggleSelect = () => {
                      if (isSelected) {
                        setSelectedAccessoryIds(
                          selectedAccessoryIds.filter(
                            (id) => String(id) !== String(acc.id),
                          ),
                        );
                      } else {
                        setSelectedAccessoryIds([
                          ...selectedAccessoryIds,
                          acc.id,
                        ]);
                      }
                    };
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={toggleSelect}
                        className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? "border-brand bg-brand/10 text-brand font-bold shadow-2xs scale-[0.98] active:scale-95"
                            : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 font-medium hover:bg-neutral-50/50 active:scale-98"
                        }`}
                      >
                        {acc.imageUrl ? (
                          <img
                            src={acc.imageUrl}
                            alt={acc.name}
                            className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-[10px] text-neutral-400 font-bold flex-shrink-0">
                            No Img
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-xs truncate">
                            {acc.name}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-normal">
                            คงเหลือ {acc.stock} ชิ้น
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </Modal>
    </div>
  );
}
