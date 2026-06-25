import { DecisionRecord, DecisionInput, AnalysisResult, DecisionStats } from "@/types/decision";

const STORAGE_KEY = "shake-decision-history";
const MAX_RECORDS = 50;
const STORAGE_QUOTA_WARNING = 5 * 1024 * 1024; // 5MB

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function readStorage(): DecisionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeStorage(records: DecisionRecord[]): void {
  try {
    const json = JSON.stringify(records);
    // Check storage quota
    const size = new Blob([json]).size;
    if (size > STORAGE_QUOTA_WARNING) {
      console.warn("localStorage approaching quota limit");
    }
    localStorage.setItem(STORAGE_KEY, json);
  } catch (e) {
    console.error("Failed to write localStorage:", e);
  }
}

function validateRecord(record: DecisionRecord): boolean {
  return (
    typeof record.id === "string" &&
    typeof record.timestamp === "number" &&
    typeof record.input === "object" &&
    typeof record.result === "object" &&
    typeof record.input.dilemma === "string" &&
    typeof record.input.optionA === "string" &&
    typeof record.input.optionB === "string"
  );
}

export function saveDecision(input: DecisionInput, result: AnalysisResult): DecisionRecord {
  const records = readStorage();
  const record: DecisionRecord = {
    id: generateId(),
    timestamp: Date.now(),
    input,
    result,
  };
  records.unshift(record);
  writeStorage(records.slice(0, MAX_RECORDS));
  return record;
}

export function getDecisions(): DecisionRecord[] {
  return readStorage().filter(validateRecord);
}

export function getDecision(id: string): DecisionRecord | null {
  const records = getDecisions();
  return records.find((r) => r.id === id) ?? null;
}

export function updateSatisfaction(id: string, satisfaction: number): void {
  const records = readStorage();
  const idx = records.findIndex((r) => r.id === id);
  if (idx !== -1) {
    records[idx].satisfaction = satisfaction;
    writeStorage(records);
  }
}

export function deleteDecision(id: string): void {
  const records = readStorage().filter((r) => r.id !== id);
  writeStorage(records);
}

export function clearAllDecisions(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getStats(): DecisionStats {
  const records = getDecisions();

  if (records.length === 0) {
    return {
      totalDecisions: 0,
      avgShakeIntensity: 0,
      avgConfidence: 0,
      mostCommonTangleLevel: "-",
      satisfiedCount: 0,
      totalRated: 0,
      streakDays: 0,
    };
  }

  const totalIntensity = records.reduce((s, r) => s + r.input.shakeIntensity, 0);
  const totalConfidence = records.reduce((s, r) => s + r.result.confidence, 0);

  // Most common tangle level
  const levelCounts: Record<string, number> = {};
  records.forEach((r) => {
    const lvl = r.input.tangleLevel;
    levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;
  });
  const mostCommon = Object.entries(levelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

  // Satisfaction
  const rated = records.filter((r) => r.satisfaction != null && r.satisfaction > 0);
  const satisfied = rated.filter((r) => (r.satisfaction ?? 0) >= 4);

  // Streak days
  const streakDays = calcStreakDays(records);

  return {
    totalDecisions: records.length,
    avgShakeIntensity: Math.round(totalIntensity / records.length),
    avgConfidence: Math.round(totalConfidence / records.length),
    mostCommonTangleLevel: mostCommon,
    satisfiedCount: satisfied.length,
    totalRated: rated.length,
    streakDays,
  };
}

function calcStreakDays(records: DecisionRecord[]): number {
  if (records.length === 0) return 0;

  const daySet = new Set<string>();
  records.forEach((r) => {
    daySet.add(new Date(r.timestamp).toISOString().slice(0, 10));
  });

  const days = Array.from(daySet).sort().reverse();
  if (days.length === 0) return 0;

  const today = new Date().toISOString().slice(0, 10);
  if (days[0] !== today) return 0;

  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/** Count records older than 24h that have no satisfaction rating */
export function getUnratedCount(): number {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  return getDecisions().filter(
    (r) => now - r.timestamp > dayMs && (r.satisfaction == null || r.satisfaction === 0)
  ).length;
}
