import Cropper from "react-easy-crop";

export default function ImageCropperModal({
  currentCroppingItem,
  crop,
  zoom,
  setCrop,
  setZoom,
  onCropComplete,
  onCancel,
  onConfirm,
  uploading,
}) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[520px] transition-all duration-300 scale-100">
        <div className="p-5 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
          <div>
            <h3 className="font-bold text-neutral-850 text-sm">
              ปรับขนาดและครอบรูปภาพ (
              {currentCroppingItem.target === "cover" ? "รูปหน้าปก" : "รูปเพิ่มเติม"}
              )
            </h3>
            <p className="text-[11px] text-neutral-400 font-medium">
              ลากเพื่อย้ายตำแหน่ง หรือใช้แถบสไลด์ด้านล่างเพื่อซูม
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-neutral-400 hover:text-neutral-650 text-xs font-semibold cursor-pointer active:scale-95 transition-transform"
          >
            ยกเลิก
          </button>
        </div>

        {/* Cropper viewport */}
        <div className="flex-1 bg-neutral-900 relative">
          <Cropper
            image={currentCroppingItem.dataUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        {/* Controls and Actions */}
        <div className="p-6 border-t border-neutral-100 space-y-4 bg-neutral-50">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              ซูมภาพ
            </span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-label="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-brand"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-500 hover:bg-neutral-100 active:scale-[0.97] transition-all cursor-pointer"
            >
              ข้ามรูปนี้
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={uploading}
              className="px-6 py-2.5 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand/95 active:scale-[0.97] transition-all cursor-pointer disabled:bg-gray-300 shadow-xs"
            >
              {uploading ? "กำลังบันทึก..." : "ตกลง & บันทึกภาพ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
