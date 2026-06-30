"use client";

import { useState, useCallback, useEffect, useRef, type ComponentType } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useShakeDetection,
  useClickShake,
  TangleLevel,
} from "@/hooks/useShakeDetection";
import { useConfetti } from "@/hooks/useConfetti";
import { AnalysisResult } from "@/types/decision";
import { saveDecision, getDecisions, getCustomTemplates, saveCustomTemplate, deleteCustomTemplate } from "@/lib/storage";
import { useToast } from "@/components/Toast";
import {
  Smartphone, ArrowLeft, Sparkles, RotateCcw, Link2,
  Check, Clock, Lightbulb, Search, BarChart3, Zap, CheckCircle2,
  MessageSquare, Flame, ArrowRight, Target, X, Heart, Star, TrendingUp, BookOpen,
  Utensils, ShoppingBag, Home, Briefcase, Book, Car, Dumbbell, Plane, Moon,
  Volume2, VolumeX, Maximize, Minimize, Trash2,
} from "lucide-react";
import {
  setSoundEnabled,
  isSoundEnabled,
} from "@/hooks/useShakeDetection";

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
  {
    icon: "briefcase",
    label: "跳槽还是留下",
    dilemma: "要不要换一份工作",
    optionA: "跳槽",
    optionB: "留下",
  },
  {
    icon: "heart",
    label: "表白还是暗恋",
    dilemma: "要不要向喜欢的人表白",
    optionA: "表白",
    optionB: "继续暗恋",
  },
  {
    icon: "book",
    label: "考研还是工作",
    dilemma: "毕业后考研还是直接工作",
    optionA: "考研",
    optionB: "工作",
  },
  {
    icon: "car",
    label: "买车还是打车",
    dilemma: "要不要买一辆车",
    optionA: "买车",
    optionB: "继续打车",
  },
  {
    icon: "dumbbell",
    label: "健身还是躺平",
    dilemma: "今天要不要去健身",
    optionA: "去健身",
    optionB: "躺着休息",
  },
  {
    icon: "plane",
    label: "旅游还是省钱",
    dilemma: "要不要出去旅游",
    optionA: "去旅游",
    optionB: "在家省钱",
  },
  {
    icon: "moon",
    label: "早睡还是熬夜",
    dilemma: "今晚要不要早睡",
    optionA: "早睡",
    optionB: "再玩一会儿",
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
  utensils: Utensils,
  shopping: ShoppingBag,
  home: Home,
  briefcase: Briefcase,
  book: Book,
  car: Car,
  dumbbell: Dumbbell,
  plane: Plane,
  moon: Moon,
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
  initialValues,
}: {
  onSubmit: (data: { dilemma: string; optionA: string; optionB: string }) => void;
  initialValues?: { dilemma: string; optionA: string; optionB: string };
}) {
  const [dilemma, setDilemma] = useState(initialValues?.dilemma ?? "");
  const [optionA, setOptionA] = useState(initialValues?.optionA ?? "");
  const [optionB, setOptionB] = useState(initialValues?.optionB ?? "");
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

  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [customTemplates, setCustomTemplates] = useState<Array<{id: string; dilemma: string; optionA: string; optionB: string; label: string; icon: string}>>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");

  // Load custom templates on mount
  useEffect(() => {
    setCustomTemplates(getCustomTemplates());
  }, []);

  const applyTemplate = (t: { dilemma: string; optionA: string; optionB: string; label: string }) => {
    setDilemma(t.dilemma);
    setOptionA(t.optionA);
    setOptionB(t.optionB);
    setErrors({});
    setActiveTemplate(t.label);
    setTimeout(() => setActiveTemplate(null), 400);
  };

  const handleSaveTemplate = () => {
    const name = templateName.trim() || dilemma.trim().slice(0, 10);
    saveCustomTemplate({
      dilemma: dilemma.trim(),
      optionA: optionA.trim(),
      optionB: optionB.trim(),
      label: name,
      icon: "star",
    });
    setCustomTemplates(getCustomTemplates());
    setShowSaveDialog(false);
    setTemplateName("");
  };

  const handleDeleteTemplate = (id: string) => {
    deleteCustomTemplate(id);
    setCustomTemplates(getCustomTemplates());
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
              <span className={`absolute bottom-3 right-3 text-xs ${dilemma.length >= 200 ? "text-red-400" : dilemma.length > 180 ? "text-amber-400" : "text-[rgba(255,255,255,0.35)]"}`}>
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
                  maxLength={50}
                  onChange={(e) => {
                    setOptionA(e.target.value);
                    if (errors.optionA) setErrors((p) => ({ ...p, optionA: undefined }));
                  }}
                  placeholder="选项A：火锅"
                  className={`w-full bg-[rgba(255,255,255,0.04)] border rounded-xl pl-4 pr-12 py-2.5 text-white placeholder-[rgba(255,255,255,0.25)] text-sm outline-none transition-all duration-200 focus:border-[#4f46e5] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.2)] cursor-pointer ${
                    errors.optionA ? "border-red-400" : "border-[rgba(255,255,255,0.08)]"
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[rgba(255,255,255,0.35)]">{optionA.length}/50</span>
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
                  maxLength={50}
                  onChange={(e) => {
                    setOptionB(e.target.value);
                    if (errors.optionB) setErrors((p) => ({ ...p, optionB: undefined }));
                  }}
                  placeholder="选项B：日料"
                  className={`w-full bg-[rgba(255,255,255,0.04)] border rounded-xl pl-4 pr-12 py-2.5 text-white placeholder-[rgba(255,255,255,0.25)] text-sm outline-none transition-all duration-200 focus:border-[#4f46e5] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.2)] cursor-pointer ${
                    errors.optionB ? "border-red-400" : "border-[rgba(255,255,255,0.08)]"
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[rgba(255,255,255,0.35)]">{optionB.length}/50</span>
              </div>
              {errors.optionB && (
                <p className="text-red-400 text-xs mt-1.5">{errors.optionB}</p>
              )}
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-[rgba(255,255,255,0.4)]">
                或者试试快速模板
              </p>
              {!isDisabled && (
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.08)] text-[#fbbf24] hover:bg-[rgba(251,191,36,0.15)] transition-all duration-200 cursor-pointer"
                >
                  <Star className="w-3 h-3" />
                  <span>收藏为模板</span>
                </button>
              )}
            </div>

            {/* Save template dialog */}
            {showSaveDialog && (
              <div className="mb-3 p-3 rounded-xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] animate-fade-in-up">
                <p className="text-xs text-[rgba(255,255,255,0.5)] mb-2">给模板起个名字</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder={dilemma.trim().slice(0, 10)}
                    maxLength={20}
                    className="flex-1 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-1.5 text-sm text-white placeholder-[rgba(255,255,255,0.25)] outline-none focus:border-[#4f46e5] cursor-pointer"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveTemplate();
                      if (e.key === "Escape") setShowSaveDialog(false);
                    }}
                  />
                  <button
                    onClick={handleSaveTemplate}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white text-xs font-medium hover:shadow-lg transition-all duration-200 cursor-pointer"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => { setShowSaveDialog(false); setTemplateName(""); }}
                    className="px-2 py-1.5 rounded-lg text-[rgba(255,255,255,0.4)] text-xs hover:text-white transition-colors cursor-pointer"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <button
                  key={t.label}
                  onClick={() => applyTemplate(t)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 cursor-pointer ${
                    activeTemplate === t.label
                      ? "bg-[rgba(79,70,229,0.25)] border-[rgba(79,70,229,0.5)] text-white scale-105"
                      : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,255,255,0.10)] hover:border-[rgba(255,255,255,0.15)]"
                  }`}
                >
                  <SuggestionIcon name={t.icon} className="w-3 h-3" />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Divider between preset and custom templates */}
            {customTemplates.length > 0 && (
              <>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
                  <span className="text-[10px] text-[rgba(255,255,255,0.3)] uppercase tracking-wider">我的收藏</span>
                  <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {customTemplates.map((ct) => (
                    <div
                      key={ct.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.06)] text-[rgba(255,255,255,0.8)] group transition-all duration-200"
                    >
                      <button
                        onClick={() => applyTemplate(ct)}
                        className="inline-flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors"
                      >
                        <Star className="w-3 h-3 text-[#fbbf24]" />
                        <span>{ct.label}</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(ct.id); }}
                        className="ml-0.5 text-[rgba(255,255,255,0.2)] hover:text-red-400 transition-colors cursor-pointer"
                        aria-label="删除模板"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
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
  onAnalyze: (stats: { shakeCount: number; peakIntensity: number; tangleLevel: TangleLevel }) => void;
}) {
  const router = useRouter();
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
    preloadAudio,
  } = useShakeDetection();

  const [count, setCount] = useState(0);
  const [intensity, setIntensity] = useState(0);
  const [peak, setPeak] = useState(0);
  const [shakingPhase, setShakingPhase] = useState<"shaking" | "finished">("shaking");
  const [pulseKey, setPulseKey] = useState(0);
  const [muted, setMuted] = useState(() => !isSoundEnabled());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listeningStartedRef = useRef(false);

  const TARGET_SHAKES = 5;
  const progress = Math.min(count / TARGET_SHAKES, 1);
  const remaining = Math.max(TARGET_SHAKES - count, 0);

  const tangleInfo = getTangleInfo(peak);

  // Vibration feedback on shake
  const triggerHaptic = useCallback((intensityVal: number) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      const duration = Math.min(50 + intensityVal * 2, 200);
      navigator.vibrate(duration);
    }
  }, []);

  // Sync gyroscope data from hook into unified local state
  useEffect(() => {
    if (shakeCountVal > 0) {
      setCount(shakeCountVal);
      setIntensity(shakeIntensityVal);
      if (shakePeakVal > peak) setPeak(shakePeakVal);
      setPulseKey((k) => k + 1);
      triggerHaptic(shakeIntensityVal);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setIntensity(0);
      }, 500);
    }
  }, [shakeCountVal, shakeIntensityVal, shakePeakVal, peak, triggerHaptic]);

  // Click-mode callback
  const handleClickShake = useCallback((computedIntensity: number) => {
    setCount((c) => {
      const nc = c + 1;
      setIntensity(computedIntensity);
      setPeak((p) => Math.max(p, computedIntensity));
      setPulseKey((k) => k + 1);
      triggerHaptic(computedIntensity);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setIntensity(0);
      }, 500);
      return nc;
    });
  }, [triggerHaptic]);

  const clickShake = useClickShake(handleClickShake);
  const { triggerClick } = clickShake;

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

  // Auto-finish when target reached
  useEffect(() => {
    if (shakingPhase !== "shaking") return;
    if (count >= TARGET_SHAKES) {
      const t = setTimeout(() => {
        setShakingPhase("finished");
      }, 600);
      return () => clearTimeout(t);
    }
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

  // Auto-start AI analysis when shaking finishes (no manual button click needed)
  useEffect(() => {
    if (shakingPhase !== "finished") return;
    // Stop listening to prevent further shake detection
    stopListening();
    clickShake.stopClickHold();
    // Auto-trigger analysis after a brief delay for the finish animation
    const t = setTimeout(() => {
      const stats = {
        shakeCount: count,
        peakIntensity: peak,
        tangleLevel: tangleInfo.level,
      };
      onReport(stats);
      onAnalyze(stats);
    }, 800);
    return () => clearTimeout(t);
  }, [shakingPhase]);

  // PC space key to trigger a shake (only during shaking phase)
  useEffect(() => {
    if (shakingPhase !== "shaking") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      // Ignore space when typing in inputs/textareas or focusing buttons
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "BUTTON", "SELECT"].includes(target.tagName)) return;
      e.preventDefault();
      triggerClick();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shakingPhase, triggerClick]);

  // Preload audio context on first user gesture in shaking phase
  useEffect(() => {
    if (shakingPhase !== "shaking") return;
    const warmup = async () => preloadAudio();
    window.addEventListener("pointerdown", warmup, { once: true });
    return () => window.removeEventListener("pointerdown", warmup);
  }, [shakingPhase, preloadAudio]);

  const bgOpacity = Math.min(0.05 + (intensity / 100) * 0.2, 0.25);

  // Sound toggle handler
  const toggleSound = useCallback(() => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    setSoundEnabled(!nextMuted);
  }, [muted]);

  // Fullscreen toggle handler
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        // ignore errors
      });
    } else {
      document.exitFullscreen().catch(() => {
        // ignore errors
      });
    }
  }, []);

  // Track fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleFinish = () => {
    const stats = {
      shakeCount: count,
      peakIntensity: peak,
      tangleLevel: tangleInfo.level,
    };
    onReport(stats);
    onAnalyze(stats);
  };

  const handleCircleClick = async () => {
    // iOS 13+ must call requestPermission in user gesture
    if (permissionState === "prompt" && !isClickMode) {
      const granted = await requestPermission();
      if (granted) {
        startListening();
      }
    }
    // Always trigger a click shake — works on both PC (no gyroscope) and mobile (click mode)
    clickShake.triggerClick();
  };

  const handleMouseDown = () => {
    clickShake.startClickHold();
  };

  const handleMouseUp = () => {
    clickShake.stopClickHold();
  };

  const circleScale = 1 + (intensity / 100) * 0.1;
  const circleColor = getIntensityColor(intensity);

  return (
    <div className="relative w-full min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4">
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
          {/* Top-right controls: fullscreen + sound */}
          <div className="fixed top-[4.5rem] right-4 z-30 flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="bg-[rgba(255,255,255,0.08)] rounded-full p-2 text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-[rgba(255,255,255,0.15)] transition-all duration-200 cursor-pointer"
              aria-label={isFullscreen ? "退出全屏" : "进入全屏"}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
            <button
              onClick={toggleSound}
              className="bg-[rgba(255,255,255,0.08)] rounded-full p-2 text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-[rgba(255,255,255,0.15)] transition-all duration-200 cursor-pointer"
              aria-label={muted ? "开启音效" : "关闭音效"}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Progress ring around circle */}
          <div className="relative z-10 mb-10 w-[200px] h-[200px] mx-auto">
            {/* SVG progress ring */}
            <svg className="absolute inset-0 -rotate-90 pointer-events-none" viewBox="0 0 200 200">
              <circle
                cx="100" cy="100" r="92"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="3"
              />
              <circle
                cx="100" cy="100" r="92"
                fill="none"
                stroke="url(#progGrad)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${progress * 578} 578`}
                className="transition-all duration-300"
              />
              <defs>
                <linearGradient id="progGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="50%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#f472b6" />
                </linearGradient>
              </defs>
            </svg>

            {/* Pulse rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[160px] h-[160px] rounded-full border-2 border-[rgba(79,70,229,0.3)] animate-pulse-ring" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="w-[160px] h-[160px] rounded-full border-2 border-[rgba(79,70,229,0.3)] animate-pulse-ring"
                style={{ animationDelay: "0.6s" }}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="w-[160px] h-[160px] rounded-full border-2 border-[rgba(79,70,229,0.3)] animate-pulse-ring"
                style={{ animationDelay: "1.2s" }}
              />
            </div>

            {/* Main circle button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                key={pulseKey}
                onClick={handleCircleClick}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={(e) => { e.preventDefault(); handleMouseDown(); }}
                onTouchEnd={handleMouseUp}
                className="relative w-[160px] h-[160px] rounded-full flex flex-col items-center justify-center text-white transition-all duration-150 select-none outline-none cursor-pointer animate-shake-pulse"
                style={{
                  background: intensity > 0
                    ? `linear-gradient(135deg, ${circleColor}, #7c3aed)`
                    : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                  transform: `scale(${circleScale})`,
                  boxShadow: intensity > 0
                    ? `0 0 60px ${circleColor}80, 0 0 120px ${circleColor}40`
                    : "0 0 40px rgba(79,70,229,0.3)",
                }}
              >
                {intensity > 0 ? (
                  <>
                    <span className="text-3xl font-bold">{intensity}%</span>
                    <span className="text-sm mt-1"><TangleIcon level={tangleInfo.level} className="w-4 h-4" /></span>
                  </>
                ) : count > 0 ? (
                  <>
                    <span className="text-3xl font-bold">{count}</span>
                    <span className="text-xs mt-1 text-white/70">再摇 {remaining} 次</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-8 h-8 mb-1" />
                    <span className="text-xs font-medium">
                      {isClickMode || permissionState === "unsupported"
                        ? "点击开始"
                        : "摇一摇手机"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Hint text */}
          <p className="relative z-10 text-[rgba(255,255,255,0.6)] text-sm text-center mb-6 max-w-xs">
            {count === 0
              ? isClickMode || permissionState === "unsupported"
                ? "点击中间的圆形按钮，连点 5 次"
                : "用力摇晃手机，目标 5 次"
              : count >= TARGET_SHAKES
                ? "摇晃完成！正在生成报告..."
                : isClickMode || permissionState === "unsupported"
                  ? `已点 ${count} 次，还差 ${remaining} 次`
                  : `已摇 ${count} 次，还差 ${remaining} 次`}
          </p>

          {/* Intensity bar */}
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

          {/* Stop button */}
          {count > 0 && count < TARGET_SHAKES && (
            <div className="relative z-10 flex flex-col items-center gap-3">
              <button
                onClick={() => setShakingPhase("finished")}
                className="px-5 py-2 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] text-sm text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,255,255,0.12)] hover:text-white transition-all duration-300 cursor-pointer"
              >
                提前结束
              </button>
              <button
                onClick={() => router.push("/")}
                className="text-xs text-[rgba(255,255,255,0.3)] hover:text-[rgba(255,255,255,0.6)] transition-colors cursor-pointer"
              >
                放弃，返回首页
              </button>
            </div>
          )}

          {/* Debug info - only in development */}
          {process.env.NODE_ENV === "development" && (
            <div className="relative z-10 mt-6 px-4 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] max-w-[90vw] sm:max-w-[400px]">
              <p className="text-[10px] text-[rgba(255,255,255,0.35)] font-mono break-all">
                调试：{shakeDebugInfo}
              </p>
            </div>
          )}
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
              disabled
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-semibold transition-all duration-300 cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>正在分析...</span>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Analyzing Phase
function AnalyzingPhase({ onCancel }: { onCancel: () => void }) {
  const [messageIndex, setMessageIndex] = useState(() => Math.floor(Math.random() * loadingMessages.length));
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % loadingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4">
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
        {elapsed >= 10 && (
          <p className="text-[#fbbf24] text-xs mt-3 animate-fade-in-up">
            AI 正在深度思考中...
          </p>
        )}
      </div>
      <button
        onClick={onCancel}
        className="relative z-10 mt-10 px-5 py-2 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] text-sm text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.12)] hover:text-white transition-all duration-300 cursor-pointer"
      >
        <span className="inline-flex items-center gap-1.5">
          <X className="w-3.5 h-3.5" />
          取消分析
        </span>
      </button>
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
  onResultUpdate,
}: {
  result: AnalysisResult;
  mock: boolean;
  shakeStats: { shakeCount: number; peakIntensity: number; tangleLevel: TangleLevel };
  dilemma: string;
  optionA: string;
  optionB: string;
  onReset: () => void;
  onResultUpdate?: (result: AnalysisResult, mock: boolean) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [alternativeLoading, setAlternativeLoading] = useState(false);
  const [decisionCount, setDecisionCount] = useState<number | null>(null);
  const { showToast } = useToast();
  const { triggerConfetti } = useConfetti();

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 800);
    return () => clearTimeout(t);
  }, []);

  // Trigger confetti when result is revealed
  useEffect(() => {
    if (revealed) {
      triggerConfetti();
    }
  }, [revealed, triggerConfetti]);

  useEffect(() => {
    try {
      const count = getDecisions().length;
      setDecisionCount(count);
    } catch {
      // ignore
    }
  }, []);

  const handleShare = async () => {
    const shareText = `摇一摇决策器AI分析\n\n我在纠结：${dilemma}\n推荐：${result.recommendLabel}\n\n${result.insight}\n\n摇晃力度：${shakeStats.peakIntensity}% | 置信度：${result.confidence}%\n\n你也来试试：${window.location.origin}`;

    // Generate share image card via Canvas
    const generateShareImage = () => {
      return new Promise<Blob | null>((resolve) => {
        const canvas = document.createElement("canvas");
        canvas.width = 750;
        canvas.height = 500;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(null); return; }

        // Gradient background
        const grad = ctx.createLinearGradient(0, 0, 750, 500);
        grad.addColorStop(0, "#0a0a0f");
        grad.addColorStop(1, "#1a1040");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 750, 500);

        // Title
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "20px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("摇一摇决策器", 375, 60);

        // Recommendation result
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 48px sans-serif";
        ctx.fillText(result.recommendLabel, 375, 240);

        // Confidence and tangle
        const tangleLabel = getTangleInfo(shakeStats.peakIntensity).label;
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.font = "22px sans-serif";
        ctx.fillText(`置信度 ${result.confidence}%  ·  ${tangleLabel}`, 375, 340);

        // Footer signature
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = "16px sans-serif";
        ctx.fillText("AI 决策助手", 375, 460);

        canvas.toBlob((blob) => resolve(blob), "image/png");
      });
    };

    if (navigator.share) {
      try {
        await navigator.share({
          title: "摇一摇决策器 — AI帮我做了个决定",
          text: shareText,
          url: window.location.href,
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

        // Generate and download image card
        const blob = await generateShareImage();
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "摇一摇决策_结果.png";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast("分享图片已下载", "success");
        }
      } catch {
        showToast("复制失败，请手动复制", "error");
      }
    }
  };

  const handleAlternative = async () => {
    if (alternativeLoading) return;
    setAlternativeLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

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
          perspective: "alternative",
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `请求失败: ${response.status}`);
      }
      const data = await response.json();
      onResultUpdate?.(data.result as AnalysisResult, !!data.mock);
      setRevealed(false);
      setTimeout(() => setRevealed(true), 800);
      showToast("已换个角度为你分析", "success");
    } catch (err: unknown) {
      const message = err instanceof Error
        ? (err.name === "AbortError" ? "换个角度分析超时，请稍后重试" : err.message)
        : "分析失败";
      showToast(message, "error");
    } finally {
      setAlternativeLoading(false);
    }
  };

  const recColor = result.recommendation === "A" ? "#38bdf8" : "#f472b6";
  const confColor = getConfidenceColor(result.confidence);

  return (
    <div className="safe-bottom relative w-full min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 py-20">

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

          {decisionCount !== null && (
            <div className="px-6 sm:px-8 pb-2">
              <p className="text-xs text-[rgba(255,255,255,0.4)] text-right">
                {decisionCount === 0
                  ? "这是你的第一次决策！"
                  : `这是你的第 ${decisionCount} 次决策`}
              </p>
            </div>
          )}

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

            {/* A vs B Comparison Card */}
            <div className="grid grid-cols-2 gap-3 mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              {/* Option A */}
              <div
                className="bg-[rgba(255,255,255,0.05)] rounded-xl p-4 border transition-all duration-300"
                style={{
                  borderColor: result.recommendation === "A" ? "#4f46e5" : "rgba(255,255,255,0.1)",
                  boxShadow: result.recommendation === "A" ? "0 0 20px rgba(79,70,229,0.15)" : "none",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                  <span className="text-xs font-semibold text-white">选项 A</span>
                  {result.recommendation === "A" && (
                    <span className="ml-auto inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[rgba(79,70,229,0.2)] text-[10px] text-[#818cf8] font-medium">
                      推荐
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-white mb-2">{optionA}</p>
                <p className="text-xs text-[rgba(255,255,255,0.45)] leading-relaxed">
                  {result.recommendation === "A"
                    ? result.rootCauses[0] || "综合评估更优"
                    : result.rootCauses[1] || "另一种选择"}
                </p>
                {result.recommendation === "A" && (
                  <div className="mt-3 flex items-center gap-1.5">
                    <div className="relative w-8 h-8">
                      <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
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
                          style={{ strokeDasharray: revealed ? `${result.confidence}, 100` : `0, 100` }}
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-white">
                        {result.confidence}%
                      </span>
                    </div>
                    <span className="text-[10px] text-[rgba(255,255,255,0.4)]">置信度</span>
                  </div>
                )}
              </div>

              {/* Option B */}
              <div
                className="bg-[rgba(255,255,255,0.05)] rounded-xl p-4 border transition-all duration-300"
                style={{
                  borderColor: result.recommendation === "B" ? "#4f46e5" : "rgba(255,255,255,0.1)",
                  boxShadow: result.recommendation === "B" ? "0 0 20px rgba(79,70,229,0.15)" : "none",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#f472b6]" />
                  <span className="text-xs font-semibold text-white">选项 B</span>
                  {result.recommendation === "B" && (
                    <span className="ml-auto inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[rgba(79,70,229,0.2)] text-[10px] text-[#818cf8] font-medium">
                      推荐
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-white mb-2">{optionB}</p>
                <p className="text-xs text-[rgba(255,255,255,0.45)] leading-relaxed">
                  {result.recommendation === "B"
                    ? result.rootCauses[0] || "综合评估更优"
                    : result.rootCauses[1] || "另一种选择"}
                </p>
                {result.recommendation === "B" && (
                  <div className="mt-3 flex items-center gap-1.5">
                    <div className="relative w-8 h-8">
                      <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
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
                          style={{ strokeDasharray: revealed ? `${result.confidence}, 100` : `0, 100` }}
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-white">
                        {result.confidence}%
                      </span>
                    </div>
                    <span className="text-[10px] text-[rgba(255,255,255,0.4)]">置信度</span>
                  </div>
                )}
              </div>
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
            <div className="pb-8">
              {/* Primary CTA: 再来一次 */}
              <button
                onClick={onReset}
                className="w-full py-3 px-6 rounded-xl font-medium shadow-lg bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 mb-3"
              >
                <RotateCcw className="w-4 h-4" />
                <span>再来一次</span>
              </button>
              {/* Secondary: 换个角度分析 */}
              <button
                onClick={handleAlternative}
                disabled={alternativeLoading}
                className={`w-full py-3 px-6 rounded-xl font-medium bg-transparent border border-[rgba(255,255,255,0.12)] transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 mb-3 ${
                  alternativeLoading
                    ? "text-[rgba(255,255,255,0.5)] cursor-not-allowed"
                    : "text-[rgba(255,255,255,0.7)] hover:text-white hover:border-[rgba(255,255,255,0.25)] hover:bg-[rgba(255,255,255,0.04)]"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>{alternativeLoading ? "分析中..." : "换个角度分析"}</span>
              </button>
              <div className="flex flex-col sm:flex-row gap-3">
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
                <Link
                  href="/history"
                  className="flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 border border-[rgba(255,255,255,0.15)] text-white hover:bg-[rgba(255,255,255,0.06)]"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>查看决策日记</span>
                </Link>
              </div>
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
  const abortControllerRef = useRef<AbortController | null>(null);

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

  const handleAnalyze = useCallback(async (stats?: { shakeCount: number; peakIntensity: number; tangleLevel: TangleLevel }) => {
    const effectiveStats = stats ?? shakeStats;
    if (!effectiveStats) return;
    setPhase("analyzing");
    setError(null);

    try {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s client timeout

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dilemma,
          optionA,
          optionB,
          shakeIntensity: effectiveStats.peakIntensity,
          shakeCount: effectiveStats.shakeCount,
          tangleLevel: effectiveStats.tangleLevel,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `请求失败: ${response.status}`);
      }

      const data = await response.json();
      setAnalysisResult(data.result);
      setIsMock(!!data.mock);
      // Auto-save after analysis
      try {
        saveDecision(
          {
            dilemma,
            optionA,
            optionB,
            shakeIntensity: effectiveStats.peakIntensity,
            shakeCount: effectiveStats.shakeCount,
            tangleLevel: effectiveStats.tangleLevel,
          },
          data.result
        );
      } catch {
        // silent fail for auto-save
      }
      setPhase("result");
    } catch (err: unknown) {
      const message = err instanceof Error
        ? (err.name === "AbortError" ? "AI 分析超时，已使用本地分析" : err.message)
        : "分析失败";
      // Fallback to mock result on failure
      if (err instanceof Error && err.name === "AbortError") {
        const { generateMockResult } = await import("@/app/api/analyze/route");
        const mockResult = generateMockResult({
          dilemma,
          optionA,
          optionB,
          shakeIntensity: effectiveStats.peakIntensity,
          shakeCount: effectiveStats.shakeCount,
          tangleLevel: effectiveStats.tangleLevel,
        });
        setAnalysisResult(mockResult);
        setIsMock(true);
        try {
          saveDecision(
            { dilemma, optionA, optionB, shakeIntensity: effectiveStats.peakIntensity, shakeCount: effectiveStats.shakeCount, tangleLevel: effectiveStats.tangleLevel },
            mockResult
          );
        } catch { /* silent */ }
        setError(message);
        setPhase("result");
      } else {
        setError(message);
        setPhase("result");
      }
    }
  }, [dilemma, optionA, optionB, shakeStats]);

  const handleResultUpdate = useCallback(
    (newResult: AnalysisResult, mock: boolean) => {
      setAnalysisResult(newResult);
      setIsMock(mock);
    },
    []
  );

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

  const handleCancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setPhase("input");
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className={`relative pt-14 ${phase === "shaking" || phase === "analyzing" ? "overflow-hidden" : "overflow-y-auto"}`} style={phase === "shaking" || phase === "analyzing" ? { height: "100vh" } : { minHeight: "100vh" }}>
      <HttpsBanner />

      {/* Fixed back button in top-left (hidden during shaking phase) */}
      {phase !== "shaking" && (
        <Link
          href="/"
          className="fixed top-[4.5rem] left-4 z-30 text-sm text-[rgba(255,255,255,0.5)] hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回</span>
        </Link>
      )}

      {/* Error toast */}
      {error && phase === "result" && (
        <div className="fixed top-14 left-0 right-0 z-40 bg-[rgba(244,114,182,0.15)] backdrop-blur-md px-4 py-3 text-center">
          <p className="text-sm text-[#f472b6]">{error}</p>
        </div>
      )}

      {phase === "input" && (
        <div key="input" className="phase-enter">
          <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
            <DecisionInputForm onSubmit={handleSubmit} initialValues={{ dilemma, optionA, optionB }} />
          </div>
        </div>
      )}

      {phase === "shaking" && (
        <div key="shaking" className="phase-enter">
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
        <div key="analyzing" className="phase-enter">
          <AnalyzingPhase onCancel={handleCancelAnalysis} />
        </div>
      )}

      {phase === "result" && (
        <div key="result" className="phase-enter">
          {analysisResult && shakeStats ? (
            <ResultPhase
              result={analysisResult}
              mock={isMock}
              shakeStats={shakeStats}
              dilemma={dilemma}
              optionA={optionA}
              optionB={optionB}
              onReset={handleReset}
              onResultUpdate={handleResultUpdate}
            />
          ) : error ? (
            <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white mb-2">分析出错了</h1>
                <p className="text-[rgba(255,255,255,0.6)] mb-6">{error}</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => handleAnalyze()}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-medium hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>重试分析</span>
                  </button>
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.08)] text-white font-medium hover:bg-[rgba(255,255,255,0.12)] transition-all duration-300 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>重新开始</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
