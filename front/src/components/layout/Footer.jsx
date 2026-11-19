import React from "react";

export default function Footer() {
  return (
    <footer className="w-full bg-[#FFF5F7] border-t border-[#FADCE3] py-12 px-6 font-anuphan">
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-[#6E4750] text-xs font-semibold">
        <p>
          © {new Date().getFullYear()} Little U Accessories Shop. สงวนลิขสิทธิ์
        </p>
        <div className="flex gap-8">
          <a href="#" className="hover:text-[#E87A90] transition">
            นโยบายความเป็นส่วนตัว
          </a>
          <a href="#" className="hover:text-[#E87A90] transition">
            ข้อกำหนดการใช้งาน
          </a>
          <a href="#" className="hover:text-[#E87A90] transition">
            สมัครรับข่าวสาร
          </a>
        </div>
      </div>
    </footer>
  );
}