// core/src/reality/reality.score.ts
// ======================================================
// PlannerAgent — Reality Score Engine
// Canonical Source of Truth
// ======================================================

import type {
  DataAwarenessLevel,
  ConfidenceMap,
  AssumptionRecord,
  BomDivergenceMap,
} from "./reality.types";

// ------------------------------------------------------
// HELPERS
// ------------------------------------------------------

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

// ------------------------------------------------------
// MAIN
// ------------------------------------------------------

export function computeRealityScore(params: {
  awareness_level: DataAwarenessLevel;
  confidence: ConfidenceMap;
  assumptions: AssumptionRecord[];
  bom_divergence: BomDivergenceMap;
  topology_confidence?: number;
}): number {
  // -------------------------------
  // 1. Awareness score
  // -------------------------------
  const awarenessScoreMap: Record<DataAwarenessLevel, number> = {
    0: 0.2,
    1: 0.4,
    2: 0.7,
    3: 1,
  };

  const awarenessScore = awarenessScoreMap[params.awareness_level];

  // -------------------------------
  // 2. Confidence score
  // -------------------------------
  const confidenceValues = Object.values(params.confidence ?? {});
  const confidenceScore =
    confidenceValues.length > 0
      ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length
      : 0.5;

  // -------------------------------
  // 3. Assumptions penalty
  // -------------------------------
  const assumptionPenalty = (params.assumptions?.length ?? 0) * 0.05;
  const assumptionScore = clamp01(1 - assumptionPenalty);

  // -------------------------------
  // 4. BOM divergence (AWARENESS-AWARE)
  // -------------------------------
  let divergencePenalty = 0;

  if (params.awareness_level >= 2) {
    // BEHAVIORAL / STRUCTURAL

    if (params.bom_divergence.master_vs_plan) {
      divergencePenalty += 0.15;
    }

    const d = params.bom_divergence.plan_vs_reality;
    if (d?.has_divergence) {
      divergencePenalty += d.severity * 0.35;
    }

    if (params.bom_divergence.master_vs_reality) {
      divergencePenalty += 0.2;
    }
  } else {
    // SNAPSHOT

    const d = params.bom_divergence.plan_vs_reality;
    if (d?.has_divergence) {
      divergencePenalty += d.severity * 0.15;
    }
  }

  const divergenceScore = 1 - clamp01(divergencePenalty);

  // -------------------------------
  // 5. Topology penalty (placeholder)
  // -------------------------------
  let topologyScore = 1;

  if (typeof params.topology_confidence === "number") {
    if (params.topology_confidence < 0.5) topologyScore = 0.8;
    else if (params.topology_confidence < 0.7) topologyScore = 0.9;
  }

  // -------------------------------
  // 6. Final score
  // -------------------------------
  const finalScore =
    0.25 * awarenessScore +
    0.25 * confidenceScore +
    0.2 * assumptionScore +
    0.2 * divergenceScore +
    0.1 * topologyScore;

  return Number(clamp01(finalScore).toFixed(3));
}