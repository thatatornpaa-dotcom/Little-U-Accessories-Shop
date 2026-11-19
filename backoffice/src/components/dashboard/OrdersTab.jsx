import { useState, useEffect } from "react";
import Link from "next/link";
import { Table, Input, Select, Tag, Popover, message, Pagination } from "antd";
import { orderService } from "../../services/api";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "รอชำระเงิน (PENDING)", color: "gold" },
  { value: "PAID", label: "ชำระเงินแล้ว (PAID)", color: "cyan" },
  { value: "PRODUCING", label: "กำลังผลิต (PRODUCING)", color: "purple" },
  { value: "SHIPPED", label: "จัดส่งแล้ว (SHIPPED)", color: "blue" },
  { value: "DELIVERED", label: "ส่งสำเร็จ (DELIVERED)", color: "green" },
];

export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getAdminOrders();
      if (res.success) {
        setOrders(res.orders || []);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
      message.error(err.message || "ไม่สามารถดึงข้อมูลคำสั่งซื้อได้");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      const res = await orderService.updateAdminOrder(orderId, { status: newStatus });
      if (res.success) {
        message.success("อัปเดตสถานะคำสั่งซื้อเรียบร้อย");
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      console.error("Failed to update order status:", err);
      message.error(err.message || "ไม่สามารถอัปเดตสถานะได้");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateTracking = async (orderId, trackingNumber, carrier = "MockShipping") => {
    try {
      setUpdatingId(orderId);
      const res = await orderService.updateAdminOrder(orderId, {
        trackingNumber,
        carrier,
        shippingStatus: trackingNumber ? "IN_TRANSIT" : "PENDING"
      });
      if (res.success) {
        message.success("อัปเดตเลขพัสดุเรียบร้อย");
        setOrders((prev) =>
          prev.map((o) => {
            if (o.id === orderId) {
              return {
                ...o,
                shipping: {
                  ...o.shipping,
                  trackingNumber,
                  carrier,
                  status: trackingNumber ? "IN_TRANSIT" : o.shipping?.status
                }
              };
            }
            return o;
          })
        );
      }
    } catch (err) {
      console.error("Failed to update tracking number:", err);
      message.error(err.message || "ไม่สามารถอัปเดตเลขพัสดุได้");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const customerName = `${o.user?.firstName || o.recipientName || ""} ${o.user?.lastName || ""}`.toLowerCase();
    const phone = o.recipientPhone || o.user?.phone || "";
    const orderId = o.id.toLowerCase();
    const matchesSearch =
      !searchText ||
      customerName.includes(searchText.toLowerCase()) ||
      phone.includes(searchText) ||
      orderId.includes(searchText.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + pageSize);

  const columns = [
    {
      title: "รหัสคำสั่งซื้อ",
      dataIndex: "id",
      key: "id",
      width: 140,
      render: (id, record) => (
        <div>
          <Link href={`/dashboard/orders/${id}`} className="font-mono text-xs font-bold text-brand hover:text-brand/80 hover:underline uppercase block truncate w-28" title={id}>
            #{id.slice(0, 8)}...
          </Link>
          <span className="text-[11px] text-gray-400 font-medium">
            {new Date(record.createdAt).toLocaleDateString("th-TH", {
              day: "numeric",
              month: "short",
              year: "2-digit",
              hour: "2-digit",
              minute: "2-digit"
            })}
          </span>
        </div>
      ),
    },
    {
      title: "ผู้สั่งซื้อ / ที่อยู่จัดส่ง",
      key: "customer",
      width: 220,
      render: (_, record) => {
        const name = record.recipientName || `${record.user?.firstName || ""} ${record.user?.lastName || ""}`.trim() || "ลูกค้าทั่วไป";
        const phone = record.recipientPhone || record.user?.phone || "-";
        return (
          <div>
            <div className="font-bold text-gray-800 text-sm">{name}</div>
            <div className="text-xs text-gray-500">{phone}</div>
            <Popover
              content={<div className="max-w-xs text-xs text-gray-700">{record.shippingAddress}</div>}
              title="ที่อยู่จัดส่ง"
              trigger="hover"
            >
              <div className="text-[11px] text-brand hover:underline cursor-pointer truncate max-w-[200px] flex items-center gap-1">
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">{record.shippingAddress}</span>
              </div>
            </Popover>
          </div>
        );
      },
    },
    {
      title: "รายการสินค้า",
      key: "items",
      width: 200,
      render: (_, record) => (
        <div className="space-y-1">
          {record.items && record.items.length > 0 ? (
            record.items.map((item, idx) => (
              <div key={idx} className="text-xs text-gray-700 leading-tight">
                • <strong className="text-gray-900">{item.product?.name || "สินค้า"}</strong> x{item.quantity}
                {item.accessories && item.accessories.length > 0 && (
                  <span className="text-[10px] text-gray-500 block pl-3">
                    + วัสดุ: {item.accessories.map((a) => a.accessory?.name).join(", ")}
                  </span>
                )}
              </div>
            ))
          ) : (
            <span className="text-xs text-gray-400">ไม่มีรายการสินค้า</span>
          )}
        </div>
      ),
    },
    {
      title: "ราคารวม (THB)",
      dataIndex: "totalPrice",
      key: "totalPrice",
      width: 130,
      render: (price) => (
        <span className="font-extrabold text-brand text-sm">
          ฿{parseFloat(price || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: "สถานะคำสั่งซื้อ",
      dataIndex: "status",
      key: "status",
      width: 170,
      render: (status, record) => {
        const option = STATUS_OPTIONS.find((s) => s.value === status) || { color: "default", label: status };
        return (
          <Select
            value={status}
            onChange={(val) => handleUpdateStatus(record.id, val)}
            loading={updatingId === record.id}
            size="small"
            className="w-full text-xs"
            options={STATUS_OPTIONS.map((opt) => ({
              value: opt.value,
              label: (
                <Tag color={opt.color} className="mr-0 border-0 font-semibold text-[11px]">
                  {opt.value}
                </Tag>
              )
            }))}
          />
        );
      },
    },
    {
      title: "เลขพัสดุ (Tracking)",
      key: "tracking",
      width: 220,
      render: (_, record) => (
        <TrackingInput
          initialTracking={record.shipping?.trackingNumber || ""}
          initialCarrier={record.shipping?.carrier || "MockShipping"}
          onSave={(tracking, carrier) => handleUpdateTracking(record.id, tracking, carrier)}
          loading={updatingId === record.id}
        />
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs w-full h-full flex flex-col min-h-0 overflow-hidden">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 shrink-0">
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">คำสั่งซื้อของลูกค้า (Orders)</h3>
          <p className="text-sm text-gray-500">จัดการออเดอร์ ติดตามการชำระเงิน และกรอกเลขพัสดุจัดส่ง</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            className="w-36"
            options={[
              { value: "ALL", label: "สถานะทั้งหมด" },
              ...STATUS_OPTIONS
            ]}
          />
          <Input.Search
            placeholder="ค้นหารหัส / ชื่อลูกค้า / เบอร์..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full sm:w-64"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 w-full min-h-0 overflow-hidden flex flex-col">
        <Table
          dataSource={paginatedOrders}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ y: "calc(100vh - 350px)", x: 1000 }}
          className="font-sans [&_*]:!font-sans border border-gray-100 rounded-lg w-full flex-1"
        />
      </div>

      {/* Dedicated Standalone Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-2 border-t border-gray-100 shrink-0">
        <div className="text-sm text-gray-500 font-medium">
          แสดง {filteredOrders.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + pageSize, filteredOrders.length)} จากทั้งหมด {filteredOrders.length} รายการ
        </div>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={filteredOrders.length}
          showSizeChanger
          pageSizeOptions={["10", "20", "50", "100"]}
          showQuickJumper
          onChange={(page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          }}
          className="font-sans [&_*]:!font-sans"
        />
      </div>
    </div>
  );
}

// Sub-component for editing Tracking Number
function TrackingInput({ initialTracking, initialCarrier, onSave, loading }) {
  const [tracking, setTracking] = useState(initialTracking);
  const [carrier, setCarrier] = useState(initialCarrier || "Kerry Express");
  const [isEditing, setIsEditing] = useState(!initialTracking);

  useEffect(() => {
    setTracking(initialTracking);
  }, [initialTracking]);

  const handleSave = () => {
    if (tracking !== initialTracking || carrier !== initialCarrier) {
      onSave(tracking, carrier);
    }
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-1.5">
      <Input
        size="small"
        placeholder="เลขพัสดุ (เช่น TH123456)"
        value={tracking}
        onChange={(e) => setTracking(e.target.value)}
        onBlur={handleSave}
        onPressEnter={handleSave}
        className="text-xs font-mono"
      />
      {tracking && (
        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 whitespace-nowrap">
          บันทึกแล้ว
        </span>
      )}
    </div>
  );
}
