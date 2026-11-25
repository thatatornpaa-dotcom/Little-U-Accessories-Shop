import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "LITTLE U | ร้านค้าออนไลน์สไตล์มินิมอล",
  description: "พบกับสินค้าแฟชั่น เครื่องประดับ และสร้อยข้อมือแฮนด์เมดพรีเมียมจาก LITTLE U",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#FDFBF7] text-[#3C322A] font-anuphan antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
