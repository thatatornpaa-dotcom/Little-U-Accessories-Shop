"use client";

import { useState, useEffect } from "react";
import { employeeService } from "../../services/api";
import {
  Add01Icon,
  Cancel01Icon,
  FloppyDiskIcon,
  Edit02Icon,
  Delete02Icon,
} from "hugeicons-react";

export default function StaffTab({ user }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [formMode, setFormMode] = useState("create"); // "create" or "edit"
  const [currentId, setCurrentId] = useState(null);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("staff"); // "admin", "staff"

  useEffect(() => {
    if (user?.role === "admin") {
      loadEmployees();
    }
  }, [user]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const res = await employeeService.getEmployees();
      if (res.success) {
        setEmployees(res.employees);
      }
    } catch (err) {
      setError("โหลดรายชื่อพนักงานล้มเหลว: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const flashSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 4000);
  };

  const openCreateModal = () => {
    setFormMode("create");
    setCurrentId(null);
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setRole("staff");
    setError("");
    setIsOpen(true);
  };

  const openEditModal = (emp) => {
    setFormMode("edit");
    setCurrentId(emp.id);
    setEmail(emp.email);
    setPassword(""); // Keep password empty for editing unless changing
    setFirstName(emp.firstName || "");
    setLastName(emp.lastName || "");
    setRole(emp.role || "staff");
    setError("");
    setIsOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (formMode === "create") {
        await employeeService.createEmployee({
          email,
          password,
          firstName,
          lastName,
          role,
        });
        flashSuccess("สร้างบัญชีพนักงานเรียบร้อยแล้ว!");
      } else {
        const updateData = {
          firstName,
          lastName,
          role,
        };
        if (password) {
          updateData.password = password;
        }
        await employeeService.updateEmployee(currentId, updateData);
        flashSuccess("อัปเดตข้อมูลพนักงานเรียบร้อยแล้ว!");
      }
      setIsOpen(false);
      await loadEmployees();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบพนักงานท่านนี้? (จะเป็นการ Soft Delete ซ่อนรายชื่อจากระบบ)")) {
      return;
    }

    try {
      setError("");
      await employeeService.deleteEmployee(id);
      flashSuccess("ลบรายชื่อพนักงานเรียบร้อยแล้ว!");
      await loadEmployees();
    } catch (err) {
      setError(err.message);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-center">
        <p className="text-red-700 font-bold">สิทธิ์การเข้าถึงปฏิเสธ: หน้านี้สำหรับผู้ดูแลระบบ (Admin) เท่านั้น</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs w-full font-anuphan">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800">จัดการรายชื่อพนักงาน (Staff Management)</h3>
          <p className="text-sm text-gray-500 mt-1">เพิ่ม แก้ไข และลบพนักงานหลังบ้าน (ใช้ระบบ Soft Delete)</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#6A5242] hover:bg-[#523e31] text-white rounded-lg text-sm font-bold transition cursor-pointer"
        >
          <Add01Icon size={18} />
          เพิ่มพนักงานใหม่
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg font-medium">
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#6A5242] animate-spin" />
          <span className="text-sm text-gray-500 font-bold">กำลังโหลดข้อมูล...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-xs">
                <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3 px-4">อีเมล</th>
                <th className="py-3 px-4">บทบาท (Role)</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-10 text-center text-gray-400">
                    ไม่พบรายชื่อพนักงานในระบบ
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-3.5 px-4 font-semibold text-gray-800">
                      {emp.firstName || emp.lastName ? `${emp.firstName || ""} ${emp.lastName || ""}`.trim() : "-"}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 font-medium">{emp.email}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          emp.role === "admin"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-zinc-50 text-zinc-600 border border-zinc-200"
                        }`}
                      >
                        {emp.role === "admin" ? "ผู้ดูแลระบบ (Admin)" : "พนักงาน (Staff)"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(emp)}
                          className="p-1.5 text-zinc-500 hover:text-[#6A5242] hover:bg-zinc-100 rounded-lg transition cursor-pointer"
                          title="แก้ไขข้อมูล"
                        >
                          <Edit02Icon size={18} />
                        </button>
                        {user.id !== emp.id && (
                          <button
                            onClick={() => handleDelete(emp.id)}
                            className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="ลบพนักงาน"
                          >
                            <Delete02Icon size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE & EDIT MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center font-anuphan p-4 bg-black/40 backdrop-blur-xs transition-all">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl w-full max-w-md p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h4 className="text-base font-bold text-gray-800">
                {formMode === "create" ? "เพิ่มพนักงานใหม่" : "แก้ไขข้อมูลพนักงาน"}
              </h4>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition cursor-pointer"
              >
                <Cancel01Icon size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase">อีเมล</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={formMode === "edit"}
                  placeholder="name@company.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-[#6A5242] transition text-sm disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase">
                  รหัสผ่าน {formMode === "edit" && <span className="text-[10px] text-gray-400 lowercase">(ปล่อยว่างหากไม่ต้องการเปลี่ยน)</span>}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={formMode === "create"}
                  placeholder={formMode === "create" ? "ระบุรหัสผ่านอย่างน้อย 8 ตัวอักษร" : "••••••••"}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-[#6A5242] transition text-sm"
                />
              </div>

              {/* First Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase">ชื่อจริง</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="เช่น สมชาย"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-[#6A5242] transition text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase">นามสกุล</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="เช่น ใจดี"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-[#6A5242] transition text-sm"
                  />
                </div>
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase">สิทธิ์การเข้าใช้งาน (Role)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-[#6A5242] transition text-sm bg-white"
                >
                  <option value="staff">พนักงานทั่วไป (Staff)</option>
                  <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-lg transition cursor-pointer text-center"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#6A5242] hover:bg-[#523e31] text-white text-sm font-bold rounded-lg transition cursor-pointer disabled:opacity-50"
                >
                  <FloppyDiskIcon size={16} />
                  {submitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
