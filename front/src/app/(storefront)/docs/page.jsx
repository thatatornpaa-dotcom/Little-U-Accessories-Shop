"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

// Simple custom SVG icons
const SearchIcon = () => (
  <svg className="w-5 h-5 text-[#3B262B]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mermaidLoaded, setMermaidLoaded] = useState(false);

  // Load Mermaid dynamically from CDN
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.mermaid) {
      setMermaidLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js";
    script.async = true;
    script.onload = () => {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: "neutral",
        securityLevel: "loose",
        themeVariables: {
          primaryColor: "#F7DCE2",
          edgeLabelBackground: "#FFF9FA",
          lineColor: "#C9566F"
        }
      });
      setMermaidLoaded(true);
    };
    document.body.appendChild(script);
  }, []);

  // Trigger rendering when mermaid is loaded
  useEffect(() => {
    if (mermaidLoaded && window.mermaid) {
      try {
        setTimeout(() => {
          window.mermaid.run();
        }, 50);
      } catch (e) {
        console.error("Mermaid render error:", e);
      }
    }
  }, [mermaidLoaded, searchQuery]);

  // Search Helper
  const matchesSearch = (textArray) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return textArray.some(text =>
      text && text.toLowerCase().includes(query)
    );
  };

  // Define section match conditions
  const showProjectInfo = matchesSearch([
    "บทนำโครงการ", "01",
    "ข้อมูลโครงการ",
    "ชื่ออย่างเป็นทางการ",
    "ระบบร้านค้าออนไลน์และคัสตอมเครื่องประดับ Little U Accessories Shop",
    "หลักการและเหตุผล", "RATIONALE",
    "ระบบที่รองรับการสั่งซื้อสินค้าออนไลน์และการคัสตอมเครื่องประดับและวัสดุตกแต่ง"
  ]);

  const showGroupInfo = matchesSearch([
    "ผู้รับผิดชอบ", "02",
    "รายชื่อสมาชิกและบทบาท",
    "รหัสนักศึกษา",
    "ชื่อ-นามสกุล",
    "บทบาทหน้าที่รับผิดชอบ",
    "ธราธร พัฒนพวงสิทธิ์", "67146201", "ผู้พัฒนาและดูแลระบบ"
  ]);

  const showObjectives = matchesSearch([
    "เป้าหมายโครงการ", "03",
    "วัตถุประสงค์โครงการ",
    "Requirement Analysis & Planning", "วิเคราะห์ความต้องการและกำหนดขอบเขตระบบ",
    "System & Database Design", "ออกแบบสถาปัตยกรรมระบบ",
    "System Development", "พัฒนาระบบและเชื่อมต่อ Frontend กับ Backend API",
    "System Testing", "ดำเนินการทดสอบฟังก์ชันการทำงานหลัก",
    "Deployment & Maintenance", "ติดตั้งระบบซอฟต์แวร์และจัดทำเอกสารระบบ"
  ]);

  const showScopeActors = matchesSearch([
    "ผู้ใช้ระบบ", "04",
    "ผู้ใช้งานในระบบ", "Actors",
    "Customer", "ลูกค้า", "สมัครสมาชิก", "เข้าสู่ระบบ", "ตะกร้าสินค้า", "สั่งซื้อสินค้า", "ชำระเงิน", "ติดตามคำสั่งซื้อ", "รายการโปรด",
    "Staff", "พนักงาน", "จัดการสินค้า", "จัดการหมวดหมู่", "จัดการคำสั่งซื้อ", "จัดการการจัดส่ง",
    "Admin", "ผู้ดูแลระบบ", "สิทธิ์การทำงาน", "จัดการลูกค้า", "รายงานและสถิติ", "ตั้งค่าระบบ"
  ]);

  const showScopeFunctions = matchesSearch([
    "ขอบเขตฟังก์ชัน", "05",
    "ความสามารถหลักของระบบ",
    "ระบบสมาชิก", "Register", "Login",
    "ระบบจัดการสินค้าและวัสดุตกแต่ง", "Product & Accessories Inventory",
    "ระบบค้นหาและซื้อขาย", "Catalog", "Cart", "Payment",
    "ระบบจัดการสถานะคำสั่งซื้อ", "Order Fulfillment",
    "ระบบรายงานยอดขาย", "Revenue Dashboard"
  ]);

  const showTechnologies = matchesSearch([
    "เครื่องมือ", "06",
    "เครื่องมือและเทคโนโลยี",
    "Frontend Layer", "React.js", "Next.js", "Tailwind CSS",
    "Backend & Database", "Node.js", "Bun", "PostgreSQL", "Neon DB", "Cloudflare R2",
    "Utilities", "Figma", "Git", "GitHub", "Mermaid Diagram",
    "System Architecture Diagram", "สถาปัตยกรรมระบบ"
  ]);

  const showTesting = matchesSearch([
    "การรับประกัน", "07",
    "แนวทางการทดสอบระบบ",
    "Functional Testing", "Postman",
    "User Acceptance Testing", "UAT", "Manual Testing"
  ]);

  const showOutcomes = matchesSearch([
    "คาดหวัง", "08",
    "ผลลัพธ์ที่คาดว่าจะได้รับ",
    "ระบบร้านค้าออนไลน์ Little U Accessories Shop",
    "อัปเดตรายการสินค้าและวัสดุตกแต่ง",
    "ตรวจรับสถานะขนส่งพัสดุ",
    "เอกสารข้อมูลจำเพาะระบบ"
  ]);

  const showTimeline = matchesSearch([
    "กำหนดส่ง", "09",
    "แผนการดำเนินงาน", "Timeline",
    "WEEK 01", "SYSTEM ANALYSIS & DESIGN",
    "WEEK 02", "FRONTEND & BACKOFFICE DEVELOPMENT",
    "WEEK 03", "BACKEND API & DB INTEGRATION",
    "WEEK 04", "SYSTEM TESTING & DEPLOYMENT"
  ]);

  const hasAnyMatch = showProjectInfo || showGroupInfo || showObjectives || showScopeActors || showScopeFunctions || showTechnologies || showTesting || showOutcomes || showTimeline;

  return (
    <div className="min-h-screen bg-[#FFF9FA] text-[#3B262B] font-anuphan antialiased flex flex-col">
      {/* Header Hero */}
      <section className="bg-[#FFF9FA] pt-14 pb-8 px-6 border-b border-[#F7DCE2]">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-[#E06D85] mb-3">
            CSI402 // การเชื่อมต่อโปรแกรมส่วนหน้ากับโปรแกรมส่วนหลัง
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight leading-none text-[#3B262B]">
              REQUIREMENT<br />SPECIFICATION
            </h1>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="ค้นหาข้อมูล..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-base text-[#3B262B] py-1.5 pl-2 pr-10 border-b-2 border-[#3B262B] focus:outline-none focus:border-[#E06D85] transition duration-200"
                />
                <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                  <SearchIcon />
                </div>
              </div>
              <span className="hidden sm:inline text-sm font-bold text-[#C9566F]/80">เวอร์ชัน 1.1</span>
            </div>
          </div>
        </div>
      </section>

      {/* Docs Workspace */}
      <div className="max-w-[1440px] mx-auto w-full px-6 py-10 flex-1 flex flex-col md:flex-row gap-10 relative">

        {/* Floating Mobile Index Toggle */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed bottom-6 right-6 md:hidden z-50 bg-[#3B262B] text-white py-3 px-6 rounded-full shadow-xl text-sm font-black tracking-widest uppercase flex items-center gap-2 cursor-pointer hover:bg-[#E06D85] transition"
        >
          <span>สารบัญ</span>
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
        </button>

        {/* Sidebar Index */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-80 bg-[#FFF9FA] p-6 border-r border-[#F7DCE2] transition-transform duration-300 transform
          md:translate-x-0 md:static md:w-64 md:p-0 md:border-r-0 md:bg-transparent
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}>
          <div className="sticky top-28 space-y-6">
            <div>
              <h3 className="text-xs font-black tracking-[0.2em] text-[#3B262B] mb-4">
                เอกสารระบบ
              </h3>
              <nav className="space-y-3.5">
                <Link
                  href="/docs"
                  className="group w-full text-left flex items-center justify-between cursor-pointer text-[13px] font-black tracking-wider text-[#E06D85] translate-x-1 transition-all duration-200"
                >
                  <span>ข้อมูลโครงการ</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E06D85] scale-125" />
                </Link>

                <Link
                  href="/docs/api"
                  className="group w-full text-left flex items-center justify-between cursor-pointer text-[13px] font-black tracking-wider text-[#3B262B]/70 hover:text-[#E06D85] hover:translate-x-0.5 transition-all duration-200"
                >
                  <span>เอกสาร API References</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-transparent" />
                </Link>

                <Link
                  href="/docs/diagrams"
                  className="group w-full text-left flex items-center justify-between cursor-pointer text-[13px] font-black tracking-wider text-[#3B262B]/70 hover:text-[#E06D85] hover:translate-x-0.5 transition-all duration-200"
                >
                  <span>แผนภาพระบบ & Wireframe</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-transparent" />
                </Link>

                <Link
                  href="/docs/uat"
                  className="group w-full text-left flex items-center justify-between cursor-pointer text-[13px] font-black tracking-wider text-[#3B262B]/70 hover:text-[#E06D85] hover:translate-x-0.5 transition-all duration-200"
                >
                  <span>ผลทดสอบ UAT Checklist</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-transparent" />
                </Link>
              </nav>
            </div>

            <div className="border-t border-[#F7DCE2] pt-6 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#E06D85]">LITTLE U ACCESSORIES SHOP</span>
              <p className="text-xs text-[#3B262B]/80 leading-relaxed font-bold">
                ระบบร้านค้าออนไลน์และคัสตอมเครื่องประดับและวัสดุตกแต่งเฉพาะบุคคล
              </p>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 z-30 md:hidden backdrop-blur-xs"
          />
        )}

        {/* Document Sections */}
        <main className="flex-1 space-y-16 pb-24">
          {!hasAnyMatch && (
            <div className="text-center py-20 border border-dashed border-[#F7DCE2] rounded-2xl">
              <span className="text-sm font-bold text-[#3B262B]/50 italic">ไม่พบข้อมูลที่ค้นหา ลองใช้คำค้นหาอื่น</span>
            </div>
          )}

          {/* Section: Project Title */}
          {showProjectInfo && (
            <section id="project-info" className="scroll-mt-24 border-b border-[#F7DCE2] pb-12">
              <span className="text-xs font-black tracking-[0.25em] text-[#E06D85] block mb-2">01 // บทนำโครงการ</span>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[#3B262B] uppercase mb-6">ข้อมูลโครงการ</h2>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-black text-[#C9566F] tracking-wider mb-1.5">ชื่ออย่างเป็นทางการ</h4>
                  <p className="text-xl md:text-2xl font-black text-[#3B262B] leading-tight">
                    ระบบร้านค้าออนไลน์และคัสตอมเครื่องประดับ Little U Accessories Shop
                  </p>
                  <p className="text-lg font-bold text-[#E06D85] mt-1">
                    {/* เว้นชื่อภาษาอังกฤษไว้ตามที่กำหนด */}
                  </p>
                </div>

                <div className="pt-6 border-t border-[#F7DCE2]">
                  <h4 className="text-xs font-black text-[#C9566F] tracking-wider mb-2.5">หลักการและเหตุผล (RATIONALE)</h4>
                  <p className="text-sm md:text-base text-[#3B262B] leading-relaxed font-bold max-w-3xl">
                    ระบบที่รองรับการสั่งซื้อสินค้าออนไลน์และการคัสตอมเครื่องประดับและวัสดุตกแต่งเฉพาะบุคคล โดยสามารถเลือกวัสดุชิ้นส่วนตกแต่งได้ตามความต้องการ พร้อมทั้งระบบหลังบ้านสำหรับพนักงานและผู้ดูแลระบบเพื่อความเป็นระเบียบและประสิทธิภาพในการดำเนินงาน
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Section: Group Info */}
          {showGroupInfo && (
            <section id="group-info" className="scroll-mt-24 border-b border-[#F7DCE2] pb-12">
              <span className="text-xs font-black tracking-[0.25em] text-[#E06D85] block mb-2">02 // ผู้รับผิดชอบ</span>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[#3B262B] uppercase mb-6">รายชื่อสมาชิกและบทบาท</h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-[#3B262B] text-[#3B262B] font-black tracking-wider">
                      <th className="pb-3 pl-1 w-12">ลำดับ</th>
                      <th className="pb-3 w-32">รหัสนักศึกษา</th>
                      <th className="pb-3 w-56">ชื่อ-นามสกุล</th>
                      <th className="pb-3">บทบาทหน้าที่รับผิดชอบ</th>
                      <th className="pb-3 text-right pr-1 w-28">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F7DCE2] text-[#3B262B] font-bold text-sm">
                    <tr className="hover:bg-[#FFF5F7] transition duration-150">
                      <td className="py-3.5 pl-1 font-black">1</td>
                      <td className="py-3.5">67146201</td>
                      <td className="py-3.5 font-black">ธราธร พัฒนพวงสิทธิ์</td>
                      <td className="py-3.5">ผู้พัฒนาและดูแลระบบ (Frontend, Backend & Backoffice)</td>
                      <td className="py-3.5 text-right pr-1">
                        <span className="text-[11px] font-black px-2.5 py-1 bg-[#E06D85] text-white rounded-sm">ผู้รับผิดชอบทั้งหมด</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Section: Objectives */}
          {showObjectives && (
            <section id="objectives" className="scroll-mt-24 border-b border-[#F7DCE2] pb-12">
              <span className="text-xs font-black tracking-[0.25em] text-[#E06D85] block mb-2">03 // เป้าหมายโครงการ</span>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[#3B262B] uppercase mb-6">วัตถุประสงค์โครงการ</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    label: "01 / Requirement Analysis & Planning",
                    desc: "วิเคราะห์ความต้องการและกำหนดขอบเขตระบบร้านค้าออนไลน์และการคัสตอมเครื่องประดับของแบรนด์ Little U Accessories Shop เพื่อตอบสนองความต้องการของผู้ใช้ในระบบได้ครบถ้วน",
                  },
                  {
                    label: "02 / System & Database Design",
                    desc: "ออกแบบสถาปัตยกรรมระบบ โครงสร้างฐานข้อมูลเชิงสัมพันธ์ (PostgreSQL) และออกแบบประสบการณ์ผู้ใช้งาน (UI/UX) ทั้งส่วนหน้าร้าน (Storefront) และระบบหลังบ้าน (Backoffice)",
                  },
                  {
                    label: "03 / System Development",
                    desc: "พัฒนาระบบและเชื่อมต่อโปรแกรมส่วนหน้า (Frontend / Backoffice) กับโปรแกรมส่วนหลัง (Backend API) และฐานข้อมูลได้อย่างถูกต้องปลอดภัย",
                  },
                  {
                    label: "04 / System Testing",
                    desc: "ดำเนินการทดสอบฟังก์ชันการทำงานหลัก (Functional Testing) และการเชื่อมต่อ API เพื่อป้องกันข้อผิดพลาดและความไม่ปลอดภัยของข้อมูลธุรกรรมการซื้อขาย",
                  },
                  {
                    label: "05 / Deployment & Maintenance",
                    desc: "ติดตั้งระบบซอฟต์แวร์เพื่อเปิดใช้งาน และจัดทำเอกสารข้อมูลจำเพาะระบบสำหรับนำมาใช้อ้างอิงเพื่อบำรุงรักษาและพัฒนาต่อยอดได้ง่าย",
                  }
                ].map((obj, i) => (
                  <div key={i} className="border-l-2 border-[#E06D85] pl-4 space-y-1">
                    <h4 className="text-xs font-black tracking-wider text-[#C9566F]">{obj.label}</h4>
                    <p className="text-sm font-bold text-[#3B262B] leading-relaxed">{obj.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section: Actors */}
          {showScopeActors && (
            <section id="scope-actors" className="scroll-mt-24 border-b border-[#F7DCE2] pb-12">
              <span className="text-xs font-black tracking-[0.25em] text-[#E06D85] block mb-2">04 // ผู้ใช้ระบบ</span>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[#3B262B] uppercase mb-6">ผู้ใช้งานในระบบ (Actors)</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-2 py-0.5 bg-[#3B262B] text-white tracking-widest inline-block">CUSTOMER</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3B262B]" />
                  </div>
                  <h4 className="text-base font-black text-[#3B262B]">1. ลูกค้า</h4>
                  <ul className="space-y-2.5 text-xs text-[#3B262B]/80 font-bold list-disc pl-4">
                    <li>สมัครสมาชิก (Register)</li>
                    <li>เข้าสู่ระบบ (Login)</li>
                    <li>จัดการข้อมูลส่วนตัว (Profile Management)</li>
                    <li>ค้นหาสินค้า และดูรายละเอียดสินค้า / วัสดุตกแต่ง</li>
                    <li>เพิ่มสินค้าลงตะกร้า (Add to Cart)</li>
                    <li>จัดการตะกร้าสินค้า (Cart Management)</li>
                    <li>สั่งซื้อสินค้า (Place Order)</li>
                    <li>ชำระเงิน (Payment)</li>
                    <li>ติดตามคำสั่งซื้อ (Order Tracking)</li>
                    <li>รายการโปรด (Wishlist)</li>
                    <li>ติดต่อสอบถาม</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-2 py-0.5 bg-[#E06D85] text-white tracking-widest inline-block">STAFF</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E06D85]" />
                  </div>
                  <h4 className="text-base font-black text-[#3B262B]">2. พนักงาน (Staff)</h4>
                  <ul className="space-y-2.5 text-xs text-[#3B262B]/80 font-bold list-disc pl-4">
                    <li>จัดการสินค้า (Product Management)</li>
                    <li>จัดการวัสดุตกแต่ง / หมวดหมู่ (Accessories & Category Management)</li>
                    <li>จัดการคำสั่งซื้อ (Order Management)</li>
                    <li>จัดการการจัดส่ง (Shipping Management)</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-2 py-0.5 bg-[#C9566F] text-white tracking-widest inline-block">ADMIN</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C9566F]" />
                  </div>
                  <h4 className="text-base font-black text-[#3B262B]">3. ผู้ดูแลระบบ (Admin)</h4>
                  <ul className="space-y-2.5 text-xs text-[#3B262B]/80 font-bold list-disc pl-4">
                    <li className="list-none -ml-4 text-[#E06D85] font-black">★ ครอบคลุมสิทธิ์การทำงานทั้งหมดของพนักงาน (Staff)</li>
                    <li>จัดการลูกค้า (Customer Management)</li>
                    <li>ดูรายงานและสถิติ (Reports & Analytics Dashboard)</li>
                    <li>ตั้งค่าระบบ (System Settings)</li>
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* Section: Main Functions */}
          {showScopeFunctions && (
            <section id="scope-functions" className="scroll-mt-24 border-b border-[#F7DCE2] pb-12">
              <span className="text-xs font-black tracking-[0.25em] text-[#E06D85] block mb-2">05 // ขอบเขตฟังก์ชัน</span>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[#3B262B] uppercase mb-6">ความสามารถหลักของระบบ</h2>

              <div className="divide-y divide-[#F7DCE2]">
                {[
                  { title: "ระบบสมาชิก (Register / Login)", desc: "ระบบลงทะเบียนและเข้าใช้งานสำหรับลูกค้า พนักงาน และผู้ดูแลระบบ" },
                  { title: "ระบบจัดการสินค้าและวัสดุตกแต่ง (Product & Accessories)", desc: "อัปโหลดและอัปเดตข้อมูลรายการสินค้าและวัสดุตกแต่งสำหรับปรับแต่งสินค้า" },
                  { title: "ระบบค้นหาและซื้อขาย (Catalog, Cart & Payment)", desc: "ระบบกรองสินค้า ค้นหาด้วยคีย์เวิร์ด ตะกร้าสินค้า และหน้าชำระเงิน" },
                  { title: "ระบบจัดการสถานะคำสั่งซื้อ (Order Fulfillment)", desc: "อัปเดตกระบวนการทำรายการสั่งซื้อ ยืนยันคำสั่งซื้อ และติดตามสถานะการจัดส่ง" },
                  { title: "ระบบรายงานยอดขาย (Revenue Dashboard)", desc: "สรุปยอดการขาย รายรับ และสถิติต่างๆ สำหรับผู้ดูแลระบบ" }
                ].map((func, i) => (
                  <div key={i} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-bold">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-[#E06D85]">0{i + 1}</span>
                      <h4 className="text-sm font-black text-[#3B262B]">{func.title}</h4>
                    </div>
                    <p className="text-xs text-[#3B262B]/75 sm:text-right max-w-lg font-bold">{func.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section: Technologies */}
          {showTechnologies && (
            <section id="technologies" className="scroll-mt-24 border-b border-[#F7DCE2] pb-12">
              <span className="text-xs font-black tracking-[0.25em] text-[#E06D85] block mb-2">06 // เครื่องมือ</span>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[#3B262B] uppercase mb-6">เครื่องมือและเทคโนโลยี</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-bold mb-8">
                <div className="space-y-3">
                  <h4 className="font-black text-[#3B262B] uppercase tracking-wider border-b-2 border-[#E06D85] pb-1.5 text-sm">FRONTEND LAYER</h4>
                  <ul className="space-y-2">
                    <li className="flex justify-between"><span>React.js / Next.js</span><span className="text-[#3B262B]/65 font-black">App Router</span></li>
                    <li className="flex justify-between"><span>Tailwind CSS</span><span className="text-[#3B262B]/65 font-black">Styling</span></li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-black text-[#3B262B] uppercase tracking-wider border-b-2 border-[#E06D85] pb-1.5 text-sm">BACKEND & DATABASE</h4>
                  <ul className="space-y-2">
                    <li className="flex justify-between"><span>Node.js / Bun</span><span className="text-[#3B262B]/65 font-black">Runtime</span></li>
                    <li className="flex justify-between"><span>PostgreSQL</span><span className="text-[#3B262B]/65 font-black">Neon DB</span></li>
                    <li className="flex justify-between"><span>Cloudflare R2</span><span className="text-[#3B262B]/65 font-black">Object Storage</span></li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-black text-[#3B262B] uppercase tracking-wider border-b-2 border-[#E06D85] pb-1.5 text-sm">UTILITIES</h4>
                  <ul className="space-y-2">
                    <li className="flex justify-between"><span>Figma</span><span className="text-[#3B262B]/65 font-black">UI Design</span></li>
                    <li className="flex justify-between"><span>Git / GitHub</span><span className="text-[#3B262B]/65 font-black">Version Control</span></li>
                    <li className="flex justify-between"><span>Mermaid Diagram</span><span className="text-[#3B262B]/65 font-black">Visualization</span></li>
                  </ul>
                </div>
              </div>

              {/* System Architecture Diagram */}
              <div className="border-t border-[#F7DCE2] pt-8 space-y-4">
                <h3 className="text-base font-black text-[#3B262B] uppercase tracking-tight">System Architecture Diagram</h3>
                <p className="text-xs text-[#3B262B]/75 font-bold">
                  แผนผังสถาปัตยกรรมระบบ (System Architecture) ของ Little U Accessories Shop แสดงการเชื่อมต่อระหว่าง Frontend, Backoffice, Backend API และ Database
                </p>

                <div className="border border-[#F7DCE2] rounded-xl bg-[#FFF5F7]/50 p-6 overflow-auto flex items-center justify-start min-h-[300px]">
                  {!mermaidLoaded ? (
                    <div className="text-xs font-bold text-gray-400 animate-pulse">กำลังโหลดระบบวาดแผนผัง...</div>
                  ) : (
                    <div className="mermaid min-w-[800px] lg:min-w-[1000px] origin-left">
                      {`graph LR
    %% Actors
    Customer["Customer / Buyer"]
    Admin["Admin"]
    Staff["Staff"]

    %% Frontend Layer
    subgraph Frontend ["Frontend & Backoffice Layer"]
        Storefront["Storefront Interface (:3005)"]
        Backoffice["Backoffice Dashboard (:3006)"]
    end

    %% Backend API Services
    subgraph Backend ["Backend API Layer (:8001)"]
        AuthService["Auth Service"]
        ProductService["Product & Accessories Service"]
        OrderService["Order & Cart Service"]
        UploadService["Upload Service"]
        PaymentService["Payment Service"]
    end

    %% Database & External Gateways
    subgraph Storage ["Data & Gateways Layer"]
        Postgres[(PostgreSQL Neon)]
        R2[(Cloudflare R2)]
        Omise["Omise Gateway"]
    end

    %% Connections - Users to UI
    Customer --> Storefront
    Admin --> Backoffice
    Staff --> Backoffice

    %% Connections - UI to API Services
    Storefront --> AuthService
    Storefront --> ProductService
    Storefront --> OrderService
    Storefront --> PaymentService

    Backoffice --> ProductService
    Backoffice --> OrderService
    Backoffice --> UploadService

    %% Connections - API Services to Databases
    AuthService --> Postgres
    ProductService --> Postgres
    OrderService --> Postgres
    PaymentService --> Postgres

    UploadService --> R2
    PaymentService --> Omise`}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Section: Testing */}
          {showTesting && (
            <section id="testing" className="scroll-mt-24 border-b border-[#F7DCE2] pb-12">
              <span className="text-xs font-black tracking-[0.25em] text-[#E06D85] block mb-2">07 // การรับประกัน</span>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[#3B262B] uppercase mb-6">แนวทางการทดสอบระบบ</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-bold leading-relaxed">
                <div className="space-y-1.5">
                  <span className="text-xs font-black text-[#C9566F] tracking-wider block">01 // FUNCTIONAL TESTING</span>
                  <p className="text-[#3B262B] font-bold">
                    ทำการทดสอบการเชื่อมต่อ API ระหว่างส่วนหน้าและส่วนหลัง การเพิ่มสินค้าลงตะกร้า การสั่งซื้อ การตรวจสอบค่า Request/Response และทดสอบ Endpoint หลังบ้านร่วมกับ <strong>Postman</strong>
                  </p>
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-black text-[#C9566F] tracking-wider block">02 // USER ACCEPTANCE TESTING (UAT)</span>
                  <p className="text-[#3B262B] font-bold">
                    ทดสอบการใช้งานจริงทั้งฝั่งหน้าร้านและหลังบ้าน ตรวจสอบความถูกต้องของข้อมูล แดชบอร์ด การแสดงผล และการทำงานของปุ่มต่างๆ
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Section: Outcomes */}
          {showOutcomes && (
            <section id="outcomes" className="scroll-mt-24 border-b border-[#F7DCE2] pb-12">
              <span className="text-xs font-black tracking-[0.25em] text-[#E06D85] block mb-2">08 // คาดหวัง</span>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[#3B262B] uppercase mb-6">ผลลัพธ์ที่คาดว่าจะได้รับ</h2>

              <div className="space-y-3.5 text-sm font-bold text-[#3B262B]">
                {[
                  "ได้รับระบบร้านค้าออนไลน์ Little U Accessories Shop ที่เชื่อมต่อการทำงานระหว่าง Frontend, Backoffice และ Backend API ได้อย่างสมบูรณ์",
                  "ฝั่งผู้ดูแลและพนักงานสามารถจัดการสินค้า วัสดุตกแต่ง และคำสั่งซื้อผ่านระบบหลังบ้านได้อย่างสะดวก",
                  "ฝั่งลูกค้าสามารถเลือกดูสินค้า คัสตอมวัสดุตกแต่ง สั่งซื้อ และชำระเงินได้อย่างราบรื่น",
                  "จัดเตรียมเอกสารข้อมูลจำเพาะระบบครบถ้วนตามรายวิชา CSI402"
                ].map((outcome, idx) => (
                  <div key={idx} className="flex gap-4">
                    <span className="text-[#E06D85] font-black">{idx + 1}.</span>
                    <p className="font-bold">{outcome}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section: Timeline */}
          {showTimeline && (
            <section id="timeline" className="scroll-mt-24 pb-12">
              <span className="text-xs font-black tracking-[0.25em] text-[#E06D85] block mb-2">09 // กำหนดส่ง</span>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[#3B262B] uppercase mb-6">แผนการดำเนินงาน (Timeline)</h2>

              <div className="space-y-4">
                {[
                  { week: "WEEK 01", title: "SYSTEM ANALYSIS & DESIGN", desc: "วิเคราะห์ความต้องการ ออกแบบโครงสร้างฐานข้อมูล และจัดทำ UI/UX ของ Little U Accessories Shop" },
                  { week: "WEEK 02", title: "FRONTEND & BACKOFFICE DEVELOPMENT", desc: "พัฒนาหน้าเว็บฝั่ง Storefront และ Backoffice ปรับแต่งธีมและคอมโพเนนต์ให้ตรงตามแบบ" },
                  { week: "WEEK 03", title: "BACKEND API & DB INTEGRATION", desc: "เชื่อมต่อ API ฝั่ง Backend กับฐานข้อมูล PostgreSQL (Neon) และระบบจัดเก็บรูปภาพ Cloudflare R2" },
                  { week: "WEEK 04", title: "SYSTEM TESTING & DEPLOYMENT", desc: "ทดสอบการเชื่อมต่อ API การทำงานของระบบ แก้ไขข้อผิดพลาด และจัดทำเอกสารส่งงาน" }
                ].map((step, idx) => (
                  <div key={idx} className="py-3 border-b border-[#F7DCE2] flex flex-col md:flex-row justify-between gap-4">
                    <div className="w-24 shrink-0">
                      <span className="text-xs font-black text-[#E06D85]">{step.week}</span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-sm font-black text-[#3B262B]">{step.title}</h4>
                      <p className="text-xs text-[#3B262B]/75 leading-relaxed font-bold">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </main>
      </div>
    </div>
  );
}