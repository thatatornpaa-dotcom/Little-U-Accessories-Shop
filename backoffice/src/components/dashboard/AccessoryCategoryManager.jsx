"use client";

import { useState, useEffect } from "react";
import { categoryService } from "../../services/api";
import {
  ArrowLeft01Icon,
  Tag01Icon,
  Add01Icon,
  Cancel01Icon,
  FloppyDiskIcon,
  ArrowRight01Icon,
} from "hugeicons-react";

export default function AccessoryCategoryManager({ onBack }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Add new
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // Inline edit
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await categoryService.getCategories();
      if (res.success) setCategories(res.categories);
    } catch (err) {
      setError("โหลดข้อมูลล้มเหลว: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const flash = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      setSubmitting(true);
      setError("");
      await categoryService.createCategory({
        name: newName,
        description: newDesc,
      });
      setNewName("");
      setNewDesc("");
      setShowAddForm(false);
      flash("เพิ่มหมวดหมู่วัสดุตกแต่งสำเร็จ!");
      await loadCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDesc(cat.description || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDesc("");
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    try {
      setSubmitting(true);
      setError("");
      await categoryService.updateCategory(id, {
        name: editName,
        description: editDesc,
      });
      cancelEdit();
      flash("อัปเดตหมวดหมู่สำเร็จ!");
      await loadCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("ต้องการลบหมวดหมู่วัสดุตกแต่งนี้?")) return;
    try {
      setDeletingId(id);
      setError("");
      await categoryService.deleteCategory(id);
      flash("ลบหมวดหมู่สำเร็จ!");
      await loadCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Back link */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
      >
        <ArrowLeft01Icon size={14} />
        กลับไปหน้าจัดสรรหมวดหมู่
      </button>

      {/* Page title */}
      <div>
        <h2 className="text-2xl font-extrabold text-brand">หมวดหมู่วัสดุตกแต่ง (Accessory Categories)</h2>
        <p className="text-sm text-gray-400 mt-1">
          จัดการหมวดหมู่หลักของอะไหล่สร้อยข้อมือ เช่น CHARM (จี้), BEAD (ลูกปัด), CORD (เชือก)
        </p>
      </div>

      {/* Feedback */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium px-4 py-3 rounded-xl">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium px-4 py-3 rounded-xl">
          ✅ {success}
        </div>
      )}

      {/* Category list */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            <span className="inline-block w-5 h-5 border-2 border-brand/20 border-t-brand rounded-full animate-spin mr-2 align-middle" />
            กำลังโหลด...
          </div>
        ) : categories.length === 0 && !showAddForm ? (
          <div className="py-16 text-center text-gray-300 text-sm">
            ยังไม่มีหมวดหมู่ — กดปุ่ม + เพื่อเพิ่มหมวดหมู่แรก
          </div>
        ) : (
          <>
            {categories.map((cat, idx) => (
              <div
                key={cat.id}
                className={`${idx !== 0 ? "border-t border-gray-100" : ""}`}
              >
                {editingId === cat.id ? (
                  /* ── Inline Edit Row ── */
                  <div className="flex items-center gap-3 px-6 py-4 bg-brand/5">
                    <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
                      <Tag01Icon size={18} />
                    </div>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 text-sm border border-brand rounded-xl px-3 py-2 focus:outline-none uppercase font-semibold"
                        placeholder="ชื่อหมวดหมู่..."
                        autoFocus
                      />
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-brand"
                        placeholder="คำอธิบาย (ถ้ามี)..."
                      />
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleUpdate(cat.id)}
                        disabled={submitting}
                        className="flex items-center gap-1.5 text-xs bg-brand text-white px-3 py-2 rounded-xl font-semibold hover:bg-brand/90 cursor-pointer disabled:opacity-50"
                      >
                        <FloppyDiskIcon size={14} />
                        บันทึก
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1.5 text-xs bg-gray-100 text-gray-600 px-3 py-2 rounded-xl font-semibold hover:bg-gray-200 cursor-pointer"
                      >
                        <Cancel01Icon size={14} />
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Normal Row ── */
                  <div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors group">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center flex-shrink-0">
                      <Tag01Icon size={18} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{cat.name}</p>
                      {cat.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{cat.description}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(cat)}
                        className="text-xs text-gray-500 hover:text-gray-800 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 font-semibold cursor-pointer transition-colors"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        disabled={deletingId === cat.id}
                        className="text-xs text-rose-500 hover:text-rose-700 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 font-semibold cursor-pointer transition-colors disabled:opacity-50"
                      >
                        {deletingId === cat.id ? "กำลังลบ..." : "ลบ"}
                      </button>
                    </div>

                    <ArrowRight01Icon size={16} className="text-gray-300 flex-shrink-0 group-hover:text-gray-400 transition-colors" />
                  </div>
                )}
              </div>
            ))}

            {/* Add new inline form */}
            {showAddForm && (
              <div className="border-t border-gray-100">
                <form onSubmit={handleCreate} className="flex items-center gap-3 px-6 py-4 bg-brand/5">
                  <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
                    <Add01Icon size={18} />
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1 text-sm border border-brand rounded-xl px-3 py-2 focus:outline-none uppercase font-semibold"
                      placeholder="ชื่อหมวดหมู่ใหม่..."
                      required
                      autoFocus
                    />
                    <input
                      type="text"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-brand"
                      placeholder="คำอธิบาย (ถ้ามี)..."
                    />
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      type="submit"
                      disabled={submitting || !newName.trim()}
                      className="flex items-center gap-1.5 text-xs bg-brand text-white px-3 py-2 rounded-xl font-semibold hover:bg-brand/90 cursor-pointer disabled:opacity-50"
                    >
                      <FloppyDiskIcon size={14} />
                      เพิ่ม
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddForm(false); setNewName(""); setNewDesc(""); }}
                      className="flex items-center gap-1.5 text-xs bg-gray-100 text-gray-600 px-3 py-2 rounded-xl font-semibold hover:bg-gray-200 cursor-pointer"
                    >
                      <Cancel01Icon size={14} />
                      ยกเลิก
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 text-sm font-semibold text-brand border border-brand/30 bg-brand/5 hover:bg-brand/10 px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
        >
          <Add01Icon size={16} />
          เพิ่มหมวดหมู่ใหม่
        </button>
      )}
    </div>
  );
}
