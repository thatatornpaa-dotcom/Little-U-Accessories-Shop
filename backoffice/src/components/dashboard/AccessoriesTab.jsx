import { useState, useEffect } from "react";
import { Table, Input, Select, Tag, Popconfirm, Button, Modal, Form, InputNumber, Upload, message, Pagination } from "antd";
import { accessoryService, categoryService, uploadService } from "../../services/api";

export default function AccessoriesTab() {
  const [accessories, setAccessories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, categoryFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accRes, catRes] = await Promise.all([
        accessoryService.getAccessories(),
        categoryService.getCategories()
      ]);
      if (accRes.success) {
        setAccessories(accRes.accessories || []);
      }
      if (catRes.success) {
        setCategories(catRes.categories || []);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      message.error("ไม่สามารถโหลดข้อมูลวัสดุตกแต่งหรือหมวดหมู่ได้");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingAccessory(null);
    setImageUrl("");
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (accessory) => {
    setEditingAccessory(accessory);
    setImageUrl(accessory.imageUrl || "");
    form.setFieldsValue({
      name: accessory.name,
      description: accessory.description,
      price: parseFloat(accessory.price) || 0,
      stock: accessory.stock,
      categoryId: accessory.categoryId,
    });
    setIsModalOpen(true);
  };

  const handleUploadImage = async (file) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("image", file);

      const res = await uploadService.uploadImages(formData, "accessories");
      if (res.success && res.urls && res.urls.length > 0) {
        setImageUrl(res.urls[0]);
        message.success("อัปโหลดรูปภาพสำเร็จ");
      } else {
        message.error("อัปโหลดล้มเหลว");
      }
    } catch (err) {
      console.error("Upload error:", err);
      message.error(err.message || "อัปโหลดล้มเหลว");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      const payload = {
        ...values,
        imageUrl: imageUrl || null
      };

      if (editingAccessory) {
        const res = await accessoryService.updateAccessory(editingAccessory.id, payload);
        if (res.success) {
          message.success("อัปเดตวัสดุตกแต่งสำเร็จ");
          loadData();
          setIsModalOpen(false);
        }
      } else {
        const res = await accessoryService.createAccessory(payload);
        if (res.success) {
          message.success("เพิ่มวัสดุตกแต่งสำเร็จ");
          loadData();
          setIsModalOpen(false);
        }
      }
    } catch (err) {
      console.error("Save accessory error:", err);
      message.error(err.message || "บันทึกข้อมูลล้มเหลว");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await accessoryService.deleteAccessory(id);
      if (res.success) {
        message.success("ลบวัสดุตกแต่งสำเร็จ");
        loadData();
      }
    } catch (err) {
      console.error("Delete accessory error:", err);
      message.error(err.message || "ไม่สามารถลบข้อมูลได้");
    }
  };

  const filteredAccessories = accessories.filter((acc) => {
    const nameMatch = !searchText || acc.name.toLowerCase().includes(searchText.toLowerCase());
    const catMatch = categoryFilter === "ALL" || acc.categoryId === categoryFilter;
    return nameMatch && catMatch;
  });

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedAccessories = filteredAccessories.slice(startIndex, startIndex + pageSize);

  const columns = [
    {
      title: "รูปภาพ",
      dataIndex: "imageUrl",
      key: "imageUrl",
      width: 100,
      render: (url, record) => (
        url ? (
          <img
            src={url}
            alt={record.name}
            className="w-12 h-12 rounded-lg object-cover border border-gray-200"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 font-bold border border-gray-200 select-none">
            No Img
          </div>
        )
      )
    },
    {
      title: "ชื่อวัสดุตกแต่ง",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div>
          <div className="font-bold text-gray-800 text-sm">{text}</div>
          {record.description && (
            <div className="text-xs text-gray-400 mt-0.5">{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: "หมวดหมู่",
      dataIndex: ["category", "name"],
      key: "category",
      width: 150,
      render: (categoryName) => (
        <Tag color="purple" className="font-semibold text-xs border-0 px-2.5 py-0.5 rounded-full">
          {categoryName || "ไม่มีหมวดหมู่"}
        </Tag>
      ),
    },
    {
      title: "ราคาปรับขึ้น (THB)",
      dataIndex: "price",
      key: "price",
      width: 150,
      render: (price) => (
        <span className="font-bold text-brand">
          +฿{parseFloat(price || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: "จำนวนคงเหลือ",
      dataIndex: "stock",
      key: "stock",
      width: 130,
      render: (stock) => {
        let color = "red";
        if (stock > 50) color = "green";
        else if (stock > 0) color = "orange";
        return <Tag color={color} className="font-semibold">{stock} ชิ้น</Tag>;
      },
    },
    {
      title: "การจัดการ",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEditModal(record)}
            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold rounded-lg text-xs transition-all hover:border-gray-300 cursor-pointer active:scale-95 flex items-center gap-1"
          >
            แก้ไข
          </button>
          <Popconfirm
            title="คุณแน่ใจหรือไม่ว่าต้องการลบวัสดุตกแต่งนี้?"
            onConfirm={() => handleDelete(record.id)}
            okText="ใช่, ลบเลย"
            cancelText="ยกเลิก"
            okButtonProps={{ danger: true }}
          >
            <button className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 font-semibold rounded-lg text-xs transition-all hover:border-rose-200 cursor-pointer active:scale-95">
              ลบ
            </button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs w-full h-full flex flex-col min-h-0 overflow-hidden">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 shrink-0">
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">จัดการวัสดุตกแต่ง (Accessories)</h3>
          <p className="text-sm text-gray-500">จัดการจี้ ลูกปัด หรือตัวเลือกเสริมสำหรับการปรับแต่งสินค้า Custom</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select
            value={categoryFilter}
            onChange={(val) => setCategoryFilter(val)}
            className="w-40"
            options={[
              { value: "ALL", label: "ทุกหมวดหมู่" },
              ...categories.map((c) => ({ value: c.id, label: c.name }))
            ]}
          />
          <Input.Search
            placeholder="ค้นหาชื่อวัสดุตกแต่ง..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full sm:w-64"
          />
          <button
            onClick={handleOpenCreateModal}
            className="bg-brand text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-brand/90 transition-colors whitespace-nowrap cursor-pointer flex-shrink-0"
          >
            + เพิ่มวัสดุตกแต่ง
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 w-full min-h-0 overflow-hidden flex flex-col">
        <Table
          dataSource={paginatedAccessories}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ y: "calc(100vh - 350px)", x: 800 }}
          className="font-sans [&_*]:!font-sans border border-gray-100 rounded-lg w-full flex-1"
        />
      </div>

      {/* Dedicated Standalone Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-2 border-t border-gray-100 shrink-0">
        <div className="text-sm text-gray-500 font-medium">
          แสดง {filteredAccessories.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + pageSize, filteredAccessories.length)} จากทั้งหมด {filteredAccessories.length} รายการ
        </div>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={filteredAccessories.length}
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

      {/* Add / Edit Modal */}
      <Modal
        title={editingAccessory ? "แก้ไขวัสดุตกแต่ง" : "เพิ่มวัสดุตกแต่งใหม่"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnHidden
        className="font-sans"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4"
        >
          <Form.Item
            name="name"
            label="ชื่อวัสดุตกแต่ง"
            rules={[{ required: true, message: "กรุณากรอกชื่อ" }]}
          >
            <Input placeholder="เช่น จี้เงินลายหัวใจ, ลูกปัดแก้วสีมุก" />
          </Form.Item>

          <Form.Item
            name="description"
            label="รายละเอียดเสริม"
          >
            <Input.TextArea placeholder="รายละเอียดสเปก ขนาด หรือสี..." rows={2} />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="price"
              label="ราคาปรับเพิ่ม (THB)"
              rules={[{ required: true, message: "กรุณากรอกราคา" }]}
            >
              <InputNumber min={0} className="w-full" placeholder="0.00" />
            </Form.Item>

            <Form.Item
              name="stock"
              label="จำนวนสต็อก"
              rules={[{ required: true, message: "กรุณากรอกจำนวนสต็อก" }]}
            >
              <InputNumber min={0} className="w-full" placeholder="100" />
            </Form.Item>
          </div>

          <Form.Item
            name="categoryId"
            label="หมวดหมู่หลัก"
            rules={[{ required: true, message: "กรุณาเลือกหมวดหมู่" }]}
          >
            <Select
              placeholder="เลือกหมวดหมู่วัสดุ..."
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>

          {/* Image Upload Option */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">รูปภาพวัสดุตกแต่ง</label>
            <div className="flex items-center gap-4">
              {imageUrl ? (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                  <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-[10px] w-5 h-5 flex items-center justify-center border-0 cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    handleUploadImage(file);
                    return false; // Prevent auto POST upload
                  }}
                >
                  <Button loading={uploading}>อัปโหลดรูปภาพ</Button>
                </Upload>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button onClick={() => setIsModalOpen(false)}>ยกเลิก</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {editingAccessory ? "บันทึกการแก้ไข" : "เพิ่มวัสดุตกแต่ง"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
