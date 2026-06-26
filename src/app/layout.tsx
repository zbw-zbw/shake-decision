import type { Metadata } from "next";
import { Inter, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { FadeInObserver } from "@/components/FadeInObserver";
import { ToastProvider } from "@/components/Toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "摇一摇决策器 — 选择困难？摇一下就好",
    template: "%s — 摇一摇决策器",
  },
  description:
    "基于手机陀螺仪+AI的决策辅助工具。摇晃手机，AI分析你纠结的根因并给出理性建议。不是随机选一个，而是帮你看清为什么纠结。",
  keywords: ["决策", "AI", "摇一摇", "选择困难", "陀螺仪"],
  openGraph: {
    title: "摇一摇决策器 — 选择困难？摇一下就好",
    description: "摇晃手机，AI帮你终结选择困难症",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${inter.variable} ${notoSansSC.variable} h-full antialiased`}
      style={{ backgroundColor: "#0f0b1a" }}
    >
      <body className="min-h-full flex flex-col relative">
        <ToastProvider>
          <Navbar />
          <FadeInObserver />
          <main className="flex-1 relative z-10">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
