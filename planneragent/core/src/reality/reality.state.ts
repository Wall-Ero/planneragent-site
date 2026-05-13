// core/src/reality/reality.state.ts
// ======================================================
// PlannerAgent — Reality Stability State Engine v1
// Canonical Source of Truth
// ======================================================
//
// PURPOSE
// ------------------------------------------------------
// Determine the intrinsic operational stability
// of observed reality independently from:
//
// - planning quality
// - execution authority
// - governance posture
// - optimizer output
//
// This layer answers:
//
// "How stable is operational reality itself?"
//
// NOT:
//
// "Is the plan correct?"
// "Should execution happen?"
// "Is governance aligned?"
//
// ------------------------------------------------------
// REALITY STATES
// ------------------------------------------------------
//
// ASSUMED
// Reality cannot be sufficiently trusted.
// Heavy reconstruction / low confidence.
//
// STABLE
// Reality behaves coherently over time.
//
// SHIFTING
// Reality is progressively diverging from
// expected operational behavior.
//
// UNSTABLE
// Reality behavior is volatile or inconsistent.
//
// ======================================================

import type {
  BomDivergenceMap,
  ProcessInstabilitySignal,
  AssumptionRecord,
} from "./reality.types";

import type {
  ReconciliationResult,
} from "./reconciliation.adapter";

// ======================================================
// TYPES
// ======================================================

export type RealityStabilityState =
  | "STABLE"
  | "SHIFTING"
  | "UNSTABLE"
  | "ASSUMED";

export type BuildRealityStateInput = {

  // ---------------------------------------------------
  // Epistemic quality
  // ---------------------------------------------------

  realityScore?: number | null;

  topologyConfidence?: number;

  assumptions?: AssumptionRecord[];

  // ---------------------------------------------------
  // Behavioral instability
  // ---------------------------------------------------

  processInstability?: ProcessInstabilitySignal;

  // ---------------------------------------------------
  // Structural divergence
  // ---------------------------------------------------

  bomDivergence?: BomDivergenceMap;

  // ---------------------------------------------------
  // Reconciliation
  // ---------------------------------------------------

  reconciliation?: ReconciliationResult | null;
};

export type RealityStateEvidence = {

  realityState: RealityStabilityState;

  confidence: number;

  reasons: string[];

  metrics: {

    realityScore: number | null;

    instability: number;

    divergenceSeverity: number;

    assumptions: number;

    topologyConfidence: number | null;

    reconciliationMismatch: number;
  };
};

// ======================================================
// MAIN
// ======================================================

export function deriveRealityState(
  input: BuildRealityStateInput
): RealityStateEvidence {

  const reasons: string[] = [];

  // ---------------------------------------------------
  // NORMALIZATION
  // ---------------------------------------------------

  const realityScore =
    typeof input.realityScore === "number"
      ? clamp01(input.realityScore)
      : null;

  const topologyConfidence =
    typeof input.topologyConfidence === "number"
      ? clamp01(input.topologyConfidence)
      : null;

  const assumptions =
    input.assumptions?.length ?? 0;

  const instability =
    clamp01(
      input.processInstability?.overall_instability ?? 0
    );

  const divergenceSeverity =
    clamp01(
      input.bomDivergence
        ?.plan_vs_reality
        ?.severity ?? 0
    );

  const reconciliationMismatch =
    input.reconciliation?.majorMismatchCount ?? 0;

  // ====================================================
  // ASSUMED
  // ====================================================

  const lowRealityScore =
    realityScore !== null
    && realityScore < 0.5;

  const weakTopology =
    topologyConfidence !== null
    && topologyConfidence < 0.5;

  const assumptionHeavy =
    assumptions >= 3;

  if (
    lowRealityScore
    || weakTopology
    || assumptionHeavy
  ) {

    if (lowRealityScore) {
      reasons.push(
        "reality_score_below_threshold"
      );
    }

    if (weakTopology) {
      reasons.push(
        "weak_topology_confidence"
      );
    }

    if (assumptionHeavy) {
      reasons.push(
        "high_assumption_dependency"
      );
    }

    return build(
      "ASSUMED",
      0.45,
      reasons,
      {
        realityScore,
        instability,
        divergenceSeverity,
        assumptions,
        topologyConfidence,
        reconciliationMismatch,
      }
    );
  }

  // ====================================================
  // UNSTABLE
  // ====================================================

  const severeInstability =
    instability >= 0.7;

  const severeDivergence =
    divergenceSeverity >= 0.7;

  const blockingMismatch =
    reconciliationMismatch > 0;

  if (
    severeInstability
    || severeDivergence
    || blockingMismatch
  ) {

    if (severeInstability) {
      reasons.push(
        "high_process_instability"
      );
    }

    if (severeDivergence) {
      reasons.push(
        "severe_plan_reality_divergence"
      );
    }

    if (blockingMismatch) {
      reasons.push(
        "blocking_inventory_mismatch"
      );
    }

    return build(
      "UNSTABLE",
      0.85,
      reasons,
      {
        realityScore,
        instability,
        divergenceSeverity,
        assumptions,
        topologyConfidence,
        reconciliationMismatch,
      }
    );
  }

  // ====================================================
  // SHIFTING
  // ====================================================

  const moderateInstability =
    instability >= 0.35;

  const moderateDivergence =
    divergenceSeverity >= 0.35;

  const moderateMismatch =
    (input.reconciliation?.mismatchCount ?? 0) > 0;

  if (
    moderateInstability
    || moderateDivergence
    || moderateMismatch
  ) {

    if (moderateInstability) {
      reasons.push(
        "moderate_process_instability"
      );
    }

    if (moderateDivergence) {
      reasons.push(
        "moderate_plan_reality_divergence"
      );
    }

    if (moderateMismatch) {
      reasons.push(
        "inventory_reconciliation_drift"
      );
    }

    return build(
      "SHIFTING",
      0.72,
      reasons,
      {
        realityScore,
        instability,
        divergenceSeverity,
        assumptions,
        topologyConfidence,
        reconciliationMismatch,
      }
    );
  }

  // ====================================================
  // STABLE
  // ====================================================

  reasons.push(
    "reality_behavior_consistent"
  );

  return build(
    "STABLE",
    0.92,
    reasons,
    {
      realityScore,
      instability,
      divergenceSeverity,
      assumptions,
      topologyConfidence,
      reconciliationMismatch,
    }
  );
}

// ======================================================
// HELPERS
// ======================================================

function build(
  realityState: RealityStabilityState,
  confidence: number,
  reasons: string[],
  metrics: RealityStateEvidence["metrics"]
): RealityStateEvidence {

  return {
    realityState,
    confidence: round3(confidence),
    reasons,
    metrics,
  };
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function round3(x: number): number {
  return Math.round(x * 1000) / 1000;
}