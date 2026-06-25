"use client";

import { AlertTriangle, RotateCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative z-10">
      <div className="text-center">
        <AlertTriangle className="w-16 h-16 mx-auto mb-6 text-[#fbbf24]" />
        <h1 className="text-2xl font-bold text-white mb-2">哎呀，出了点问题</h1>
        <p className="text-[rgba(255,255,255,0.5)] text-sm mb-8 max-w-md">
          {error.message || "页面加载时遇到了意外错误，请重试。"}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-medium hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 cursor-pointer"
        >
          <RotateCw className="w-4 h-4" />
          <span>再试一次</span>
        </button>
      </div>
    </div>
  );
}
