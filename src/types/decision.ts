export interface DecisionInput {
  dilemma: string;
  optionA: string;
  optionB: string;
  shakeIntensity: number;
  shakeCount: number;
  tangleLevel: "light" | "medium" | "heavy" | "extreme";
}

export interface AnalysisResult {
  recommendation: "A" | "B";
  recommendLabel: string;
  confidence: number;
  rootCauses: string[];
  suggestions: Array<{ icon: string; text: string }>;
  insight: string;
  tangleAnalysis: string;
}

export interface DecisionRecord {
  id: string;
  timestamp: number;
  input: DecisionInput;
  result: AnalysisResult;
  satisfaction?: number;
}

export interface DecisionStats {
  totalDecisions: number;
  avgShakeIntensity: number;
  avgConfidence: number;
  mostCommonTangleLevel: string;
  satisfiedCount: number;
  totalRated: number;
  streakDays: number;
}
