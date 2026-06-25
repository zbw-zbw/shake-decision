"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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

// ─── Helpers ───
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

function getTangleEmoji(level: string): string {
  if (level === "light") return "💚";
  if (level === "medium") return "🟡";
  if (level === "heavy") return "🟠";
  return "🔴";
}

function getIntensityColor(intensity: number): string {
  if (intensity <= 30) return "#34d399";
  if (intensity <= 60) return "#fbbf24";
  if (intensity <= 85) return "#fb923c";
  return "#f472b6";
}

const SATISFACTION_EMOJIS = ["😢", "😕", "😐", "🙂", "😄"];

// ─── Stats Panel ───
function StatsPanel({ stats }: { stats: DecisionStats }) {
  if (stats.totalDecisions === 0) return null;

  const satisfactionRate =
    stats.totalRated > 0
      ? Math.round((stats.satisfiedCount / stats.totalRated) * 100)
      : 0;

  const items = [
    {
      icon: "📊",
      label: "总决策",
      value: `${stats.totalDecisions} 次`,
      color: "#fbbf24",
    },
    {
      icon: "💪",
      label: "平均力度",
      value: `${stats.avgShakeIntensity}%`,
      color: getIntensityColor(stats.avgShakeIntensity),
    },
    {
      icon: "🎯",
      label: "平均置信度",
      value: `${stats.avgConfidence}%`,
      color: "#818cf8",
    },
    {
      icon: "😊",
      label: "满意率",
      value: stats.totalRated > 0 ? `${satisfactionRate}%` : "-",
      color: "#34d399",
    },
  ];

  return (
    <div className="w-full max-w-[640px] mx-auto mb-8 animate-fade-in-up">
      <div className="bg-[rgba(255,255,255,0.06)] backdrop-blur-sm border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-2xl mb-1">{item.icon}</div>
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

// ─── Empty State ───
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
      <div className="text-6xl mb-6">📭</div>
      <h2 className="text-xl font-bold text-white mb-2">还没有决策记录</h2>
      <p className="text-[rgba(255,255,255,0.5)] text-sm mb-8">
        去摇一摇，让AI帮你做个决定吧！
      </p>
      <Link
        href="/decide"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-medium hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
      >
        <span>开始决策</span>
        <span>→</span>
      </Link>
    </div>
  );
}

// ─── Delete Confirm Panel ───
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
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-sm sm:rounded-2xl animate-slide-up">
        <div className="bg-[#1a1530] border-t sm:border border-[rgba(255,255,255,0.1)] rounded-t-2xl sm:rounded-2xl p-6">
          <h3 className="text-white font-semibold text-base mb-2">确定删除这条决策记录吗？</h3>
          <p className="text-[rgba(255,255,255,0.5)] text-sm mb-6">删除后无法恢复</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.15)] text-white text-sm font-medium hover:bg-[rgba(255,255,255,0.06)] transition-all"
            >
              取消
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl bg-[rgba(244,114,182,0.2)] border border-[rgba(244,114,182,0.3)] text-[#f472b6] text-sm font-medium hover:bg-[rgba(244,114,182,0.3)] transition-all"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Decision Card ───
function DecisionCard({ record }: { record: DecisionRecord }) {
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
            <span className="text-[rgba(255,255,255,0.6)]">
              力度 {input.shakeIntensity}% {getTangleEmoji(input.tangleLevel)}
            </span>
          </div>

          {/* Insight */}
          <div className="flex items-start gap-2 mb-3">
            <span className="text-sm shrink-0">💡</span>
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
                {SATISFACTION_EMOJIS.map((emoji, i) => {
                  const score = i + 1;
                  const isSelected = satisfaction === score;
                  return (
                    <button
                      key={i}
                      onClick={() => handleRate(score)}
                      className={`text-xl sm:text-lg transition-all duration-200 p-1 rounded-lg ${
                        isSelected
                          ? "bg-[rgba(255,255,255,0.1)] scale-110"
                          : "hover:bg-[rgba(255,255,255,0.05)] hover:scale-105"
                      }`}
                      title={`${score}分`}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mb-3">
              <p className="text-xs text-[rgba(255,255,255,0.35)]">
                ⏳ 24小时后可以回来评价这个决定
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-[rgba(255,255,255,0.06)]">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-[rgba(255,255,255,0.5)] hover:text-white transition-colors flex items-center gap-1"
            >
              <span>{expanded ? "收起详情" : "查看详情"}</span>
              <span className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>▾</span>
            </button>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="text-xs text-[rgba(255,255,255,0.35)] hover:text-[#f472b6] transition-colors"
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
          <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-[rgba(255,255,255,0.06)]">
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
                    <span className="text-base shrink-0">{s.icon}</span>
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
              <p className="text-sm text-[rgba(255,255,255,0.65)] leading-relaxed">
                📱 {result.tangleAnalysis}
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

// ─── Main Page ───
export default function HistoryPage() {
  const [records, setRecords] = useState<DecisionRecord[]>([]);
  const [stats, setStats] = useState<DecisionStats | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);

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
    records.forEach((r) => {
      const key = getDateKey(r.timestamp);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    // Sort keys descending
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [records]);

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

      {/* Clear all button */}
      {records.length > 0 && (
        <div className="max-w-[640px] mx-auto mb-6 flex justify-end">
          <button
            onClick={() => setClearConfirm(true)}
            className="text-xs text-[rgba(255,255,255,0.35)] hover:text-[#f472b6] transition-colors"
          >
            清空所有记录
          </button>
        </div>
      )}

      {/* Content */}
      {records.length === 0 ? (
        <EmptyState />
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
                  <DecisionCard key={record.id} record={record} />
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
      <div className="max-w-[640px] mx-auto mt-12 pt-6 border-t border-[rgba(255,255,255,0.06)] text-center safe-bottom">
        <p className="text-xs text-[rgba(255,255,255,0.25)] mb-0.5">
          摇一摇决策器 · TRAE AI 创造力大赛 · 硬件交互赛道
        </p>
        <p className="text-xs text-[rgba(255,255,255,0.2)]">
          全程使用 TRAE IDE + TRAE Work 开发
        </p>
      </div>
    </div>
  );
}
