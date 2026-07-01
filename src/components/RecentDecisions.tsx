"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getDecisions } from "@/lib/storage";
import type { DecisionRecord } from "@/types/decision";

function formatTime(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const min = 60 * 1000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < min) return "刚刚";
  if (diff < hour) return `${Math.floor(diff / min)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`;
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function RecentDecisions() {
  const [records, setRecords] = useState<DecisionRecord[]>([]);

  useEffect(() => {
    try {
      setRecords(getDecisions().slice(0, 3));
    } catch {
      // ignore
    }
  }, []);

  if (records.length === 0) return null;

  return (
    <section className="w-full px-4 sm:px-6 pb-12 sm:pb-16">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">最近决策</h2>
          <Link
            href="/history"
            className="text-sm text-[#818cf8] hover:text-[#a5b4fc] transition-colors cursor-pointer"
          >
            查看全部 →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {records.map((r) => (
            <Link
              key={r.id}
              href="/history"
              className="bg-[rgba(255,255,255,0.04)] rounded-xl border border-[rgba(255,255,255,0.06)] p-3 hover:bg-[rgba(255,255,255,0.08)] transition-all cursor-pointer"
            >
              <p className="text-sm text-white font-medium line-clamp-2 mb-2 break-words">
                {r.input.dilemma}
              </p>
              <p className="text-xs text-[#818cf8] mb-2">
                推荐：{r.result.recommendLabel}
              </p>
              <p className="text-xs text-[rgba(255,255,255,0.4)]">
                {formatTime(r.timestamp)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
