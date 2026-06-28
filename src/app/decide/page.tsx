"use client";

import { useState, useCallback, useEffect, useRef, type ComponentType } from "react";
import Link from "next/link";
import {
  useShakeDetection,
  useClickShake,
  TangleLevel,
} from "@/hooks/useShakeDetection";
import { AnalysisResult } from "@/types/decision";
import { saveDecision } from "@/lib/storage";
import { useToast } from "@/components/Toast";
import {
  Smartphone, ArrowLeft, Sparkles, Save, RotateCcw, Link2,
  Check, Clock, Lightbulb, Search, BarChart3, Zap, CheckCircle2,
  MessageSquare, Flame, ArrowRight, Target, X, Heart, Star, TrendingUp
} from "lucide-react";

// Types
type Phase = "input" | "shaking" | "analyzing" | "result";

// Quick Templates
const templates = [
  {
    icon: "utensils",
    label: "今天吃什么",
    dilemma: "中午吃什么好纠结",
    optionA: "外卖",
    optionB: "食堂",
  },
  {
    icon: "shopping",
    label: "买还是不买",
    dilemma: "要不要买这个东西",
    optionA: "买",
    optionB: "不买",
  },
  {
    icon: "home",
    label: "出门还是宅家",
    dilemma: "周末出门还是宅家",
    optionA: "出门浪",
    optionB: "宅家躺",
  },
];

const loadingMessages = [
  "正在分析你的措辞倾向...",
  "正在解读摇晃力度...",
  "正在推断纠结根因...",
  "正在生成决策建议...",
];

// Helpers
function getTangleInfo(intensity: number) {
  if (intensity <= 30) return { level: "light" as TangleLevel, label: "轻度纠结" };
  if (intensity <= 60) return { level: "medium" as TangleLevel, label: "中度纠结" };
  if (intensity <= 85) return { level: "heavy" as TangleLevel, label: "重度纠结" };
  return { level: "extreme" as TangleLevel, label: "极度纠结" };
}

function TangleIcon({ level, className }: { level: TangleLevel; className?: string }) {
  switch (level) {
    case "light": return <CheckCircle2 className={className || "w-4 h-4 text-[#34d399]"} />;
    case "medium": return <Clock className={className || "w-4 h-4 text-[#fbbf24]"} />;
    case "heavy": return <Flame className={className || "w-4 h-4 text-[#fb923c]"} />;
    case "extreme": return <Zap className={className || "w-4 h-4 text-[#f472b6]"} />;
  }
}

function getIntensityColor(intensity: number): string {
  if (intensity <= 30) return "#34d399";
  if (intensity <= 60) return "#fbbf24";
  if (intensity <= 85) return "#fb923c";
  return "#f472b6";
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return "#34d399";
  if (confidence >= 60) return "#fbbf24";
  return "#fb923c";
}

const SUGGESTION_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  check: Check,
  clock: Clock,
  lightbulb: Lightbulb,
  target: Target,
  zap: Zap,
  flame: Flame,
  heart: Heart,
  star: Star,
  trending: TrendingUp,
};

function SuggestionIcon({ name, className }: { name: string; className?: string }) {
  const Icon = SUGGESTION_ICONS[name] || Lightbulb;
  return <Icon className={className} />;
}

// HTTPS Banner
function HttpsBanner() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isSecure =
        window.location.protocol === "https:" ||
        window.location.hostname === "localhost";
      setVisible(!isSecure);
    }
  }, []);
  if (!visible) return null;
  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-[rgba(251,191,36,0.15)] backdrop-blur-md px-4 py-3 flex items-center justify-between">
      <p className="text-sm text-[#fbbf24] flex items-center gap-1.5">
        <Smartphone className="w-4 h-4" />
        <span>陀螺仪需要 HTTPS 环境。当前使用点击模式代替，部署到 Vercel 后即可体验完整摇一摇功能。</span>
      </p>
      <button
        onClick={() => setVisible(false)}
        className="text-[#fbbf24] hover:text-white shrink-0 ml-4 cursor-pointer"
        aria-label="关闭提示"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Input Form
