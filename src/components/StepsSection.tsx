"use client";

import { useEffect, useRef, useState } from "react";
import { Smartphone, RotateCw, Target, Flame, Fish } from "lucide-react";

const STEP_COLORS = [
  "linear-gradient(135deg, #4f46e5, #7c3aed)",
  "linear-gradient(135deg, #7c3aed, #f472b6)",
  "linear-gradient(135deg, #f472b6, #fbbf24)",
];

export function StepsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <section className="relative w-full py-12 sm:py-20 px-4 sm:px-6">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-14">
          <h2 className="fade-in text-2xl sm:text-3xl font-bold text-white mb-3">
            三步搞定选择困难
          </h2>
          <p className="fade-in text-[rgba(255,255,255,0.7)]">
            不是随机选一个，而是帮你看清为什么纠结
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" ref={sectionRef}>
          {/* Step 1 */}
          <div
            className={`bg-[rgba(255,255,255,0.06)] backdrop-blur-sm border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 hover:bg-[rgba(255,255,255,0.10)] transition-all duration-300 ${
              visible ? "animate-stagger-in opacity-0" : "opacity-0"
            }`}
            style={{ animationDelay: visible ? "0ms" : undefined, animationFillMode: "forwards" }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm mb-5 mx-auto"
              style={{ background: STEP_COLORS[0] }}
            >
              1
            </div>
            <h3 className="text-lg font-semibold text-white text-center mb-5">
              输入你的纠结
            </h3>
            <div className="bg-[rgba(0,0,0,0.2)] rounded-xl p-4 border border-[rgba(255,255,255,0.06)]">
              <p className="text-[rgba(255,255,255,0.5)] text-sm mb-3">你在纠结什么？</p>
              <div className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white text-sm mb-4">
                中午吃火锅还是日料
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="text-[#38bdf8] flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> 选项A：火锅</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="text-[#f472b6] flex items-center gap-1"><Fish className="w-3.5 h-3.5" /> 选项B：日料</span>
                </div>
              </div>
              <button className="w-full py-2 rounded-lg bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white text-sm font-medium flex items-center justify-center gap-2 cursor-pointer">
                <RotateCw className="w-3.5 h-3.5" />
                <span>摇一摇手机，开始分析</span>
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div
            className={`animate-shake-card bg-[rgba(255,255,255,0.06)] backdrop-blur-sm border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 hover:bg-[rgba(255,255,255,0.10)] transition-all duration-300 ${
              visible ? "animate-stagger-in opacity-0" : "opacity-0"
            }`}
            style={{ animationDelay: visible ? "200ms" : undefined, animationFillMode: "forwards" }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm mb-5 mx-auto"
              style={{ background: STEP_COLORS[1] }}
            >
              2
            </div>
            <h3 className="text-lg font-semibold text-white text-center mb-5">
              摇晃手机
            </h3>
            <div className="bg-[rgba(0,0,0,0.2)] rounded-xl p-4 border border-[rgba(255,255,255,0.06)]">
              <div className="flex items-center gap-2 text-white text-sm font-medium mb-4">
                <Smartphone className="w-4 h-4" />
                <span>检测到摇晃！</span>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-xs text-[rgba(255,255,255,0.5)] mb-1">
                  <span>摇晃力度</span>
                  <span>78%</span>
                </div>
                <div className="h-2 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full animate-progress-fill"
                    style={{
                      background: "linear-gradient(90deg, #38bdf8, #fbbf24)",
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-[rgba(255,255,255,0.7)] mb-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-glow-pulse absolute inline-flex h-full w-full rounded-full bg-[#fbbf24]" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#fbbf24]" />
                </span>
                <span className="flex items-center gap-1.5">纠结程度：<span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24] inline-block" /> 中度纠结</span>
              </div>
              <p className="text-xs text-[rgba(255,255,255,0.4)]">
                AI 正在分析你的内心倾向...
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div
            className={`bg-[rgba(255,255,255,0.06)] backdrop-blur-sm border border-[rgba(79,70,229,0.4)] rounded-2xl p-6 hover:bg-[rgba(255,255,255,0.10)] transition-all duration-300 shadow-[0_0_20px_rgba(79,70,229,0.15)] ${
              visible ? "animate-stagger-in opacity-0" : "opacity-0"
            }`}
            style={{ animationDelay: visible ? "400ms" : undefined, animationFillMode: "forwards" }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm mb-5 mx-auto"
              style={{ background: STEP_COLORS[2] }}
            >
              3
            </div>
            <h3 className="text-lg font-semibold text-white text-center mb-5">
              收到AI建议
            </h3>
            <div className="bg-[rgba(0,0,0,0.2)] rounded-xl p-4 border border-[rgba(255,255,255,0.06)]">
              <div className="flex items-center gap-2 text-white text-sm font-medium mb-3">
                <Target className="w-4 h-4" />
                <span>AI 决策分析报告</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm">
                  <span className="text-[rgba(255,255,255,0.5)]">推荐：</span>
                  <span className="text-[#fbbf24] font-medium flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> 火锅</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="relative w-10 h-10">
                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="url(#grad1)"
                        strokeWidth="3"
                        strokeDasharray="82, 100"
                        className="animate-progress-fill"
                      />
                      <defs>
                        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#4f46e5" />
                          <stop offset="100%" stopColor="#fbbf24" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                      82%
                    </span>
                  </div>
                  <span className="text-xs text-[rgba(255,255,255,0.5)]">置信度</span>
                </div>
              </div>
              <div className="pt-3 mb-3">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-xs text-[rgba(255,255,255,0.7)]">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#4f46e5] to-[#fbbf24] shrink-0" />
                    <span>你其实更想吃火锅（先提到的选项往往是内心倾向）</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs text-[rgba(255,255,255,0.7)]">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#4f46e5] to-[#fbbf24] shrink-0" />
                    <span>但日料看起来更"健康"，你在用理性压制直觉</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs text-[rgba(255,255,255,0.7)]">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#4f46e5] to-[#fbbf24] shrink-0" />
                    <span>你最近可能压力较大，火锅的热闹感更能缓解情绪</span>
                  </li>
                </ul>
              </div>
              <div className="pt-3">
                <div className="space-y-1.5">
                  <p className="text-xs text-[rgba(255,255,255,0.7)] flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-[#fbbf24]" /> 今天吃火锅，满足直觉需求
                  </p>
                  <p className="text-xs text-[rgba(255,255,255,0.7)] flex items-center gap-1">
                    <Fish className="w-3.5 h-3.5 text-[#f472b6]" /> 日料留给周末，当作对自己的奖励
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
