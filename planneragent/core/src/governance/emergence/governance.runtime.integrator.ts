// core/src/governance/emergence/governance.runtime.integrator.ts
// ============================================================
// PlannerAgent — Governance Runtime Integrator V1
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Integrate governance emergence, cognitive observability,
// longitudinal memory, and review recommendation into one
// runtime governance state.
//
// This layer DOES NOT:
// - activate authority
// - approve execution
// - mutate delegation scope
// - certify AI usage
// - allocate budget
// - modify policy
//
// It DOES:
// - integrate governance emergence result
// - integrate cognitive governance bridge result
// - integrate review recommendation
// - expose runtime governance state
// - classify governance pressure posture
// - provide cockpit/narrative/trace-ready governance state
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Runtime governance state may reveal pressure.
// It never activates authority.
//
// ============================================================

import type {
  AuthorityLevel,
  GovernancePressure,
  GovernanceTrustDomains,
  GovernanceMaturity,
  GovernanceEmergenceResult,
} from "./governance.emergence.engine";

import type {
  GovernanceReviewRecommendation,
  GovernanceReviewDomain,
  GovernanceReviewSeverity,
} from "./governance.review.engine";

import type {
  CognitiveGovernanceBridgeResult,
} from "../../cognitive-observability/cognitive.governance.bridge";

// ============================================================
// RUNTIME GOVERNANCE POSTURE
// ============================================================

export type GovernanceRuntimePosture =
  | "QUIET"
  | "OBSERVING"
  | "PRESSURE_EMERGING"
  | "REVIEW_RECOMMENDED"
  | "CONSTITUTIONAL_REVIEW_REQUIRED";

// ============================================================
// RUNTIME GOVERNANCE STATE
// ============================================================

export interface GovernanceRuntimeState {

  currentAuthority:
    AuthorityLevel;

  posture:
    GovernanceRuntimePosture;

  dominantPressure:
    GovernancePressure;

  governanceRelevant:
    boolean;

  humanReviewRequired:
    boolean;

  reviewDomain:
    GovernanceReviewDomain;

  reviewSeverity:
    GovernanceReviewSeverity;

  recommendedAuthority?:
    AuthorityLevel;

  activationAllowed:
    false;

  activationAlwaysHuman:
    true;

  trustDomains:
    GovernanceTrustDomains;

  maturity:
    GovernanceMaturity;

  constitutionalRisk:
    "NONE"
    | "LOW"
    | "MEDIUM"
    | "HIGH";

  cognitiveGovernanceRelevant:
    boolean;

  operationalAiDependency:
    boolean;

  shadowAiPersistence:
    boolean;

  governanceConfidence:
    number;

  reasons:
    string[];

  summary:
    string[];
}

// ============================================================
// MAIN INTEGRATOR
// ============================================================

export function integrateGovernanceRuntime(params: {

  emergence:
    GovernanceEmergenceResult;

  cognitiveBridge?:
    CognitiveGovernanceBridgeResult | null;

  review?:
    GovernanceReviewRecommendation | null;

}): GovernanceRuntimeState {

  const {
    emergence,
    cognitiveBridge,
    review,
  } = params;

  const resolvedReview =
    review ??
    emergence.review ??
    null;

  const constitutionalRisk =
    resolveConstitutionalRisk(
      cognitiveBridge,
      emergence
    );

  const humanReviewRequired =
    resolvedReview?.recommended === true ||
    emergence.pressures.some(
      (p) => p.activationRequired
    );

  const governanceRelevant =
    emergence.pressures.length > 0 ||
    cognitiveBridge?.governanceRelevant === true ||
    humanReviewRequired;

  const posture =
    resolveRuntimePosture({
      governanceRelevant,
      humanReviewRequired,
      constitutionalRisk,
      review: resolvedReview,
      dominantPressure: emergence.dominantPressure,
    });

  const reasons =
    buildReasons(
      emergence,
      cognitiveBridge,
      resolvedReview
    );

  return {

    currentAuthority:
      emergence.currentAuthority,

    posture,

    dominantPressure:
      emergence.dominantPressure,

    governanceRelevant,

    humanReviewRequired,

    reviewDomain:
      resolvedReview?.reviewDomain ?? "NONE",

    reviewSeverity:
      resolvedReview?.severity ?? "LOW",

    recommendedAuthority:
      resolvedReview?.recommendedAuthority,

    activationAllowed:
      false,

    activationAlwaysHuman:
      true,

    trustDomains:
      emergence.trustDomains,

    maturity:
      emergence.maturity,

    constitutionalRisk,

    cognitiveGovernanceRelevant:
      cognitiveBridge?.governanceRelevant === true,

    operationalAiDependency:
      cognitiveBridge?.operationalAiDependency === true,

    shadowAiPersistence:
      cognitiveBridge?.shadowAiPersistence === true,

    governanceConfidence:
      emergence.governanceConfidence,

    reasons,

    summary:
      buildRuntimeSummary({
        posture,
        emergence,
        cognitiveBridge,
        review: resolvedReview,
        constitutionalRisk,
      }),
  };
}

