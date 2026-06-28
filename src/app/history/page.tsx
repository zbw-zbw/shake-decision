"use client";

import { useState, useEffect, useCallback, useMemo, type ComponentType } from "react";
import Link from "next/link";
import {
  getDecisions,
  getStats,
  updateSatisfaction,
  deleteDecision,
  clearAllDecisions,
  getUnratedCount,
} from "@/lib/storage";
import { DecisionRecord, DecisionStats } from "@/types/decision";
import { useToast } from "@/components/Toast";
import { Inbox, BarChart3, Activity, Target, Smile, Lightbulb, Smartphone, ArrowRight, ChevronDown, Check, Clock, Zap, Flame, Heart, Star, TrendingUp, Search, X, type LucideIcon } from "lucide-react";

// Helpers
const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function formatDate(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const wd = WEEKDAYS[d.getDay()];
  return `${y}年${m}月${day}日 · ${wd}`;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function getDateKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

function getTangleDotColor(level: string): string {
  if (level === "light") return "#34d399";
  if (level === "medium") return "#fbbf24";
  if (level === "heavy") return "#fb923c";
  return "#f472b6";
}

function getTangleLabel(level: string): string {
  if (level === "light") return "轻度";
  if (level === "medium") return "中度";
  if (level === "heavy") return "重度";
  if (level === "extreme") return "极度";
  return "-";
}

function getIntensityColor(intensity: number): string {
  if (intensity <= 30) return "#34d399";
  if (intensity <= 60) return "#fbbf24";
  if (intensity <= 85) return "#fb923c";
  return "#f472b6";
}

const SATISFACTION_LABELS = ["1分", "2分", "3分", "4分", "5分"];

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

// Stats Panel
type StatItem = {
  Icon: LucideIcon | null;
  label: string;
  value: string;
  color: string;
  dot?: boolean;
};

function StatsPanel({ stats }: { stats: DecisionStats }) {
  if (stats.totalDecisions === 0) return null;

  const satisfactionRate =
    stats.totalRated > 0
      ? Math.round((stats.satisfiedCount / stats.totalRated) * 100)
      : 0;

  const tangleLevel = stats.mostCommonTangleLevel;
  const tangleColor = getTangleDotColor(tangleLevel);

  const items: StatItem[] = [
    {
      Icon: BarChart3,
      label: "总决策",
      value: `${stats.totalDecisions} 次`,
      color: "#fbbf24",
    },
    {
      Icon: Activity,
      label: "平均力度",
      value: `${stats.avgShakeIntensity}%`,
      color: getIntensityColor(stats.avgShakeIntensity),
    },
    {
      Icon: Target,
      label: "平均置信度",
      value: `${stats.avgConfidence}%`,
      color: "#818cf8",
    },
    {
      Icon: Smile,
      label: "满意率",
      value: stats.totalRated > 0 ? `${satisfactionRate}%` : "-",
      color: "#34d399",
    },
    {
      Icon: Flame,
      label: "连续天数",
      value: `${stats.streakDays} 天`,
      color: "#fb923c",
    },
    {
      Icon: null,
      label: "常见纠结",
      value: getTangleLabel(tangleLevel),
      color: tangleColor,
      dot: true,
    },
  ];

  return (
    <div className="w-full max-w-[640px] mx-auto mb-8 animate-fade-in-up">
      <div className="bg-[rgba(255,255,255,0.06)] backdrop-blur-sm border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.label} className="text-center">
              <div className="flex justify-center mb-1">
                {item.dot ? (
                  <span
                    className="inline-block w-5 h-5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                ) : (
                  item.Icon && <item.Icon className="w-6 h-6" style={{ color: item.color }} />
                )}
              </div>
              <div className="text-xl sm:text-2xl font-bold" style={{ color: item.color }}>
                {item.value}
              </div>
              <div className="text-xs text-[rgba(255,255,255,0.5)] mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Empty State
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
      <Inbox className="w-16 h-16 text-[rgba(255,255,255,0.3)] mb-6" />
      <h2 className="text-xl font-bold text-white mb-2">还没有决策记录</h2>
      <p className="text-[rgba(255,255,255,0.5)] text-sm mb-8">
        去摇一摇，让AI帮你做个决定吧！
      </p>
      <Link
        href="/decide"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-medium hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer"
      >
        <span>开始决策</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

// Delete Confirm Panel
function DeleteConfirmPanel({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm cursor-pointer"
        onClick={onCancel}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-sm sm:rounded-2xl animate-slide-up">
        <div className="bg-[#1a1530] sm:border border-[rgba(255,255,255,0.1)] rounded-t-2xl sm:rounded-2xl p-6">
          <h3 className="text-white font-semibold text-base mb-2">确定删除这条决策记录吗？</h3>
          <p className="text-[rgba(255,255,255,0.5)] text-sm mb-6">删除后无法恢复</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.15)] text-white text-sm font-medium hover:bg-[rgba(255,255,255,0.06)] transition-all cursor-pointer"
            >
              取消
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl bg-[rgba(244,114,182,0.2)] border border-[rgba(244,114,182,0.3)] text-[#f472b6] text-sm font-medium hover:bg-[rgba(244,114,182,0.3)] transition-all cursor-pointer"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Decision Card
function DecisionCard({ record, onDelete }: { record: DecisionRecord; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [removing, setRemoving] = useState(false);
  const { showToast } = useToast();

  const { input, result, id, timestamp, satisfaction } = record;
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const canRate = now - timestamp > dayMs;

  const recColor = result.recommendation === "A" ? "#38bdf8" : "#f472b6";

  const handleRate = (score: number) => {
    updateSatisfaction(id, score);
    showToast("感谢你的反馈！", "success", 2000);
  };

  const handleDelete = () => {
    setRemoving(true);
    setTimeout(() => {
      deleteDecision(id);
      setDeleteConfirm(false);
      onDelete();
    }, 300);
  };

  return (
    <>
      <div
        className={`bg-[rgba(255,255,255,0.06)] backdrop-blur-sm border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden transition-all duration-300 ${
          removing ? "opacity-0 translate-x-full" : ""
        }`}
      >
        <div className="p-4 sm:p-5">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <span style={{ color: "#38bdf8" }}>{input.optionA}</span>
              <span className="text-[rgba(255,255,255,0.3)] text-xs">vs</span>
              <span style={{ color: "#f472b6" }}>{input.optionB}</span>
            </div>
            <span className="text-xs text-[rgba(255,255,255,0.4)]">{formatTime(timestamp)}</span>
          </div>

          {/* Dilemma */}
          <p className="text-[rgba(255,255,255,0.7)] text-sm mb-3 leading-relaxed">
            「{input.dilemma}」
          </p>

          {/* Result summary */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mb-3">
            <span className="font-medium" style={{ color: recColor }}>
              推荐：{result.recommendLabel}
            </span>
            <span className="text-[rgba(255,255,255,0.3)]">·</span>
            <span className="text-[rgba(255,255,255,0.6)]">置信度 {result.confidence}%</span>
            <span className="text-[rgba(255,255,255,0.3)]">·</span>
            <span className="text-[rgba(255,255,255,0.6)] flex items-center gap-1">
              力度 {input.shakeIntensity}%
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: getTangleDotColor(input.tangleLevel) }}
              />
            </span>
          </div>

          {/* Insight */}
          <div className="flex items-start gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-[rgba(255,255,255,0.5)] shrink-0 mt-0.5" />
            <p className="text-[rgba(255,255,255,0.6)] text-sm italic leading-relaxed">
              {result.insight}
            </p>
          </div>

          {/* Satisfaction rating */}
          {canRate ? (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-[rgba(255,255,255,0.5)]">这个决定让你满意吗？</span>
              </div>
              <div className="flex items-center gap-1">
                {SATISFACTION_LABELS.map((label, i) => {
                  const score = i + 1;
                  const isSelected = satisfaction === score;
                  return (
                    <button
                      key={i}
                      onClick={() => handleRate(score)}
                      className={`text-xs font-medium transition-all duration-200 px-2 py-1 rounded-lg cursor-pointer ${
                        isSelected
                          ? "bg-[rgba(255,255,255,0.1)] scale-110 text-white"
                          : "hover:bg-[rgba(255,255,255,0.05)] hover:scale-105 text-[rgba(255,255,255,0.5)]"
                      }`}
                      title={`${score}分`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mb-3">
              <p className="text-xs text-[rgba(255,255,255,0.35)]">
                24小时后可以回来评价这个决定
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-[rgba(255,255,255,0.5)] hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{expanded ? "收起详情" : "查看详情"}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
            </button>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="text-xs text-[rgba(255,255,255,0.35)] hover:text-[#f472b6] transition-colors cursor-pointer"
            >
              删除
            </button>
          </div>
        </div>

        {/* Expanded details */}
        <div
          className={`transition-all duration-300 overflow-hidden ${
            expanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-4 sm:px-5 pb-5 pt-1">
            {/* Root causes */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-[rgba(255,255,255,0.5)] uppercase tracking-wider mb-2">
                纠结根因分析
              </h4>
              <ul className="space-y-2">
                {result.rootCauses.map((cause, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-[rgba(255,255,255,0.65)] leading-relaxed"
                  >
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#4f46e5] to-[#fbbf24] shrink-0" />
                    <span>{cause}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Suggestions */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-[rgba(255,255,255,0.5)] uppercase tracking-wider mb-2">
                决策建议
              </h4>
              <div className="space-y-2">
                {result.suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 bg-[rgba(255,255,255,0.03)] rounded-lg px-3 py-2"
                  >
                    <span className="text-base shrink-0"><SuggestionIcon name={s.icon} className="w-4 h-4 text-[rgba(255,255,255,0.7)]" /></span>
                    <p className="text-sm text-[rgba(255,255,255,0.65)] leading-relaxed">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tangle analysis */}
            <div>
              <h4 className="text-xs font-semibold text-[rgba(255,255,255,0.5)] uppercase tracking-wider mb-2">
                摇晃解读
              </h4>
              <p className="text-sm text-[rgba(255,255,255,0.65)] leading-relaxed flex items-start gap-1">
                <Smartphone className="w-4 h-4 text-[rgba(255,255,255,0.5)] shrink-0 mt-0.5" />
                <span>{result.tangleAnalysis}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      {deleteConfirm && (
        <DeleteConfirmPanel
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(false)}
        />
      )}
    </>
  );
}

// Main Page
export default function HistoryPage() {
  const [records, setRecords] = useState<DecisionRecord[]>([]);
  const [stats, setStats] = useState<DecisionStats | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const refresh = useCallback(() => {
    const data = getDecisions();
    setRecords(data);
    setStats(getStats());
  }, []);

  useEffect(() => {
    refresh();
    // Listen for storage changes from other tabs
    const handler = () => refresh();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [refresh]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, DecisionRecord[]>();
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? records.filter(
          (r) =>
            r.input.dilemma.toLowerCase().includes(q) ||
            r.input.optionA.toLowerCase().includes(q) ||
            r.input.optionB.toLowerCase().includes(q)
        )
      : records;
    filtered.forEach((r) => {
      const key = getDateKey(r.timestamp);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    // Sort keys descending
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [records, searchQuery]);

  const handleClearAll = () => {
    clearAllDecisions();
    setClearConfirm(false);
    refresh();
  };

  return (
    <div className="relative min-h-screen pt-20 pb-10 px-4">
      {/* Page header */}
      <div className="max-w-[640px] mx-auto mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">决策日记</h1>
        <p className="text-sm text-[rgba(255,255,255,0.5)]">
          回看你的每次纠结，发现决策模式
        </p>
      </div>

      {/* Stats */}
      {stats && <StatsPanel stats={stats} />}

      {/* Search box */}
      {records.length > 0 && (
        <div className="max-w-[640px] mx-auto mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(255,255,255,0.4)] pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索决策..."
              className="w-full bg-[rgba(255,255,255,0.06)] backdrop-blur-sm border border-[rgba(255,255,255,0.08)] rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-[rgba(255,255,255,0.4)] focus:outline-none focus:border-[rgba(255,255,255,0.2)] transition-colors cursor-text"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-[rgba(255,255,255,0.4)] hover:text-white hover:bg-[rgba(255,255,255,0.12)] transition-colors cursor-pointer"
                aria-label="清空搜索"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Clear all button */}
      {records.length > 0 && (
        <div className="max-w-[640px] mx-auto mb-6 flex justify-end">
          <button
            onClick={() => setClearConfirm(true)}
            className="text-xs text-[rgba(255,255,255,0.35)] hover:text-[#f472b6] transition-colors cursor-pointer"
          >
            清空所有记录
          </button>
        </div>
      )}

      {/* Content */}
      {records.length === 0 ? (
        <EmptyState />
      ) : searchQuery.trim() && grouped.length === 0 ? (
        <div className="max-w-[640px] mx-auto py-16 text-center animate-fade-in-up">
          <Search className="w-10 h-10 text-[rgba(255,255,255,0.2)] mx-auto mb-3" />
          <p className="text-[rgba(255,255,255,0.5)] text-sm">没有找到匹配的决策</p>
        </div>
      ) : (
        <div className="max-w-[640px] mx-auto space-y-6">
          {grouped.map(([dateKey, items]) => (
            <div key={dateKey}>
              {/* Date header */}
              <div className="text-xs font-medium text-[rgba(255,255,255,0.4)] mb-3 px-1">
                {formatDate(new Date(dateKey).getTime())}
              </div>
              {/* Cards */}
              <div className="space-y-3">
                {items.map((record) => (
                  <DecisionCard key={record.id} record={record} onDelete={refresh} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Clear all confirm */}
      {clearConfirm && (
        <DeleteConfirmPanel
          onConfirm={handleClearAll}
          onCancel={() => setClearConfirm(false)}
        />
      )}

      {/* Footer */}
      <div className="max-w-[640px] mx-auto mt-12 pt-6 text-center safe-bottom">
        <p className="text-xs text-[rgba(255,255,255,0.25)] mb-0.5">
          摇一摇决策器 · AI 决策助手
        </p>
        <p className="text-xs text-[rgba(255,255,255,0.15)]">
          用 AI 和手机陀螺仪，终结选择困难
        </p>
      </div>
    </div>
  );
}
