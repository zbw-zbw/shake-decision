import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative z-10">
      <div className="text-center">
        <div className="text-6xl mb-6">📱</div>
        <h1 className="text-2xl font-bold text-white mb-2">页面走丢了</h1>
        <p className="text-[rgba(255,255,255,0.5)] text-sm mb-8">
          这个页面大概正在摇晃中...摇丢了
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-medium hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
        >
          <span>←</span>
          <span>返回首页</span>
        </Link>
      </div>
    </div>
  );
}
