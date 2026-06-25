"use client";

import Link from "next/link";

export function FooterSection() {
  return (
    <footer className="relative w-full py-12 sm:py-20 px-4 sm:px-6 safe-bottom">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center">
          <h2 className="fade-in text-2xl sm:text-3xl font-bold text-white mb-3">
            准备好了吗？
          </h2>
          <p className="fade-in text-[rgba(255,255,255,0.7)] mb-8">
            选择困难？摇一下就好
          </p>
          <Link
            href="/decide"
            className="fade-in inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-semibold text-lg hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
          >
            <span>📱</span>
            <span>开始决策</span>
          </Link>
        </div>

        <div className="mt-16 pt-8 border-t border-[rgba(255,255,255,0.06)] text-center">
          <p className="text-xs text-[rgba(255,255,255,0.35)] mb-1">
            摇一摇决策器 · TRAE AI 创造力大赛 · 硬件交互赛道
          </p>
          <p className="text-xs text-[rgba(255,255,255,0.25)]">
            全程使用 TRAE IDE + TRAE Work 开发
          </p>
        </div>
      </div>
    </footer>
  );
}