function DecisionInputForm({
  onSubmit,
}: {
  onSubmit: (data: { dilemma: string; optionA: string; optionB: string }) => void;
}) {
  const [dilemma, setDilemma] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [errors, setErrors] = useState<{ dilemma?: string; optionA?: string; optionB?: string }>({});
  const [flashField, setFlashField] = useState<string | null>(null);

  const validate = useCallback(() => {
    const nextErrors: typeof errors = {};
    if (!dilemma.trim()) nextErrors.dilemma = "请描述你的纠结";
    else if (dilemma.trim().length < 5) nextErrors.dilemma = "至少写5个字";
    if (!optionA.trim()) nextErrors.optionA = "不能为空";
    if (!optionB.trim()) nextErrors.optionB = "不能为空";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [dilemma, optionA, optionB]);

  const handleSubmit = () => {
    if (validate()) {
      onSubmit({ dilemma: dilemma.trim(), optionA: optionA.trim(), optionB: optionB.trim() });
    }
  };

  const applyTemplate = (t: (typeof templates)[0]) => {
    setDilemma(t.dilemma);
    setOptionA(t.optionA);
    setOptionB(t.optionB);
    setErrors({});
    setFlashField("template");
    setTimeout(() => setFlashField(null), 400);
  };

  const isDisabled = !dilemma.trim() || !optionA.trim() || !optionB.trim() || dilemma.trim().length < 5;

  return (
    <div className="w-full max-w-[520px] mx-auto px-4">
      <div className="bg-[rgba(255,255,255,0.06)] backdrop-blur-sm border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden animate-fade-in-up">
        <div
          className="h-[3px] w-full"
          style={{ background: "linear-gradient(90deg, #4f46e5, #7c3aed)" }}
        />
        <div className="p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-white mb-1">做个决定</h1>
          <p className="text-sm text-[rgba(255,255,255,0.5)] mb-8">
            描述你的纠结，摇一摇手机，让AI帮你分析
          </p>

          <div className="mb-6">
            <label className="block text-white font-semibold text-sm mb-2">
              你在纠结什么？
            </label>
            <div className="relative">
              <textarea
                value={dilemma}
                onChange={(e) => {
                  if (e.target.value.length <= 200) setDilemma(e.target.value);
                  if (errors.dilemma) setErrors((p) => ({ ...p, dilemma: undefined }));
                }}
                placeholder="比如：中午吃火锅还是日料、这个offer要不要接..."
                rows={3}
                className={`w-full bg-[rgba(255,255,255,0.04)] border rounded-xl px-4 py-3 text-white placeholder-[rgba(255,255,255,0.25)] text-sm resize-none outline-none transition-all duration-200 focus:border-[#4f46e5] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.2)] cursor-pointer ${
                  errors.dilemma ? "border-red-400" : "border-[rgba(255,255,255,0.08)]"
                }`}
              />
              <span className="absolute bottom-3 right-3 text-xs text-[rgba(255,255,255,0.35)]">
                {dilemma.length}/200
              </span>
            </div>
            {errors.dilemma && (
              <p className="text-red-400 text-xs mt-1.5">{errors.dilemma}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-white font-semibold text-sm mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                选项A
              </label>
              <div className="relative">
                <span className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg bg-[#38bdf8]" />
                <input
                  type="text"
                  value={optionA}
                  onChange={(e) => {
                    setOptionA(e.target.value);
                    if (errors.optionA) setErrors((p) => ({ ...p, optionA: undefined }));
                  }}
                  placeholder="选项A：火锅"
                  className={`w-full bg-[rgba(255,255,255,0.04)] border rounded-xl pl-4 pr-3 py-2.5 text-white placeholder-[rgba(255,255,255,0.25)] text-sm outline-none transition-all duration-200 focus:border-[#4f46e5] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.2)] cursor-pointer ${
                    errors.optionA ? "border-red-400" : "border-[rgba(255,255,255,0.08)]"
                  }`}
                />
              </div>
              {errors.optionA && (
                <p className="text-red-400 text-xs mt-1.5">{errors.optionA}</p>
              )}
            </div>
            <div>
              <label className="block text-white font-semibold text-sm mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#f472b6]" />
                选项B
              </label>
              <div className="relative">
                <span className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg bg-[#f472b6]" />
                <input
                  type="text"
                  value={optionB}
                  onChange={(e) => {
                    setOptionB(e.target.value);
                    if (errors.optionB) setErrors((p) => ({ ...p, optionB: undefined }));
                  }}
                  placeholder="选项B：日料"
                  className={`w-full bg-[rgba(255,255,255,0.04)] border rounded-xl pl-4 pr-3 py-2.5 text-white placeholder-[rgba(255,255,255,0.25)] text-sm outline-none transition-all duration-200 focus:border-[#4f46e5] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.2)] cursor-pointer ${
                    errors.optionB ? "border-red-400" : "border-[rgba(255,255,255,0.08)]"
                  }`}
                />
              </div>
              {errors.optionB && (
                <p className="text-red-400 text-xs mt-1.5">{errors.optionB}</p>
              )}
            </div>
          </div>

          <div className="mb-8">
            <p className="text-xs text-[rgba(255,255,255,0.4)] mb-3">
              或者试试快速模板
            </p>
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <button
                  key={t.label}
                  onClick={() => applyTemplate(t)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 cursor-pointer ${
                    flashField === "template"
                      ? "bg-[rgba(79,70,229,0.25)] border-[rgba(79,70,229,0.5)] text-white scale-105"
                      : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,255,255,0.10)] hover:border-[rgba(255,255,255,0.15)]"
                  }`}
                >
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isDisabled}
            className={`w-full py-4 px-8 rounded-xl text-white font-semibold text-base flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer ${
              isDisabled
                ? "bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.3)] cursor-not-allowed"
                : "bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            }`}
          >
            <span>准备好了，摇一摇！</span>
            <Smartphone className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Shake Interface
function ShakeInterface({
  dilemma,
  optionA,
  optionB,
  onReport,
  onAnalyze,
}: {
  dilemma: string;
  optionA: string;
  optionB: string;
  onReport: (stats: { shakeCount: number; peakIntensity: number; tangleLevel: TangleLevel }) => void;
  onAnalyze: () => void;
}) {
  const {
    permissionState,
    isClickMode,
    isSupported,
    startListening,
    stopListening,
    requestPermission,
    shakeCount: shakeCountVal,
    shakeIntensity: shakeIntensityVal,
    peakIntensity: shakePeakVal,
    isShaking: shakeIsShaking,
    debugInfo: shakeDebugInfo,
  } = useShakeDetection();

  const [count, setCount] = useState(0);
  const [intensity, setIntensity] = useState(0);
  const [peak, setPeak] = useState(0);
  const [shakingPhase, setShakingPhase] = useState<"shaking" | "finished">("shaking");
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listeningStartedRef = useRef(false);

  const tangleInfo = getTangleInfo(peak);

  // Sync gyroscope data from hook into unified local state
  useEffect(() => {
    if (shakeCountVal > 0) {
      setCount(shakeCountVal);
      setIntensity(shakeIntensityVal);
      if (shakePeakVal > peak) setPeak(shakePeakVal);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setIntensity(0);
      }, 500);
    }
  }, [shakeCountVal, shakeIntensityVal, shakePeakVal]);

  // Click-mode callback
  const handleClickShake = useCallback((computedIntensity: number) => {
    setCount((c) => {
      const nc = c + 1;
      setIntensity(computedIntensity);
      setPeak((p) => Math.max(p, computedIntensity));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setIntensity(0);
      }, 500);
      return nc;
    });
  }, []);

  const clickShake = useClickShake(handleClickShake);

  // Start listening when isSupported becomes true (not on mount when it's still false)
  useEffect(() => {
    if (listeningStartedRef.current) return;
    if (isSupported && (permissionState === "granted" || permissionState === "prompt")) {
      listeningStartedRef.current = true;
      startListening();
    }
  }, [isSupported, permissionState, startListening]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      stopListening();
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [stopListening]);

  // Auto-finish after idle if enough shakes
  useEffect(() => {
    if (shakingPhase !== "shaking") return;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (count >= 2) {
        setShakingPhase("finished");
      }
    }, 2500);
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [count, shakingPhase]);

  const bgOpacity = Math.min(0.05 + (intensity / 100) * 0.2, 0.25);

  const handleFinish = () => {
    onReport({
      shakeCount: count,
      peakIntensity: peak,
      tangleLevel: tangleInfo.level,
    });
    onAnalyze();
  };

  const handleCircleClick = async () => {
    // iOS 13+ 必须在用户手势中调用 requestPermission
    if (permissionState === "prompt" && !isClickMode) {
      const granted = await requestPermission();
      if (granted) {
        startListening();
      }
    }
    // Click mode fallback
    if (isClickMode || permissionState === "unsupported" || permissionState === "denied") {
      clickShake.triggerClick();
    }
  };

  const handleMouseDown = () => {
    if (isClickMode || permissionState === "unsupported" || permissionState === "denied") {
      clickShake.startClickHold();
    }
  };

  const handleMouseUp = () => {
    if (isClickMode || permissionState === "unsupported" || permissionState === "denied") {
      clickShake.stopClickHold();
    }
  };

  const circleScale = 1 + (intensity / 100) * 0.1;
  const circleColor = getIntensityColor(intensity);

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-center px-4">
      <div
        className="fixed inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          backgroundImage: `radial-gradient(ellipse at 50% 50%, rgba(79,70,229,${bgOpacity}) 0%, transparent 60%)`,
        }}
      />
      <div className="relative z-10 text-center mb-8 max-w-md">
        <p className="text-[rgba(255,255,255,0.5)] text-sm mb-2">你在纠结</p>
        <p className="text-white font-medium text-lg mb-1">{dilemma}</p>
        <div className="flex items-center justify-center gap-3 text-sm">
          <span className="text-[#38bdf8]">A: {optionA}</span>
          <span className="text-[rgba(255,255,255,0.3)]">vs</span>
          <span className="text-[#f472b6]">B: {optionB}</span>
        </div>
      </div>

      {shakingPhase === "shaking" ? (
        <>
          <div className="relative z-10 mb-10 w-[160px] h-[160px] mx-auto">
            <div className="absolute inset-[-50%] flex items-center justify-center pointer-events-none">
              <div className="w-full h-full rounded-full border-2 border-[rgba(79,70,229,0.3)] animate-pulse-ring" />
            </div>
            <div className="absolute inset-[-50%] flex items-center justify-center pointer-events-none">
              <div
                className="w-full h-full rounded-full border-2 border-[rgba(79,70,229,0.3)] animate-pulse-ring"
                style={{ animationDelay: "0.6s" }}
              />
            </div>
            <div className="absolute inset-[-50%] flex items-center justify-center pointer-events-none">
              <div
                className="w-full h-full rounded-full border-2 border-[rgba(79,70,229,0.3)] animate-pulse-ring"
                style={{ animationDelay: "1.2s" }}
              />
            </div>
            <button
              onClick={handleCircleClick}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={(e) => { e.preventDefault(); handleMouseDown(); }}
              onTouchEnd={handleMouseUp}
              className="relative w-[160px] h-[160px] rounded-full flex flex-col items-center justify-center text-white transition-all duration-150 select-none outline-none cursor-pointer"
              style={{
                background: intensity > 0
                  ? `linear-gradient(135deg, ${circleColor}, #7c3aed)`
                  : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                transform: `scale(${circleScale})`,
                boxShadow: intensity > 0
                  ? `0 0 60px ${circleColor}60`
                  : "0 0 40px rgba(79,70,229,0.3)",
              }}
            >
              {intensity > 0 ? (
                <>
                  <span className="text-3xl font-bold">{intensity}%</span>
                  <span className="text-sm mt-1"><TangleIcon level={tangleInfo.level} className="w-4 h-4" /></span>
                </>
              ) : (
                <>
                  <Smartphone className="w-8 h-8 mb-1" />
                  <span className="text-xs font-medium">
                    {isClickMode || permissionState === "unsupported"
                      ? "疯狂点击！"
                      : "摇一摇手机"}
                  </span>
                </>
              )}
            </button>
          </div>
          <p className="relative z-10 text-[rgba(255,255,255,0.6)] text-sm text-center mb-8 max-w-xs">
            {isClickMode || permissionState === "unsupported"
              ? "疯狂点击按钮！点击越快越用力，说明你越纠结"
              : "用力摇晃你的手机！摇得越猛，说明你越纠结"}
          </p>
          <div className="relative z-10 w-full max-w-[300px] sm:max-w-[400px] mb-4">
            <div className="flex justify-between text-xs text-[rgba(255,255,255,0.4)] mb-1.5">
              <span>不太纠结</span>
              <span>纠结到爆炸</span>
            </div>
            <div className="h-3 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-150 ease-out"
                style={{
                  width: `${intensity}%`,
                  background: `linear-gradient(90deg, #34d399, #fbbf24, #fb923c, #f472b6)`,
                }}
              />
            </div>
          </div>
          <div className="relative z-10 text-center">
            <p className="text-sm text-[rgba(255,255,255,0.6)] mb-3">
              已摇 <span key={count} className="text-white font-bold text-lg inline-block animate-bounce-count">{count}</span> 次，再摇几下或点击停止
            </p>
            <button
              onClick={() => setShakingPhase("finished")}
              className="px-5 py-2 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] text-sm text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,255,255,0.12)] hover:text-white transition-all duration-300 cursor-pointer"
            >
              停止摇晃
            </button>
          </div>

          {/* Debug info */}
          <div className="relative z-10 mt-6 px-4 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] max-w-[90vw] sm:max-w-[400px]">
            <p className="text-[10px] text-[rgba(255,255,255,0.35)] font-mono break-all">
              调试：{shakeDebugInfo}
            </p>
          </div>
        </>
      ) : (
        <div className="relative z-10 w-full max-w-[380px] animate-fade-in-up">
          <div className="bg-[rgba(255,255,255,0.06)] backdrop-blur-sm border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 text-center">
            <BarChart3 className="w-8 h-8 mx-auto mb-4 text-white" />
            <h2 className="text-xl font-bold text-white mb-6">摇晃报告</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center py-2">
                <span className="text-[rgba(255,255,255,0.6)] text-sm">摇晃次数</span>
                <span className="text-white font-semibold">{count}次</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[rgba(255,255,255,0.6)] text-sm">峰值力度</span>
                <span className="text-white font-semibold">{peak}%</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[rgba(255,255,255,0.6)] text-sm">纠结程度</span>
                <span className="font-semibold flex items-center gap-1" style={{ color: getIntensityColor(peak) }}>
                  <TangleIcon level={tangleInfo.level} /> {tangleInfo.label}
                </span>
              </div>
            </div>
            <button
              onClick={handleFinish}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-semibold hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>开始AI分析</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Analyzing Phase
function AnalyzingPhase() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % loadingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-center px-4">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(ellipse at 50% 50%, rgba(79,70,229,0.12) 0%, transparent 50%)`,
        }}
      />
      <div className="relative z-10 text-center">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 flex items-center justify-center animate-float-up">
            <Sparkles className="w-12 h-12 text-[#7c3aed]" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border-2 border-[rgba(79,70,229,0.2)] animate-[spin_3s_linear_infinite]" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-2 border-[rgba(124,58,237,0.2)] animate-[spin_2s_linear_infinite_reverse]" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[rgba(79,70,229,0.3)] animate-[spin_1.5s_linear_infinite]" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-white mb-4">AI 正在思考...</h2>
        <div className="h-6 overflow-hidden">
          <p
            key={messageIndex}
            className="text-[rgba(255,255,255,0.6)] text-sm animate-fade-in-up"
          >
            {loadingMessages[messageIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}

// Result Phase
function ResultPhase({
  result,
  mock,
  shakeStats,
  dilemma,
  optionA,
  optionB,
  onReset,
}: {
  result: AnalysisResult;
  mock: boolean;
  shakeStats: { shakeCount: number; peakIntensity: number; tangleLevel: TangleLevel };
  dilemma: string;
  optionA: string;
  optionB: string;
  onReset: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 800);
    return () => clearTimeout(t);
  }, []);

  const handleSave = () => {
    try {
      saveDecision(
        {
          dilemma,
          optionA,
          optionB,
          shakeIntensity: shakeStats.peakIntensity,
          shakeCount: shakeStats.shakeCount,
          tangleLevel: shakeStats.tangleLevel,
        },
        result
      );
      setSaved(true);
      showToast("决策已记录！一个月后回来看看这个选择让你满意吗", "success", 4000);
    } catch {
      showToast("保存失败，请重试", "error");
    }
  };

  const handleShare = async () => {
    const shareText = `摇一摇决策器AI分析\n\n我在纠结：${dilemma}\n推荐：${result.recommendLabel}\n\n${result.insight}\n\n摇晃力度：${shakeStats.peakIntensity}% | 置信度：${result.confidence}%\n\n你也来试试：${window.location.origin}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "摇一摇决策器 — AI帮我做了个决定",
          text: shareText,
        });
      } catch {
        // user cancelled share
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        showToast("已复制到剪贴板，快去分享吧！", "success");
        setTimeout(() => setCopied(false), 3000);
      } catch {
        showToast("复制失败，请手动复制", "error");
      }
    }
  };

  const recColor = result.recommendation === "A" ? "#38bdf8" : "#f472b6";
  const confColor = getConfidenceColor(result.confidence);

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-center px-4 py-20">

      <div className="w-full max-w-[560px] mx-auto animate-fade-in-up">
        <div className="bg-[rgba(255,255,255,0.06)] backdrop-blur-sm border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 sm:p-8 pb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5" />
              <span>AI 决策分析报告</span>
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={confColor}
                    strokeWidth="3"
                    strokeDasharray={`${result.confidence}, 100`}
                    className="transition-all duration-1000 ease-out"
                    style={{ strokeDasharray: revealed ? `${result.confidence}, 100` : `0, 100` }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                  {result.confidence}%
                </span>
              </div>
            </div>
          </div>

          <div className="px-6 sm:px-8">
            {/* Recommendation */}
            <div
              className="rounded-xl p-5 mb-6 text-center transition-all duration-700"
              style={{
                background: `linear-gradient(135deg, ${recColor}15, transparent)`,
                border: `1px solid ${recColor}30`,
              }}
            >
              <p className="text-xs text-[rgba(255,255,255,0.5)] mb-2">AI 推荐你选择</p>
              <div className="relative">
                {!revealed ? (
                  <p className="text-2xl font-bold text-white blur-sm">分析完成！</p>
                ) : (
                  <p
                    className="text-2xl font-bold transition-all duration-700"
                    style={{ color: recColor }}
                  >
                    {result.recommendLabel}
                  </p>
                )}
              </div>
              <p className="text-xs text-[rgba(255,255,255,0.4)] mt-2">
                置信度 {result.confidence}% · 选项{result.recommendation}
              </p>
            </div>

            {/* Root Causes */}
            <div className="mb-6 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Search className="w-4 h-4" />
                <span>纠结根因分析</span>
              </h3>
              <ul className="space-y-3">
                {result.rootCauses.map((cause, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-[rgba(255,255,255,0.7)] leading-relaxed animate-fade-in-up"
                    style={{ animationDelay: `${0.2 + i * 0.1}s` }}
                  >
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#4f46e5] to-[#fbbf24] shrink-0" />
                    <span>{cause}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Suggestions */}
            <div className="mb-6 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                <span>决策建议</span>
              </h3>
              <div className="space-y-2">
                {result.suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 animate-fade-in-up"
                    style={{ animationDelay: `${0.45 + i * 0.1}s` }}
                  >
                    <span className="text-lg shrink-0"><SuggestionIcon name={s.icon} className="w-4 h-4 text-[rgba(255,255,255,0.8)]" /></span>
                    <p className="text-sm text-[rgba(255,255,255,0.7)] leading-relaxed">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tangle Analysis */}
            <div className="mb-6 animate-fade-in-up" style={{ animationDelay: "0.55s" }}>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                <span>摇晃解读</span>
              </h3>
              <div className="flex items-start gap-3">
                <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 flex-1">
                  <p className="text-sm text-[rgba(255,255,255,0.7)] leading-relaxed">
                    {result.tangleAnalysis}
                  </p>
                </div>
                <div className="text-center shrink-0">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm mb-1"
                    style={{ background: getIntensityColor(shakeStats.peakIntensity) }}
                  >
                    {shakeStats.peakIntensity}%
                  </div>
                  <span className="text-xs text-[rgba(255,255,255,0.5)]">
                    <TangleIcon level={getTangleInfo(shakeStats.peakIntensity).level} className="w-4 h-4 mx-auto" />
                  </span>
                </div>
              </div>
            </div>

            {/* Insight */}
            <div
              className="rounded-xl p-5 mb-8 text-center animate-fade-in-up"
              style={{
                background: "linear-gradient(135deg, rgba(79,70,229,0.15), rgba(124,58,237,0.10))",
                border: "1px solid rgba(79,70,229,0.2)",
                animationDelay: "0.65s",
              }}
            >
              <p className="text-base text-white font-medium leading-relaxed">
                &ldquo;{result.insight}&rdquo;
              </p>
            </div>

            {/* Mock tag */}
            {mock && (
              <div className="mb-4 text-center">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[rgba(251,191,36,0.1)] border border-[rgba(251,191,36,0.2)] text-xs text-[#fbbf24]">
                  <Zap className="w-4 h-4" />
                  <span>Demo 模式 — 使用预设分析结果</span>
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pb-8">
              <button
                onClick={onReset}
                className="flex-1 py-3 px-6 rounded-xl border border-[rgba(255,255,255,0.15)] text-white font-medium hover:bg-[rgba(255,255,255,0.06)] transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>再来一次</span>
              </button>
              <button
                onClick={handleShare}
                className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${
                  copied
                    ? "bg-[rgba(56,189,248,0.15)] border border-[rgba(56,189,248,0.3)] text-[#38bdf8]"
                    : "border border-[rgba(255,255,255,0.15)] text-white hover:bg-[rgba(255,255,255,0.06)]"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-[#34d399]" />
                    <span>已复制</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    <span>分享给朋友</span>
                  </>
                )}
              </button>
              <button
                onClick={handleSave}
                disabled={saved}
                className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${
                  saved
                    ? "bg-[rgba(52,211,153,0.15)] border border-[rgba(52,211,153,0.3)] text-[#34d399]"
                    : "bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white hover:shadow-lg"
                }`}
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4 text-[#34d399]" />
                    <span>已保存</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>保存到决策日记</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Page
export default function DecidePage() {
  const [phase, setPhase] = useState<Phase>("input");
  const [dilemma, setDilemma] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [shakeStats, setShakeStats] = useState<{
    shakeCount: number;
    peakIntensity: number;
    tangleLevel: TangleLevel;
  } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    (data: { dilemma: string; optionA: string; optionB: string }) => {
      setDilemma(data.dilemma);
      setOptionA(data.optionA);
      setOptionB(data.optionB);
      setPhase("shaking");
    },
    []
  );

  const handleReport = useCallback(
    (stats: { shakeCount: number; peakIntensity: number; tangleLevel: TangleLevel }) => {
      setShakeStats(stats);
    },
    []
  );

  const handleAnalyze = useCallback(async () => {
    if (!shakeStats) return;
    setPhase("analyzing");
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dilemma,
          optionA,
          optionB,
          shakeIntensity: shakeStats.peakIntensity,
          shakeCount: shakeStats.shakeCount,
          tangleLevel: shakeStats.tangleLevel,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `请求失败: ${response.status}`);
      }

      const data = await response.json();
      setAnalysisResult(data.result);
      setIsMock(!!data.mock);
      setPhase("result");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "分析失败";
      setError(message);
      setPhase("result");
    }
  }, [dilemma, optionA, optionB, shakeStats]);

  const handleReset = useCallback(() => {
    setDilemma("");
    setOptionA("");
    setOptionB("");
    setShakeStats(null);
    setAnalysisResult(null);
    setIsMock(false);
    setError(null);
    setPhase("input");
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative min-h-screen pt-14 pb-10 overflow-hidden">
      <HttpsBanner />

      {/* Fixed back button in top-left */}
      <Link
        href="/"
        className="fixed top-[4.5rem] left-4 z-30 text-sm text-[rgba(255,255,255,0.5)] hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>返回</span>
      </Link>

      {/* Error toast */}
      {error && phase === "result" && (
        <div className="fixed top-14 left-0 right-0 z-40 bg-[rgba(244,114,182,0.15)] backdrop-blur-md px-4 py-3 text-center">
          <p className="text-sm text-[#f472b6]">{error}</p>
        </div>
      )}

      {phase === "input" && (
        <div className="transition-all duration-500 ease-out">
          <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
            <DecisionInputForm onSubmit={handleSubmit} />
          </div>
        </div>
      )}

      {phase === "shaking" && (
        <div className="transition-all duration-500 ease-out">
          <ShakeInterface
            dilemma={dilemma}
            optionA={optionA}
            optionB={optionB}
            onReport={handleReport}
            onAnalyze={handleAnalyze}
          />
        </div>
      )}

      {phase === "analyzing" && (
        <div className="transition-all duration-500 ease-out">
          <AnalyzingPhase />
        </div>
      )}

      {phase === "result" && (
        <div className="transition-all duration-500 ease-out">
          {analysisResult && shakeStats ? (
            <ResultPhase
              result={analysisResult}
              mock={isMock}
              shakeStats={shakeStats}
              dilemma={dilemma}
              optionA={optionA}
              optionB={optionB}
              onReset={handleReset}
            />
          ) : error ? (
            <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white mb-2">分析出错了</h1>
                <p className="text-[rgba(255,255,255,0.6)] mb-6">{error}</p>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-medium hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>再来一次</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