// ============================================================
// POSTURE RESOLUTION
// ============================================================

function resolveRuntimePosture(params: {

  governanceRelevant:
    boolean;

  humanReviewRequired:
    boolean;

  constitutionalRisk:
    "NONE" | "LOW" | "MEDIUM" | "HIGH";

  review:
    GovernanceReviewRecommendation | null;

  dominantPressure:
    GovernancePressure;

}): GovernanceRuntimePosture {

  const {
    governanceRelevant,
    humanReviewRequired,
    constitutionalRisk,
    review,
    dominantPressure,
  } = params;

  if (
    review?.reviewDomain === "CHARTER_REVIEW" ||
    constitutionalRisk === "HIGH" ||
    dominantPressure === "CONSTITUTIONAL_PRESSURE"
  ) {
    return "CONSTITUTIONAL_REVIEW_REQUIRED";
  }

  if (
    review?.recommended ||
    humanReviewRequired
  ) {
    return "REVIEW_RECOMMENDED";
  }

  if (
    governanceRelevant
  ) {
    return "PRESSURE_EMERGING";
  }

  return "OBSERVING";
}

// ============================================================
// CONSTITUTIONAL RISK
// ============================================================

function resolveConstitutionalRisk(
  cognitiveBridge:
    CognitiveGovernanceBridgeResult | null | undefined,

  emergence:
    GovernanceEmergenceResult
): "NONE" | "LOW" | "MEDIUM" | "HIGH" {

  if (
    cognitiveBridge?.constitutionalRisk === "HIGH" ||
    emergence.dominantPressure === "CONSTITUTIONAL_PRESSURE" ||
    emergence.maturity.structural
  ) {
    return "HIGH";
  }

  if (
    cognitiveBridge?.constitutionalRisk === "MEDIUM" ||
    emergence.maturity.stable
  ) {
    return "MEDIUM";
  }

  if (
    cognitiveBridge?.constitutionalRisk === "LOW" ||
    emergence.maturity.emerging
  ) {
    return "LOW";
  }

  return "NONE";
}

// ============================================================
// REASONS
// ============================================================

function buildReasons(
  emergence:
    GovernanceEmergenceResult,

  cognitiveBridge:
    CognitiveGovernanceBridgeResult | null | undefined,

  review:
    GovernanceReviewRecommendation | null
): string[] {

  const reasons: string[] = [];

  for (const pressure of emergence.pressures) {
    reasons.push(
      ...pressure.reasons
    );
  }

  if (cognitiveBridge?.summary?.length) {
    reasons.push(
      ...cognitiveBridge.summary
    );
  }

  if (review?.reasons?.length) {
    reasons.push(
      ...review.reasons
    );
  }

  return Array.from(
    new Set(reasons)
  );
}

// ============================================================
// SUMMARY
// ============================================================

function buildRuntimeSummary(params: {

  posture:
    GovernanceRuntimePosture;

  emergence:
    GovernanceEmergenceResult;

  cognitiveBridge?:
    CognitiveGovernanceBridgeResult | null;

  review:
    GovernanceReviewRecommendation | null;

  constitutionalRisk:
    "NONE" | "LOW" | "MEDIUM" | "HIGH";

}): string[] {

  const {
    posture,
    emergence,
    cognitiveBridge,
    review,
    constitutionalRisk,
  } = params;

  const summary: string[] = [];

  summary.push(
    `posture:${posture}`
  );

  summary.push(
    `dominant_pressure:${emergence.dominantPressure}`
  );

  summary.push(
    `constitutional_risk:${constitutionalRisk}`
  );

  summary.push(
    `governance_confidence:${emergence.governanceConfidence}`
  );

  if (emergence.maturity.emerging) {
    summary.push(
      "maturity:emerging"
    );
  }

  if (emergence.maturity.stable) {
    summary.push(
      "maturity:stable"
    );
  }

  if (emergence.maturity.structural) {
    summary.push(
      "maturity:structural"
    );
  }

  if (cognitiveBridge?.governanceRelevant) {
    summary.push(
      "cognitive_governance:relevant"
    );
  }

  if (cognitiveBridge?.operationalAiDependency) {
    summary.push(
      "operational_ai_dependency:detected"
    );
  }

  if (cognitiveBridge?.shadowAiPersistence) {
    summary.push(
      "shadow_ai:persistent"
    );
  }

  if (review?.recommended) {
    summary.push(
      `review:${review.reviewDomain}`
    );
  }

  summary.push(
    "activation:human_only"
  );

  return summary;
}
