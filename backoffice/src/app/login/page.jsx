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
    <div className="flex-1 flex flex-col min-h-screen bg-gradient-to-br from-[#F497AC] via-[#E06D85] to-[#C9566F] font-sans selection:bg-white/30 select-none text-white relative">
      {/* Main Login Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 z-10">
        {/* Branding Title */}
        <div className="flex items-center gap-3.5 text-white select-none mb-8">
          <svg
            className="w-10 h-10 transition-transform duration-300 hover:scale-110"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <span className="text-3xl font-extrabold tracking-[0.08em] font-sans">
            Little U
          </span>
        </div>

        {/* Form Container Card */}
        <div className="w-full max-w-[460px] bg-white rounded-2xl shadow-[0_12px_36px_rgba(140,42,67,0.18)] border border-[#F7DCE2] p-10 text-[#3B262B] transition-all duration-300">
          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-[#FFF5F7] border border-[#F3B8C6] text-[#B83B56] text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <h2 className="text-3xl font-semibold text-[#3B262B] mb-6 tracking-tight">
              เข้าสู่ระบบ
            </h2>

            <div>
              <label className="block text-sm font-semibold text-[#6E4750] mb-1.5">
                ชื่อผู้ใช้ หรือ อีเมล
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ระบุชื่อผู้ใช้ หรือ อีเมล"
                className="w-full border border-[#F3D2D9] rounded-lg px-3 py-2 text-sm text-[#3B262B] placeholder-[#B48C95] focus:outline-none focus:border-[#E06D85] focus:ring-1 focus:ring-[#E06D85] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#6E4750] mb-1.5">
                รหัสผ่าน
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ระบุรหัสผ่าน"
                  className="w-full border border-[#F3D2D9] rounded-lg px-3 py-2 pr-10 text-sm text-[#3B262B] placeholder-[#B48C95] focus:outline-none focus:border-[#E06D85] focus:ring-1 focus:ring-[#E06D85] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#A87D87] hover:text-[#E06D85] transition-colors"
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
              <span className="text-[#E06D85] hover:text-[#C9566F] hover:underline cursor-pointer">
                ลืมชื่อผู้ใช้ หรือ รหัสผ่าน?
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center text-sm text-[#6E4750] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2 h-4.5 w-4.5 rounded border-[#F3D2D9] accent-[#E06D85] focus:ring-[#E06D85]"
                />
                จดจำชื่อผู้ใช้ของฉัน
              </label>

              <button
                type="submit"
                disabled={loading}
                className="bg-[#E06D85] hover:bg-[#C9566F] text-white font-semibold py-2 px-6 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {loading ? "กำลังโหลด..." : "ส่งข้อมูล"}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer Powered By */}
      <footer className="w-full text-center py-6 text-xs text-white/85 z-10">
        <span>
          Powered by <strong className="text-white">Little U</strong>
        </span>
      </footer>
    </div>
  );
}