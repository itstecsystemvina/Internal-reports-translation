import type { Metadata } from "next";
import { Montserrat, Noto_Sans_KR } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const montserrat = Montserrat({ subsets: ["latin", "vietnamese"], variable: "--font-montserrat" });
// Montserrat has no Korean letters; Korean text falls back to Noto Sans KR.
const notoKr = Noto_Sans_KR({ weight: ["400", "500", "700"], variable: "--font-noto-kr", preload: false });

export const metadata: Metadata = {
  title: "BCCV · S-Tec System",
  description: "Báo cáo công việc tuần",
};

// Applies the saved theme before paint to avoid a flash.
const themeScript = `try{var t=localStorage.getItem("bccv-theme");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${montserrat.variable} ${notoKr.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
