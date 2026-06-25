import Link from "next/link";
import { Smartphone, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center relative z-10">
      <Smartphone className="w-20 h-20 mx-auto mb-6 text-white opacity-80" />
      <h1 className="text-3xl font-bold text-white mb-3">页面走丢了</h1>
      <p className="text-[rgba(255,255,255,0.5)] text-sm mb-8 max-w-xs">
        这个页面大概正在摇晃中...摇丢了
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-medium hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>回到首页</span>
      </Link>
    </div>
  );
}
