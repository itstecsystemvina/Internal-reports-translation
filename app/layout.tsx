import type { Metadata } from "next";
import { Montserrat, Noto_Sans_KR } from "next/font/google";
import { Toaster } from "sonner";
import { LangProvider } from "@/components/lang";
import { getLang } from "@/lib/lang";
import { dictionaries } from "@/lib/i18n";
import "./globals.css";

const montserrat = Montserrat({ subsets: ["latin", "vietnamese"], variable: "--font-montserrat" });
// Montserrat has no Korean letters; Korean text falls back to Noto Sans KR.
const notoKr = Noto_Sans_KR({ weight: ["400", "500", "700"], variable: "--font-noto-kr", preload: false });

export async function generateMetadata(): Promise<Metadata> {
  return { title: "BCCV · S-Tec System", description: dictionaries[await getLang()].app.description };
}

// Applies the saved theme before paint to avoid a flash.
const themeScript = `try{var t=localStorage.getItem("bccv-theme");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} suppressHydrationWarning className={`${montserrat.variable} ${notoKr.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">
        <LangProvider lang={lang}>{children}</LangProvider>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
