"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { ViewIcon, ViewOffSlashIcon } from "hugeicons-react";

export default function LoginPage() {
  const { login } = useAuth();

  // Login Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Error/Success States
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      }
    } catch (err) {
      setError(err.message || "การเชื่อมต่อถูกปฏิเสธโดยเซิร์ฟเวอร์ยืนยันตัวตน");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-brand font-sans selection:bg-brand/30 select-none text-white relative">
      {/* Main Login Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 z-10">
        {/* Branding Title */}
        <div className="flex items-center gap-3.5 text-white select-none mb-8">
          <svg className="w-10 h-10 transition-transform duration-300 hover:rotate-12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M8.5 12C8.5 13.933 10.067 15.5 12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5C10.067 8.5 8.5 10.067 8.5 12Z" fill="currentColor" />
            <path d="M12 5C8.134 5 5 8.134 5 12C5 15.866 8.134 19 12 19C15.866 19 19 15.866 19 12C19 8.134 15.866 5 12 5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span className="text-3xl font-extrabold uppercase tracking-[0.15em] font-sans">
            Bare & Bold
          </span>
        </div>

        {/* Form Container Card */}
        <div className="w-full max-w-[460px] bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-10 text-gray-800 transition-all duration-300">
          {error && (
            <div className="mb-5 p-3.5 rounded bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <h2 className="text-3xl font-semibold text-gray-800 mb-6 tracking-tight">
              เข้าสู่ระบบ
            </h2>

            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1.5">
                ชื่อผู้ใช้ หรือ อีเมล
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ระบุชื่อผู้ใช้ หรือ อีเมล"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1.5">
                รหัสผ่าน
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ระบุรหัสผ่าน"
                  className="w-full border border-gray-300 rounded px-3 py-2 pr-10 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <ViewOffSlashIcon size={18} />
                  ) : (
                    <ViewIcon size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-brand hover:underline cursor-pointer">
                ลืมชื่อผู้ใช้ หรือ รหัสผ่าน?
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center text-sm text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2 h-4.5 w-4.5 rounded border-gray-300 text-brand focus:ring-brand"
                />
                จดจำชื่อผู้ใช้ของฉัน
              </label>

              <button
                type="submit"
                disabled={loading}
                className="bg-[#e6e6e6] hover:bg-gray-300 text-gray-700 font-semibold py-2 px-6 rounded transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? "กำลังโหลด..." : "ส่งข้อมูล"}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer Powered By */}
      <footer className="w-full text-center py-6 text-xs text-white/70 z-10">
        <span>
          Powered by <strong className="text-white">Bare & Bold</strong>
        </span>
      </footer>
    </div>
  );
}
