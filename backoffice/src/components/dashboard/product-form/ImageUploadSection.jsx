export default function ImageUploadSection({
  coverImage,
  galleryImages,
  uploading,
  currentCroppingItem,
  handleFileSelection,
  handleRemoveCover,
  handleRemoveGallery,
}) {
  return (
    <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-2xs space-y-6">
      <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
        รูปภาพและสื่อประชาสัมพันธ์ (Media)
      </h4>

      {/* Cover Image — independent upload */}
      <div>
        <span className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
          รูปหน้าปกสินค้า (อัตราส่วน 1:1)
        </span>
        <label className="aspect-square w-full max-w-[400px] rounded-2xl overflow-hidden border border-dashed border-neutral-300 bg-neutral-50 hover:bg-neutral-100/60 relative cursor-pointer transition-all duration-350 flex items-center justify-center group hover:border-brand active:scale-[0.99] block">
          {uploading && currentCroppingItem?.target === "cover" ? (
            <span className="text-xs text-neutral-400 animate-pulse">
              กำลังอัปโหลด...
            </span>
          ) : coverImage ? (
            <div className="relative w-full h-full group/cover">
              <img
                src={typeof coverImage === "string" ? coverImage : coverImage.preview}
                alt="Cover"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                <span className="bg-white/90 text-gray-800 text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-xs hover:bg-white active:scale-95 transition-all">
                  เปลี่ยนรูปปก
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemoveCover();
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  ลบรูปปก
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center p-6 text-neutral-450 group-hover:text-neutral-600 transition-colors duration-200">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-2xs flex items-center justify-center mx-auto mb-3 border border-neutral-200 group-hover:scale-105 transition-transform duration-250">
                <svg className="w-6 h-6 text-neutral-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs font-bold text-neutral-700 block">อัปโหลดรูปหน้าปก</span>
              <span className="text-[10px] text-neutral-400 block mt-1">ขนาดแนะนำ 1:1 (สี่เหลี่ยมจัตุรัส)</span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileSelection(e, "cover")}
            className="hidden"
          />
        </label>
      </div>

      {/* Gallery Images — separate from cover */}
      <div>
        <span className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2.5">
          รูปสินค้าเพิ่มเติม (Gallery)
        </span>
        <div className="flex flex-wrap gap-3 items-center">
          {galleryImages.map((img, idx) => (
            <div
              key={idx}
              className="relative group w-20 h-20 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50"
            >
              <img
                src={typeof img === "string" ? img : img.preview}
                alt="gallery"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemoveGallery(idx)}
                className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-[10px] font-bold cursor-pointer"
              >
                ลบรูป
              </button>
            </div>
          ))}

          <label className="w-20 h-20 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 hover:border-brand bg-neutral-50 hover:bg-brand/5 cursor-pointer active:scale-95 transition-all">
            <span className="text-xl text-neutral-450 font-bold">+</span>
            <span className="text-[10px] text-neutral-450 font-bold mt-0.5">
              ลงรูป
            </span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileSelection(e, "gallery")}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
