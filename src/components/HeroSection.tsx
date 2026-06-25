"use client";

import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative w-full pt-32 pb-16 px-4 sm:px-6 text-center overflow-hidden">
      <div className="max-w-[1100px] mx-auto flex flex-col items-center">
        {/* Tag */}
        <div className="fade-in inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[rgba(79,70,229,0.4)] bg-[rgba(79,70,229,0.1)] text-sm text-[rgba(255,255,255,0.7)] mb-8">
          <span>TRAE AI 创造力大赛</span>
          <span className="text-[rgba(255,255,255,0.4)]">·</span>
          <span>硬件交互赛道</span>
        </div>

        {/* Title */}
        <h1 className="fade-in animate-shake-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gradient mb-6" style={{ animationDelay: "0.2s" }}>
          摇一摇决策器
        </h1>

        {/* Subtitle */}
        <p className="fade-in text-xl sm:text-2xl text-[rgba(255,255,255,0.7)] mb-4" style={{ animationDelay: "0.3s" }}>
          选择困难？摇一下就好
        </p>

        {/* Quote */}
        <p className="fade-in max-w-xl text-[rgba(255,255,255,0.4)] text-sm sm:text-base mb-12" style={{ animationDelay: "0.4s" }}>
          每天35000个决策，最折磨人的不是大事，而是那些"选A选B都行，但就是选不了"的日常小纠结。
        </p>

        {/* Pulse Button */}
        <div className="fade-in relative mb-16" style={{ animationDelay: "0.5s" }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[120px] h-[120px] rounded-full border-2 border-[rgba(79,70,229,0.3)] animate-pulse-ring" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-[120px] h-[120px] rounded-full border-2 border-[rgba(79,70,229,0.3)] animate-pulse-ring"
              style={{ animationDelay: "0.6s" }}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-[120px] h-[120px] rounded-full border-2 border-[rgba(79,70,229,0.3)] animate-pulse-ring"
              style={{ animationDelay: "1.2s" }}
            />
          </div>
          <Link
            href="/decide"
            className="relative w-[120px] h-[120px] rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex flex-col items-center justify-center text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            <span className="text-2xl mb-1">📱</span>
            <span className="text-sm font-medium">摇一摇</span>
          </Link>
        </div>

        {/* Scroll down */}
        <div className="fade-in flex flex-col items-center text-[rgba(255,255,255,0.4)] text-sm" style={{ animationDelay: "0.6s" }}>
          <span className="mb-2">看看怎么用</span>
          <span className="animate-bounce-down text-lg">↓</span>
        </div>
      </div>
    </section>
  );
}
