"use client";

const scenes = [
  {
    tag: "日常决策",
    tagColor: "#34d399",
    tagBg: "rgba(52,211,153,0.15)",
    question: "穿黑色外套还是白色外套？",
    analysis:
      "你今天有重要会议，黑色更有气场。但你摇的力度很轻（23%），说明你其实不太纠结，只是需要有人替你说出答案。",
    level: 23,
    levelLabel: "轻度纠结",
    levelEmoji: "💚",
    bars: 2,
  },
  {
    tag: "消费决策",
    tagColor: "#38bdf8",
    tagBg: "rgba(56,189,248,0.15)",
    question: "买iPhone还是安卓旗舰？",
    analysis:
      "你的描述中3次提到\"性价比\"，说明预算是核心考量。你纠结的不是哪个更好，而是想买贵的但觉得不应该。建议：买你真正想要的，纠结的时间成本比差价更贵。",
    level: 60,
    levelLabel: "中度纠结",
    levelEmoji: "🟡",
    bars: 6,
  },
  {
    tag: "人生抉择",
    tagColor: "#f472b6",
    tagBg: "rgba(244,114,182,0.15)",
    question: "留在大城市还是回老家？",
    analysis:
      "这个问题的摇晃力度达到95%——你真的很纠结。但注意：你没有提到\"想回老家\"，你说的是\"该不该回\"。\"想\"和\"该\"是两件事。建议你先分清这两者。",
    level: 95,
    levelLabel: "极度纠结",
    levelEmoji: "🔴",
    bars: 9,
  },
];

function ProgressBar({ level, bars }: { level: number; bars: number }) {
  const totalBars = 10;
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: totalBars }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-sm ${
              i < bars
                ? level <= 30
                  ? "bg-[#34d399]"
                  : level <= 70
                  ? "bg-[#fbbf24]"
                  : "bg-[#f472b6]"
                : "bg-[rgba(255,255,255,0.08)]"
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-[rgba(255,255,255,0.5)]">{level}%</span>
      <span className="text-xs">
        {level <= 30 ? "💚" : level <= 70 ? "🟡" : "🔴"} {level <= 30 ? "轻度纠结" : level <= 70 ? "中度纠结" : "极度纠结"}
      </span>
    </div>
  );
}

export function ScenesSection() {
  return (
    <section className="relative w-full py-12 sm:py-20 px-4 sm:px-6">
      <div className="max-w-[1100px] mx-auto">
        <h2 className="fade-in text-2xl sm:text-3xl font-bold text-white text-center mb-14">
          AI怎么分析你的纠结
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {scenes.map((scene, index) => (
            <div
              key={index}
              className="fade-in group bg-[rgba(255,255,255,0.06)] backdrop-blur-sm border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 hover:bg-[rgba(255,255,255,0.10)] hover:border-[rgba(255,255,255,0.15)] hover:-translate-y-1 transition-all duration-300"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="mb-4">
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    color: scene.tagColor,
                    backgroundColor: scene.tagBg,
                    border: `1px solid ${scene.tagColor}30`,
                  }}
                >
                  {scene.tag}
                </span>
              </div>
              <p className="text-white font-medium text-base mb-4">
                {scene.question}
              </p>
              <p className="text-[rgba(255,255,255,0.7)] text-sm leading-relaxed mb-6">
                {scene.analysis}
              </p>
              <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
                <ProgressBar level={scene.level} bars={scene.bars} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
