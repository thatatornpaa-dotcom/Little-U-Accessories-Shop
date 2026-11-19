import { Select, Input, Button } from "antd";

export default function OrderUpdatePanel({
  status,
  setStatus,
  carrier,
  setCarrier,
  trackingNumber,
  setTrackingNumber,
  updating,
  statusOptions,
  onUpdate,
}) {
  return (
    <div className="bg-neutral-50/50 border border-neutral-200/75 rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2 text-neutral-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        </svg>
        <span className="text-[11px] font-bold uppercase tracking-wider">แผงควบคุมอัปเดตสถานะ</span>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">สถานะขั้นตอน</label>
          <Select
            value={status}
            onChange={setStatus}
            className="w-full rounded-lg"
            options={statusOptions}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">บริษัทขนส่ง</label>
          <Input
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            placeholder="เช่น Kerry, Flash, Thailand Post"
            className="rounded-lg h-9 border-neutral-200"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">หมายเลขจัดส่ง (Tracking)</label>
          <Input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="กรอก Tracking Number"
            className="rounded-lg h-9 font-mono border-neutral-200"
          />
        </div>
        <Button
          type="primary"
          onClick={onUpdate}
          loading={updating}
          className="w-full bg-neutral-900 hover:bg-neutral-800 border-0 text-white font-semibold h-10 rounded-full mt-2 cursor-pointer text-xs"
        >
          บันทึกข้อมูล
        </Button>
      </div>
    </div>
  );
}
