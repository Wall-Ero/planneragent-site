// core/src/topology/plan.quality.ts
// ======================================================
// PlannerAgent — Plan Quality Engine v1
// Canonical Source of Truth
// Evaluates how GOOD a plan is (not if it exists)
// ======================================================

export type PlanQualityLevel =
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "UNUSABLE";

export function computePlanQuality(params: {
  selectedBest: any;
  topologyConfidence: number;
  dlRisk?: number;
  planCoherence: any;
  decisionPressure?: "LOW" | "MEDIUM" | "HIGH";
}) {
  // ----------------------------------------------------
  // NO PLAN → UNUSABLE
  // ----------------------------------------------------

  if (!params.planCoherence?.coherent || !params.selectedBest) {
    return {
      level: "UNUSABLE" as PlanQualityLevel,
      score: 0,
      reasons: ["NO_VALID_PLAN"],
    };
  }

  // ----------------------------------------------------
  // INPUT EXTRACTION
  // ----------------------------------------------------

  const kpis = params.selectedBest.kpis ?? {};
  const evidence = params.selectedBest.evidence ?? {};

  const shortage = Number(kpis.shortageUnits ?? 0);
  const serviceShortfall = Number(kpis.serviceShortfall ?? 0);
  const churn = Number(kpis.planChurn ?? 0);
  const contextPenalty = Number(kpis.contextPenalty ?? 0);

  const dlRisk = typeof params.dlRisk === "number" ? params.dlRisk : 0.5;
  const topologyConfidence = params.topologyConfidence ?? 0.5;

  const evalSteps: string[] = evidence.evalSteps ?? [];

  const hasAssumedSupply =
    evalSteps.some((s) => s.includes("assumed_supply")) ||
    contextPenalty > 0.5;

  // ----------------------------------------------------
  // SCORE (0 → 1)
  // ----------------------------------------------------

  let score = 1;

  // ----------------------------------------------------
// DECISION PRESSURE IMPACT (CANONICAL)
// ----------------------------------------------------

let dpPenalty = 0;

if (params.decisionPressure === "HIGH") {
  dpPenalty = 0.25;
} else if (params.decisionPressure === "MEDIUM") {
  dpPenalty = 0.1;
}

score -= dpPenalty;

  if (shortage > 0) score -= 0.4;
  if (serviceShortfall > 0) score -= 0.3;
  if (churn > 5) score -= 0.15;
  if (hasAssumedSupply) score -= 0.15;
  if (topologyConfidence < 0.5) score -= 0.1;
  if (dlRisk > 0.7) score -= 0.1;

  score = Math.max(0, Math.min(1, score));

  // ----------------------------------------------------
  // LEVEL
  // ----------------------------------------------------

  let level: PlanQualityLevel = "HIGH";

  if (score < 0.3) level = "UNUSABLE";
  else if (score < 0.5) level = "LOW";
  else if (score < 0.75) level = "MEDIUM";

  // ----------------------------------------------------
  // REASONS
  // ----------------------------------------------------

  const reasons: string[] = [];

  // ----------------------------------------------------
// DECISION PRESSURE REASON
// ----------------------------------------------------

if (params.decisionPressure === "HIGH") {
  reasons.push("HIGH_DECISION_PRESSURE");
}

  if (shortage > 0) reasons.push("SHORTAGE_PRESENT");
  if (serviceShortfall > 0) reasons.push("SERVICE_NOT_FULL");
  if (churn > 5) reasons.push("HIGH_PLAN_CHURN");
  if (hasAssumedSupply) reasons.push("ASSUMED_SUPPLY");
  if (topologyConfidence < 0.5) reasons.push("LOW_TOPOLOGY_CONFIDENCE");
  if (dlRisk > 0.7) reasons.push("HIGH_RISK");

  return {
    level,
    score: Number(score.toFixed(3)),
    reasons,
  };
}