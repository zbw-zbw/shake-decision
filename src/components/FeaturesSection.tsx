"use client";

import { Smartphone, Brain, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Smartphone,
    title: "陀螺仪感应",
    description:
      "真实调用 DeviceMotion API，摇晃力度越大，说明越纠结，AI分析越深入",
  },
  {
    icon: Brain,
    title: "心理学分析",
    description:
      "AI不只看选项，更分析你的措辞、提及顺序、犹豫点，找到纠结的根因",
  },
  {
    icon: BarChart3,
    title: "决策日记",
    description:
      "记录每次决策和AI建议，一个月后回看：你的选择让你满意吗？",
  },
];

export function FeaturesSection() {
  return (
    <section className="relative w-full py-12 sm:py-20 px-4 sm:px-6">
      <div className="max-w-[1100px] mx-auto">
        <h2 className="fade-in text-2xl sm:text-3xl font-bold text-white text-center mb-14">
          为什么不是普通的随机转盘
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="fade-in flex flex-col items-center text-center p-6"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="mb-5 animate-float-up" style={{ animationDelay: `${index * 0.3}s` }}>
                <feature.icon className="w-14 h-14 text-white opacity-80 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-[rgba(255,255,255,0.7)] text-sm leading-relaxed max-w-xs">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
