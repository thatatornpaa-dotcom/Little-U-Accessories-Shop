import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <div className="bg-[#FFF5F7]/70 font-anuphan py-12 md:py-20 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* ฝั่งข้อความโปรย */}
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-black text-[#3B262B] leading-tight">
            Small Things Make
            <br />
            You Happier
          </h1>
          <p className="text-sm md:text-base text-[#6E4750] leading-relaxed">
            ค้นพบคอลเลกชันเครื่องประดับและแอคเซสเซอรีแฮนด์เมดดีไซน์น่ารัก
            คัดสรรอย่างประณีตเพื่อเติมเต็มทุกลุคสดใสในสไตล์ที่เป็นคุณ
          </p>
          <div className="pt-2">
            <Link
              href="/products"
              className="px-8 py-3.5 bg-[#E06D85] hover:bg-[#C9566F] text-white font-bold text-sm rounded-xl transition duration-300 shadow-md inline-block cursor-pointer"
            >
              ช้อปคอลเลกชันทั้งหมด
            </Link>
          </div>
        </div>

        {/* ฝั่งขวา: รูปภาพและวงกลมพื้นหลังที่โผล่ออกมาจากด้านหลังอย่างชัดเจน */}
        <div className="relative flex items-center justify-center min-h-[440px] md:min-h-[540px]">
          
          {/* วงกลมพื้นหลังขยับเยื้องเพิ่มมิติเชิงลึก */}
          <div className="absolute w-[80%] sm:w-[70%] md:w-[80%] aspect-square rounded-full bg-[#FADCE3] translate-x-[8%] translate-y-[4%] z-0" />

          {/* กล่องใส่รูปทรงสี่เหลี่ยมผืนผ้าขอบมน */}
          <div className="relative w-[85%] sm:w-[75%] md:w-[80%] aspect-[3/4] rounded-[2rem] overflow-hidden shadow-2xl border border-[#F7DCE2] z-10 bg-white">
            <Image
              src="https://i.pinimg.com/736x/d6/b6/9f/d6b69f5318eb42d58e3812b16ff50a01.jpg"
              alt="Little U Accessories Shop"
              fill
              className="object-cover hover:scale-102 transition-transform duration-700"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}