import { Divider } from "antd";

export default function CustomerDetailsCard({ order }) {
  return (
    <div className="bg-white border border-neutral-200/75 rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2 text-neutral-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="text-[11px] font-bold uppercase tracking-wider">ข้อมูลผู้สั่งซื้อ</span>
      </div>
      <div className="space-y-3">
        <div>
          <p className="text-[11px] text-neutral-400">ชื่อผู้รับ</p>
          <p className="text-sm font-semibold text-neutral-800">
            {order.recipientName || `${order.user?.firstName || ""} ${order.user?.lastName || ""}`}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-neutral-400">เบอร์ติดต่อ</p>
          <p className="text-sm font-medium text-neutral-800">{order.recipientPhone || order.user?.phone || "-"}</p>
        </div>
        <div>
          <p className="text-[11px] text-neutral-400">อีเมล</p>
          <p className="text-xs font-mono text-neutral-600">{order.user?.email || "Guest User"}</p>
        </div>
        <Divider className="my-2 border-neutral-100" />
        <div>
          <p className="text-[11px] text-neutral-400 mb-1">ที่อยู่จัดส่ง</p>
          <p className="text-xs text-neutral-600 leading-relaxed font-medium bg-neutral-50 p-3 rounded-xl border border-neutral-100">
            {order.shippingAddress}
          </p>
        </div>
      </div>
    </div>
  );
}
