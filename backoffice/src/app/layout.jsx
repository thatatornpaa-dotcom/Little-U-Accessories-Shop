import { Anuphan } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

const anuphan = Anuphan({
  variable: "--font-anuphan",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "Bare & Bold Backoffice Portal",
  description: "Management Console for Bare & Bold Administration",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="th"
      className={`${anuphan.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
