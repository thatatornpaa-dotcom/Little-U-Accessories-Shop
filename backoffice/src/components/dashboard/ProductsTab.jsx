"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Pagination,
  Popconfirm,
  Table,
  Tag,
  Input,
} from "antd";
import {
  moderationService,
  productService,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const STATUS_TABS = [
  { value: "", label: "ทั้งหมด" },
  { value: "VISIBLE", label: "แสดงอยู่" },
  { value: "HIDDEN", label: "ถูกซ่อน" },
  { value: "SUSPENDED", label: "ถูกระงับ" },
];

const MODERATION_BADGE = {
  VISIBLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  HIDDEN: "bg-amber-50 text-amber-700 border-amber-200",
  SUSPENDED: "bg-rose-50 text-rose-700 border-rose-200",
};

const MODERATION_LABEL = {
  VISIBLE: "แสดงอยู่",
  HIDDEN: "ถูกซ่อน",
  SUSPENDED: "ถูกระงับ",
};

const CATEGORY_LABEL = {
  BRACELET: "กำไลข้อมือ",
  ANKLET: "กำไลข้อเท้า",
  RING: "แหวน",
  NECKLACE: "สร้อยคอ",
};

const formatMoney = (value) =>
  `฿${Number(value || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export default function ProductsTab({ initialStatus = "" }) {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [productsData, setProductsData] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processing, setProcessing] = useState(false);

  const [detailTarget, setDetailTarget] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [reasonTarget, setReasonTarget] = useState(null);
  const [reason, setReason] = useState("");

  const refresh = () => setReloadToken((value) => value + 1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      setSearchText(searchInput.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      setProductsLoading(true);
      setError("");
      try {
        const res = await moderationService.getProducts({
          search: searchText,
          moderationStatus: statusFilter,
          page: currentPage,
          pageSize,
        });
        if (cancelled) return;
        setProductsData(
          (res.products || []).map((product) => ({
            ...product,
            price: Number(product.price) || 0,
            originalPrice:
              product.originalPrice !== null &&
              product.originalPrice !== undefined
                ? Number(product.originalPrice)
                : null,
          })),
        );
        setTotal(res.pagination?.total || 0);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "ไม่สามารถดึงรายการสินค้าได้");
        }
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    };

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [searchText, statusFilter, currentPage, pageSize, reloadToken]);

  const updateProductInline = async (id, changes) => {
    const product = productsData.find((item) => item.id === id);
    if (!product) return;

    const next = { ...product, ...changes };
    const parsedPrice = Number(next.price) || 0;
    const parsedOriginalPrice =
      next.originalPrice !== null &&
      next.originalPrice !== undefined &&
      next.originalPrice !== ""
        ? Number(next.originalPrice)
        : null;

    if (
      parsedOriginalPrice !== null &&
      parsedOriginalPrice <= parsedPrice
    ) {
      setError("ราคาเต็มก่อนลดต้องมากกว่าราคาขายจริงเท่านั้น");
      refresh();
      return;
    }

    setProductsData((prev) =>
      prev.map((item) => (item.id === id ? next : item)),
    );
    setError("");

    try {
      await productService.updateProduct(id, {
        name: next.name,
        price: parsedPrice,
        originalPrice: parsedOriginalPrice,
        stock: Math.max(0, Number(next.stock) || 0),
        type: next.type,
        category: next.category,
      });
    } catch (err) {
      setError(err.message || "ไม่สามารถอัปเดตสินค้าได้");
      refresh();
    }
  };

  const handleUpdateStock = async (record, delta) => {
    const currentStock = Number(record.stock) || 0;
    await updateProductInline(record.id, {
      stock: Math.max(0, currentStock + delta),
    });
  };

  const handleDeleteProduct = async (id) => {
    setProcessing(true);
    setError("");
    setSuccess("");
    try {
      await productService.deleteProduct(id);
      setSuccess("ลบสินค้าแล้ว");
      if (detailTarget?.id === id) {
        setDetailTarget(null);
        setDetailData(null);
      }
      refresh();
    } catch (err) {
      setError(err.message || "ไม่สามารถลบสินค้าได้");
    } finally {
      setProcessing(false);
    }
  };

  const openDetails = async (product) => {
    setDetailTarget(product);
    setDetailData(null);
    setDetailLoading(true);
    setError("");
    try {
      const res = await moderationService.getProductById(product.id);
      setDetailData(res.product);
    } catch (err) {
      setError(err.message || "ไม่สามารถดึงรายละเอียดสินค้าได้");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRestore = async (product) => {
    if (!confirm(`เปิดการมองเห็นสินค้า "${product.name}" ใช่หรือไม่?`)) return;
    setProcessing(true);
    setError("");
    setSuccess("");
    try {
      const res = await moderationService.moderateProduct(
        product.id,
        "RESTORE",
        "",
      );
      setSuccess(res.message || "เปิดการมองเห็นสินค้าแล้ว");
      refresh();
    } catch (err) {
      setError(err.message || "ไม่สามารถคืนสถานะสินค้าได้");
    } finally {
      setProcessing(false);
    }
  };

  const openReasonModal = (product, action) => {
    setReasonTarget({ product, action });
    setReason("");
  };

  const handleModerate = async () => {
    if (!reasonTarget) return;
    if (!reason.trim()) {
      setError("กรุณาระบุเหตุผลก่อนซ่อนหรือระงับสินค้า");
      return;
    }

    setProcessing(true);
    setError("");
    setSuccess("");
    try {
      const res = await moderationService.moderateProduct(
        reasonTarget.product.id,
        reasonTarget.action,
        reason.trim(),
      );
      setSuccess(res.message || "อัปเดตสถานะสินค้าแล้ว");
      setReasonTarget(null);
      refresh();
    } catch (err) {
      setError(err.message || "ไม่สามารถเปลี่ยนสถานะสินค้าได้");
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
    {
      title: "สินค้า",
      dataIndex: "name",
      key: "name",
      width: 310,
      render: (text, record) => (
        <div className="flex items-start gap-3 py-1.5">
          {record.images?.[0]?.url ? (
            <img
              src={record.images[0].url}
              alt={text}
              className="h-12 w-12 rounded-lg border border-gray-200 object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-lg">
              📦
            </div>
          )}
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => openDetails(record)}
              className="max-w-[230px] truncate text-left font-semibold text-gray-800 hover:text-brand hover:underline"
              title={text}
            >
              {text}
            </button>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                {CATEGORY_LABEL[record.category] || record.category || "—"}
              </span>
              {record.type === "MADE_TO_ORDER" ? (
                <Tag
                  color="gold"
                  className="rounded-full border-0 px-2.5 py-0.5 text-[10px] font-bold"
                >
                  สั่งทำพิเศษ
                </Tag>
              ) : (
                <Tag
                  color="cyan"
                  className="rounded-full border-0 px-2 py-0.5 text-[10px] font-medium"
                >
                  พร้อมส่ง
                </Tag>
              )}
            </div>
            <p className="mt-1 truncate text-[11px] text-gray-400">
              {record.shop ? `ร้าน ${record.shop.name}` : "สินค้าแพลตฟอร์ม"}
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "ราคาขายจริง",
      dataIndex: "price",
      key: "price",
      width: 130,
      render: (price, record) => (
        <Input
          type="number"
          value={price}
          onChange={(event) => {
            const value = parseFloat(event.target.value) || 0;
            setProductsData((prev) =>
              prev.map((item) =>
                item.id === record.id ? { ...item, price: value } : item,
              ),
            );
          }}
          onBlur={() =>
            updateProductInline(record.id, {
              price: record.price,
              originalPrice: record.originalPrice,
            })
          }
          onPressEnter={(event) => event.target.blur()}
          className="w-24 text-center font-semibold text-brand"
        />
      ),
    },
    {
      title: "ราคาเต็มก่อนลด",
      dataIndex: "originalPrice",
      key: "originalPrice",
      width: 140,
      render: (originalPrice, record) => (
        <Input
          type="number"
          value={
            originalPrice !== null && originalPrice !== undefined
              ? originalPrice
              : ""
          }
          placeholder="-"
          onChange={(event) => {
            const value =
              event.target.value === ""
                ? null
                : parseFloat(event.target.value);
            setProductsData((prev) =>
              prev.map((item) =>
                item.id === record.id
                  ? { ...item, originalPrice: value }
                  : item,
              ),
            );
          }}
          onBlur={() =>
            updateProductInline(record.id, {
              price: record.price,
              originalPrice: record.originalPrice,
            })
          }
          onPressEnter={(event) => event.target.blur()}
          className="w-24 text-center text-gray-500"
        />
      ),
    },
    {
      title: "สต็อก",
      key: "stock",
      width: 160,
      render: (_, record) => {
        const isMadeToOrder = record.type === "MADE_TO_ORDER";
        const stock = Number(record.stock) || 0;
        const color = stock > 20 ? "green" : stock > 0 ? "orange" : "red";

        return (
          <div>
            <Tag color={isMadeToOrder ? "gold" : color}>
              {isMadeToOrder ? "ไม่จำกัดสต็อก" : `${stock} ชิ้น`}
            </Tag>
            {!isMadeToOrder && (
              <div className="mt-2 flex items-center gap-1.5">
                <button
                  disabled={stock <= 0 || processing}
                  onClick={() => handleUpdateStock(record, -1)}
                  className="h-7 w-7 rounded-full border-0 bg-gray-100 text-base font-bold text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                  title="ลดสต็อก"
                >
                  -
                </button>
                <button
                  disabled={processing}
                  onClick={() => handleUpdateStock(record, 1)}
                  className="h-7 w-7 rounded-full border-0 bg-brand/10 text-base font-bold text-brand transition hover:bg-brand/20 disabled:cursor-not-allowed disabled:opacity-40"
                  title="เพิ่มสต็อก"
                >
                  +
                </button>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "สถานะสินค้า",
      key: "status",
      width: 190,
      render: (_, record) => {
        const moderationStatus = record.moderationStatus || "VISIBLE";
        return (
          <div>
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                MODERATION_BADGE[moderationStatus] ||
                "border-gray-200 bg-gray-50 text-gray-500"
              }`}
            >
              {MODERATION_LABEL[moderationStatus] || moderationStatus}
            </span>
            {!record.isActive && (
              <p className="mt-1.5 text-[10px] font-bold text-gray-400">
                Seller ปิดการขาย
              </p>
            )}
            {record.shop && (
              <p
                className={`mt-1 text-[10px] font-bold ${
                  record.shop.status === "SUSPENDED"
                    ? "text-rose-500"
                    : "text-gray-400"
                }`}
              >
                ร้าน: {record.shop.status}
              </p>
            )}
            {record.moderationReason && (
              <p className="mt-1.5 max-w-[170px] text-[10px] leading-4 text-rose-500">
                {record.moderationReason}
              </p>
            )}
            <p className="mt-1 text-[10px] text-gray-400">
              อัปเดต {formatDate(record.updatedAt || record.moderatedAt)}
            </p>
          </div>
        );
      },
    },
    {
      title: "จัดการ",
      key: "actions",
      width: 290,
      render: (_, record) => {
        const moderationStatus = record.moderationStatus || "VISIBLE";
        return (
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <button
              onClick={() => openDetails(record)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-[11px] font-bold text-gray-700 transition hover:bg-gray-100"
            >
              ดูรายละเอียด
            </button>
            <button
              onClick={() =>
                router.push(`/dashboard/products/edit?id=${record.id}`)
              }
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-gray-700 transition hover:bg-gray-50"
            >
              แก้ไข
            </button>

            {isAdmin && moderationStatus !== "VISIBLE" && (
              <button
                onClick={() => handleRestore(record)}
                disabled={processing}
                className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-700 disabled:bg-gray-300"
              >
                คืนสถานะ
              </button>
            )}

            {isAdmin && moderationStatus === "VISIBLE" && (
              <button
                onClick={() => openReasonModal(record, "HIDE")}
                disabled={processing}
                className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-bold text-amber-700 transition hover:bg-amber-100 disabled:text-gray-300"
              >
                ซ่อน
              </button>
            )}

            {isAdmin && moderationStatus !== "SUSPENDED" && (
              <button
                onClick={() => openReasonModal(record, "SUSPEND")}
                disabled={processing}
                className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 transition hover:bg-rose-100 disabled:text-gray-300"
              >
                ระงับ
              </button>
            )}

            <Popconfirm
              title="ลบสินค้านี้หรือไม่?"
              description="สินค้าจะถูกซ่อนจากระบบแบบ soft delete"
              onConfirm={() => handleDeleteProduct(record.id)}
              okText="ลบสินค้า"
              cancelText="ยกเลิก"
              okButtonProps={{ danger: true }}
            >
              <button
                disabled={processing}
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-gray-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:text-gray-300"
              >
                ลบ
              </button>
            </Popconfirm>
          </div>
        );
      },
    },
  ];

  const targetLabel = reasonTarget?.action === "HIDE" ? "ซ่อน" : "ระงับ";
  const detail =
    detailData ||
    detailTarget || {
      images: [],
      customOptions: [],
      accessories: [],
      _count: {},
    };

  return (
    <div className="mb-6 flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-6 pb-8 shadow-xs">
      <div className="mb-4 flex shrink-0 flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h3 className="mb-1 text-lg font-bold text-gray-800">
            ศูนย์จัดการสินค้า
          </h3>
          <p className="text-sm text-gray-500">
            ดูรายละเอียด แก้ไขราคา/สต็อก ซ่อน ระงับ และคืนสถานะสินค้าได้จากหน้านี้
          </p>
          {!isAdmin && (
            <p className="mt-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] font-semibold text-blue-700">
              คุณเป็น Staff — ดูรายละเอียดและแก้ไขข้อมูลได้
              แต่การซ่อน/ระงับ/คืนสถานะต้องเป็น Admin
            </p>
          )}
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <Input.Search
            placeholder="ค้นหาชื่อสินค้า หรือร้านค้า..."
            allowClear
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="w-full sm:w-72"
          />
          <button
            onClick={() => router.push("/dashboard/products/create")}
            className="shrink-0 whitespace-nowrap rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
          >
            + เพิ่มสินค้าใหม่
          </button>
        </div>
      </div>

      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value || "ALL"}
              onClick={() => {
                setCurrentPage(1);
                setStatusFilter(tab.value);
              }}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                statusFilter === tab.value
                  ? "bg-brand text-white"
                  : "border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="text-xs font-semibold text-gray-400">
          ทั้งหมด {total.toLocaleString("th-TH")} รายการ
        </span>
      </div>

      {error && (
        <div className="mb-4 shrink-0 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="mb-2 flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <Table
          dataSource={productsData}
          columns={columns}
          rowKey="id"
          loading={productsLoading}
          pagination={false}
          scroll={{ y: "calc(100vh - 500px)", x: 1450 }}
          locale={{ emptyText: "ไม่พบสินค้าที่ตรงกับเงื่อนไข" }}
          className="w-full flex-1 rounded-lg border border-gray-100 font-sans [&_*]:!font-sans"
        />
      </div>

      <div className="mt-auto flex shrink-0 flex-col items-center justify-between gap-3 border-t border-gray-100 pb-2 pt-4 sm:flex-row">
        <div className="text-sm font-medium text-gray-500">
          แสดง {total > 0 ? (currentPage - 1) * pageSize + 1 : 0} -{" "}
          {Math.min(currentPage * pageSize, total)} จากทั้งหมด {total} รายการ
        </div>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={total}
          showSizeChanger
          pageSizeOptions={["10", "20", "50", "100"]}
          showQuickJumper
          onChange={(page, size) => {
            setCurrentPage(size !== pageSize ? 1 : page);
            setPageSize(size);
          }}
          className="font-sans [&_*]:!font-sans"
        />
      </div>

      {reasonTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h4 className="text-lg font-bold text-gray-800">
              {targetLabel}สินค้า &quot;{reasonTarget.product.name}&quot;
            </h4>
            <p className="mt-1 text-xs text-gray-500">
              ร้านค้าจะเห็นเหตุผลนี้ และสินค้าจะไม่แสดงต่อผู้ซื้อ
            </p>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              placeholder="เช่น สินค้าผิดกฎหมาย / รูปภาพไม่เหมาะสม / ข้อมูลสินค้าเป็นเท็จ"
              className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setReasonTarget(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-bold text-gray-500"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleModerate}
                disabled={processing}
                className={`rounded-lg px-4 py-2 text-xs font-bold text-white disabled:bg-gray-300 ${
                  reasonTarget.action === "HIDE"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {processing
                  ? "กำลังดำเนินการ..."
                  : `ยืนยันการ${targetLabel}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 md:p-6">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
                  Product Details
                </p>
                <h4 className="mt-1 text-xl font-extrabold text-gray-800">
                  {detail.name || "รายละเอียดสินค้า"}
                </h4>
                <p className="mt-1 text-xs text-gray-400">
                  {detail.shop
                    ? `ร้าน ${detail.shop.name} · ${detail.shop.status}`
                    : "สินค้าแพลตฟอร์ม"}
                </p>
              </div>
              <button
                onClick={() => {
                  setDetailTarget(null);
                  setDetailData(null);
                }}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-50"
              >
                ปิด
              </button>
            </div>

            {detailLoading ? (
              <div className="py-16 text-center text-sm text-gray-400">
                กำลังโหลดรายละเอียด...
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-5">
                <div className="space-y-3 md:col-span-2">
                  {detail.images?.length > 0 ? (
                    <>
                      <img
                        src={detail.images[0].url}
                        alt={detail.name}
                        className="aspect-square w-full rounded-xl border border-gray-200 object-cover"
                      />
                      {detail.images.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                          {detail.images.slice(1, 5).map((image) => (
                            <img
                              key={image.id || image.url}
                              src={image.url}
                              alt={detail.name}
                              className="aspect-square w-full rounded-lg border border-gray-200 object-cover"
                            />
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-5xl">
                      📦
                    </div>
                  )}
                </div>

                <div className="space-y-4 md:col-span-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                        MODERATION_BADGE[detail.moderationStatus] ||
                        MODERATION_BADGE.VISIBLE
                      }`}
                    >
                      {MODERATION_LABEL[detail.moderationStatus] || "แสดงอยู่"}
                    </span>
                    {detail.type === "MADE_TO_ORDER" ? (
                      <Tag color="gold">สั่งทำพิเศษ</Tag>
                    ) : (
                      <Tag color="cyan">พร้อมส่ง</Tag>
                    )}
                    <Tag>
                      {CATEGORY_LABEL[detail.category] ||
                        detail.category ||
                        "—"}
                    </Tag>
                  </div>

                  {detail.moderationReason && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                      <span className="font-bold">เหตุผลที่ถูกดำเนินการ:</span>{" "}
                      {detail.moderationReason}
                    </div>
                  )}

                  <p className="whitespace-pre-wrap text-sm leading-6 text-gray-600">
                    {detail.description || "ไม่มีคำอธิบายสินค้า"}
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-[10px] font-bold uppercase text-gray-400">
                        ราคาขาย
                      </p>
                      <p className="mt-1 font-extrabold text-brand">
                        {formatMoney(detail.price)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-[10px] font-bold uppercase text-gray-400">
                        สต็อก
                      </p>
                      <p className="mt-1 font-bold text-gray-700">
                        {detail.type === "MADE_TO_ORDER"
                          ? "ไม่จำกัด"
                          : `${detail.stock ?? 0} ชิ้น`}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-[10px] font-bold uppercase text-gray-400">
                        ขายแล้ว
                      </p>
                      <p className="mt-1 font-bold text-gray-700">
                        {detail._count?.orderItems ?? 0} รายการ
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-[10px] font-bold uppercase text-gray-400">
                        สถานะ Seller
                      </p>
                      <p className="mt-1 font-bold text-gray-700">
                        {detail.isActive ? "เปิดขาย" : "ปิดการขาย"}
                      </p>
                    </div>
                  </div>

                  {detail.customOptions?.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-bold text-gray-700">
                        ตัวเลือกสินค้า
                      </p>
                      <div className="space-y-2">
                        {detail.customOptions.map((option) => (
                          <div
                            key={option.id || option.name}
                            className="rounded-lg border border-gray-200 p-2.5 text-xs"
                          >
                            <p className="font-bold text-gray-700">
                              {option.name}
                              {option.isRequired ? " *" : ""}
                            </p>
                            <p className="mt-1 text-gray-500">
                              {option.values
                                ?.map((value) => value.value)
                                .join(" · ") || "—"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {detail.accessories?.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-bold text-gray-700">
                        วัสดุตกแต่ง
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {detail.accessories.map((item) => (
                          <span
                            key={item.accessoryId || item.accessory?.id}
                            className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600"
                          >
                            {item.accessory?.name || "วัสดุ"}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
              <button
                onClick={() => {
                  setDetailTarget(null);
                  setDetailData(null);
                }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50"
              >
                ปิด
              </button>
              <button
                onClick={() =>
                  router.push(`/dashboard/products/edit?id=${detailTarget.id}`)
                }
                className="rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand/90"
              >
                แก้ไขสินค้า
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
