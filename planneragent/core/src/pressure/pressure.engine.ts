// core/src/pressure/pressure.engine.ts
// ======================================================
// PlannerAgent — Decision Pressure Engine
// Canonical Source of Truth
//
// Determines when PlannerAgent should intervene.
// This module transforms operational signals into
// governance pressure states.
// ======================================================

export type PressureLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type PressureSignal = {
  type:
    | "REALITY_DRIFT"
    | "PLAN_INCOHERENCE"
    | "RESOURCE_CONFLICT"
    | "CAPACITY_OVERLOAD"
    | "SUPPLY_RISK";

  severity: number; // 0 → 1
  description: string;
};

export type PressureEvaluationInput = {
  signals: PressureSignal[];
};

export type PressureEvaluationResult = {
  level: PressureLevel;
  score: number;
  signals: PressureSignal[];
  should_intervene: boolean;
};

// ------------------------------------------------------
// Pressure scoring
// ------------------------------------------------------

function computePressureScore(signals: PressureSignal[]): number {

  if (signals.length === 0) {
    return 0;
  }

  let total = 0;

  for (const s of signals) {
    total += s.severity;
  }

  return Math.min(1, total / signals.length);
}

// ------------------------------------------------------
// Level classification
// ------------------------------------------------------

function classifyPressure(score: number): PressureLevel {

  if (score < 0.25) return "LOW";
  if (score < 0.5) return "MEDIUM";
  if (score < 0.75) return "HIGH";

  return "CRITICAL";
}

// ------------------------------------------------------
// Intervention rule
// ------------------------------------------------------

function shouldIntervene(level: PressureLevel): boolean {

  return level === "HIGH" || level === "CRITICAL";

}

// ------------------------------------------------------
// Main evaluation
// ------------------------------------------------------

export function evaluateDecisionPressure(
  input: PressureEvaluationInput
): PressureEvaluationResult {

  const score = computePressureScore(input.signals);

  const level = classifyPressure(score);

  const intervene = shouldIntervene(level);

  return {
    level,
    score,
    signals: input.signals,
    should_intervene: intervene,
  };

}
