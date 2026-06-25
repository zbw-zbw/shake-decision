"use client";

const techStack = [
  { icon: "📱", label: "硬件接入：DeviceMotion API（陀螺仪 + 加速度计）" },
  { icon: "🧠", label: "AI 分析：DeepSeek API（自然语言理解 + 心理倾向推断）" },
  { icon: "⚡", label: "前端框架：Next.js 14 + React + TypeScript" },
  { icon: "🎨", label: "UI 框架：Tailwind CSS + CSS Animation" },
];

export function TechSection() {
  return (
    <section className="relative w-full py-12 sm:py-20 px-4 sm:px-6">
      <div className="max-w-[1100px] mx-auto">
        <h2 className="fade-in text-2xl sm:text-3xl font-bold text-white text-center mb-14">
          技术实现
        </h2>

        <div className="fade-in bg-[rgba(255,255,255,0.06)] backdrop-blur-sm border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 sm:p-10">
          <div className="flex flex-col md:flex-row gap-10 md:gap-16">
            {/* Left: Tech stack */}
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-[rgba(255,255,255,0.5)] uppercase tracking-wider mb-6">
                技术栈
              </h3>
              <ul className="space-y-4">
                {techStack.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-[rgba(255,255,255,0.7)] text-sm"
                  >
                    <span className="text-lg shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Flow chart */}
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-[rgba(255,255,255,0.5)] uppercase tracking-wider mb-6">
                流程图
              </h3>
              <div className="flex flex-col items-center gap-3">
                {/* Node 1 */}
                <div className="w-full max-w-[200px]">
                  <div className="bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] rounded-xl px-4 py-3 text-center">
                    <p className="text-white text-sm font-medium">用户输入</p>
                  </div>
                  <p className="text-center text-[10px] text-[rgba(255,255,255,0.4)] mt-1">
                    描述纠结 · 选项A/B
                  </p>
                </div>

                {/* Arrow */}
                <div className="h-6 w-px bg-gradient-to-b from-[#4f46e5] to-[#7c3aed]" />

                {/* Node 2 */}
                <div className="w-full max-w-[200px]">
                  <div className="bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] rounded-xl px-4 py-3 text-center">
                    <p className="text-white text-sm font-medium">摇晃检测</p>
                  </div>
                  <p className="text-center text-[10px] text-[rgba(255,255,255,0.4)] mt-1">
                    DeviceMotion · 力度计算
                  </p>
                </div>

                {/* Arrow */}
                <div className="h-6 w-px bg-gradient-to-b from-[#4f46e5] to-[#7c3aed]" />

                {/* Node 3 */}
                <div className="w-full max-w-[200px]">
                  <div className="bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] rounded-xl px-4 py-3 text-center">
                    <p className="text-white text-sm font-medium">AI分析</p>
                  </div>
                  <p className="text-center text-[10px] text-[rgba(255,255,255,0.4)] mt-1">
                    DeepSeek · Prompt
                  </p>
                </div>

                {/* Arrow */}
                <div className="h-6 w-px bg-gradient-to-b from-[#4f46e5] to-[#7c3aed]" />

                {/* Node 4 */}
                <div className="w-full max-w-[200px]">
                  <div className="bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] rounded-xl px-4 py-3 text-center">
                    <p className="text-white text-sm font-medium">决策报告</p>
                  </div>
                  <p className="text-center text-[10px] text-[rgba(255,255,255,0.4)] mt-1">
                    心理学建议 · 根因分析
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
