// core/src/reality/anomaly.classifier.v1.ts
// ======================================================
// PlannerAgent — Anomaly Classifier v1
// Canonical Source of Truth
// ======================================================

import type {
  RealitySnapshot,
  AssumptionRecord,
  BomDivergenceMap
} from "./reality.types";

// ------------------------------------------------------

export type AnomalyType =
  | "PLAN_ISSUE"
  | "PROCESS_ISSUE"
  | "DATA_ISSUE"
  | "MIXED";

export type AnomalyClassification = {
  type: AnomalyType;
  severity: "LOW" | "MEDIUM" | "HIGH";
  reasons: string[];
  confidence: number;
};

// ------------------------------------------------------

export function classifyAnomaly(params: {
  snapshot: RealitySnapshot;
}): AnomalyClassification {

  const { snapshot } = params;

  const divergence = snapshot.bom_divergence?.plan_vs_reality;
  const instability = snapshot.process_instability;
  const assumptions = snapshot.assumptions ?? [];
  const confidence = snapshot.confidence;

  // ------------------------------------------------------

  const divergenceScore = extractDivergenceScore(divergence);
  const instabilityScore = instability?.overall_instability ?? 0;
  const assumptionScore = extractAssumptionScore(assumptions);
  const confidencePenalty = extractLowConfidencePenalty(confidence);

  // ------------------------------------------------------

  let type: AnomalyType = "MIXED";
  const reasons: string[] = [];

  // DATA
  if (assumptionScore > 0.5 || confidencePenalty > 0.5) {
    type = "DATA_ISSUE";
    reasons.push("Low data reliability or missing data");
  }

  // PROCESS
  if (instabilityScore > 0.5 && divergenceScore < 0.4) {
    type = "PROCESS_ISSUE";
    reasons.push("High process variability with low divergence");
  }

  // PLAN
  if (divergenceScore > 0.5 && instabilityScore < 0.4) {
    type = "PLAN_ISSUE";
    reasons.push("High divergence with stable process");
  }

  // MIXED
  if (divergenceScore > 0.5 && instabilityScore > 0.5) {
    type = "MIXED";
    reasons.push("Both plan mismatch and process instability");
  }

  // ------------------------------------------------------

  const severityScore =
    divergenceScore * 0.4 +
    instabilityScore * 0.3 +
    assumptionScore * 0.2 +
    confidencePenalty * 0.1;

  const severity =
    severityScore > 0.7
      ? "HIGH"
      : severityScore > 0.4
      ? "MEDIUM"
      : "LOW";

  const finalConfidence = clamp01(
    1 - (assumptionScore * 0.5 + confidencePenalty * 0.5)
  );

  return {
    type,
    severity,
    reasons,
    confidence: round3(finalConfidence),
  };
}

// ------------------------------------------------------
// FIX IMPORTANTE QUI
// ------------------------------------------------------

function extractDivergenceScore(div?: any) {
  if (!div) return 0;

  const items = div.items ?? div.components ?? [];

  if (!items.length) return 0;

  const avg =
    items.reduce((s: number, c: any) => {
      const delta = Math.abs(c.delta ?? 0);
      return s + delta;
    }, 0) / items.length;

  return clamp01(avg);
}

// ------------------------------------------------------

function extractAssumptionScore(assumptions: AssumptionRecord[]) {
  if (!assumptions.length) return 0;

  return clamp01(
    assumptions.length > 5
      ? 1
      : assumptions.length / 5
  );
}

function extractLowConfidencePenalty(conf: any) {
  if (!conf) return 0;

  const values = Object.values(conf) as number[];

  if (!values.length) return 0;

  const avg =
    values.reduce((s, v) => s + v, 0) / values.length;

  return clamp01(1 - avg);
}

// ------------------------------------------------------

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function round3(x: number) {
  return Math.round(x * 1000) / 1000;
}