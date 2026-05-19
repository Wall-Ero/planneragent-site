// core/src/governance/emergence/governance.review.engine.ts
// ============================================================
// PlannerAgent — Governance Review Engine V1
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Evaluate whether observed governance emergence patterns
// justify formal human governance review.
//
// This engine DOES NOT:
// - activate authority
// - expand authority
// - mutate delegation scope
// - approve execution
// - modify runtime governance
// - rewrite constitutional policy
//
// It DOES:
// - evaluate governance maturity
// - evaluate longitudinal governance stability
// - detect recurring governance pressure
// - detect constitutional governance risk
// - recommend formal human governance review
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Governance review may be recommended by runtime evidence.
//
// Governance activation always remains human-controlled.
//
// ============================================================

import type {
  AuthorityLevel,
  GovernancePressure,
} from "./governance.emergence.engine";

import type {
  GovernanceEmergenceTimeline,
} from "./governance.emergence.memory";

// ============================================================
// REVIEW DOMAIN
// ============================================================

export type GovernanceReviewDomain =
  | "NONE"
  | "GRADUATE_REVIEW"
  | "JUNIOR_REVIEW"
  | "SENIOR_REVIEW"
  | "PRINCIPAL_REVIEW"
  | "CHARTER_REVIEW";

// ============================================================
// REVIEW SEVERITY
// ============================================================

export type GovernanceReviewSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

// ============================================================
// REVIEW RECOMMENDATION
// ============================================================

export interface GovernanceReviewRecommendation {
  recommended: boolean;

  reviewDomain: GovernanceReviewDomain;

  severity: GovernanceReviewSeverity;

  currentAuthority: AuthorityLevel;

  recommendedAuthority?: AuthorityLevel;

  reasons: string[];

  summary: string;

  humanReviewRequired: true;

  constitutionalBoundary: boolean;
}

// ============================================================
// MAIN ENGINE
// ============================================================

export function evaluateGovernanceReview(params: {
  currentAuthority: AuthorityLevel;
  timeline: GovernanceEmergenceTimeline;
}): GovernanceReviewRecommendation {

  const {
    currentAuthority,
    timeline,
  } = params;

  // ----------------------------------------------------------
  // CHARTER / CONSTITUTIONAL PRESSURE
  // ----------------------------------------------------------

  if (timeline.constitutionalPressureDetected) {

    return {
      recommended: true,

      reviewDomain: "CHARTER_REVIEW",

      severity: "CRITICAL",

      currentAuthority,

      recommendedAuthority: "CHARTER",

      reasons: [
        "constitutional_pressure_detected",
        "governance_boundary_review_required",
      ],

      summary:
        "Observed governance pressure suggests that constitutional authority boundaries may require formal review.",

      humanReviewRequired: true,

      constitutionalBoundary: true,
    };
  }

  // ----------------------------------------------------------
  // PRINCIPAL REVIEW
  // ----------------------------------------------------------

  if (
    currentAuthority === "SENIOR" &&
    timeline.stableDelegationDetected &&
    timeline.governanceConfidenceTrend === "INCREASING"
  ) {

    return {
      recommended: true,

      reviewDomain: "PRINCIPAL_REVIEW",

      severity: "HIGH",

      currentAuthority,

      recommendedAuthority: "PRINCIPAL",

      reasons: [
        "stable_delegation_detected",
        "governance_confidence_increasing",
        "longitudinal_operational_stability_detected",
      ],

      summary:
        "Observed delegated process stewardship appears operationally stable across multiple governance cycles. Improvement authority review may be appropriate.",

      humanReviewRequired: true,

      constitutionalBoundary: false,
    };
  }

  // ----------------------------------------------------------
  // SENIOR REVIEW
  // ----------------------------------------------------------

  if (
    currentAuthority === "JUNIOR" &&
    timeline.stableDelegationDetected
  ) {

    return {
      recommended: true,

      reviewDomain: "SENIOR_REVIEW",

      severity: "HIGH",

      currentAuthority,

      recommendedAuthority: "SENIOR",

      reasons: [
        "delegation_pressure_stable",
        "workflow_consistency_detected",
        "recurring_operational_stewardship_detected",
      ],

      summary:
        "Observed operational stewardship patterns suggest that delegated workflow governance may warrant formal SENIOR review.",

      humanReviewRequired: true,

      constitutionalBoundary: false,
    };
  }

  // ----------------------------------------------------------
  // JUNIOR REVIEW
  // ----------------------------------------------------------

  if (
    currentAuthority === "VISION" &&
    hasRecurringPressure(
      timeline,
      "ADVISORY_PRESSURE"
    )
  ) {

    return {
      recommended: true,

      reviewDomain: "JUNIOR_REVIEW",

      severity: "MEDIUM",

      currentAuthority,

      recommendedAuthority: "JUNIOR",

      reasons: [
        "recurring_advisory_pressure_detected",
        "operational_guidance_patterns_observed",
      ],

      summary:
        "Observed operational advisory pressure suggests that structured human-approved advisory review may be appropriate.",

      humanReviewRequired: true,

      constitutionalBoundary: false,
    };
  }

  // ----------------------------------------------------------
  // GRADUATE REVIEW
  // ----------------------------------------------------------

  if (
    currentAuthority === "VISION" &&
    hasRecurringPressure(
      timeline,
      "AI_GOVERNANCE_PRESSURE"
    )
  ) {

    return {
      recommended: true,

      reviewDomain: "GRADUATE_REVIEW",

      severity: "MEDIUM",

      currentAuthority,

      recommendedAuthority: "GRADUATE",

      reasons: [
        "recurring_ai_governance_pressure_detected",
        "ungoverned_ai_usage_patterns_observed",
      ],

      summary:
        "Observed AI-assisted operational behavior suggests that governed human AI usage review may be appropriate.",

      humanReviewRequired: true,

      constitutionalBoundary: false,
    };
  }

  // ----------------------------------------------------------
  // NO REVIEW
  // ----------------------------------------------------------

  return {
    recommended: false,

    reviewDomain: "NONE",

    severity: "LOW",

    currentAuthority,

    reasons: [
      "no_stable_governance_review_conditions_detected",
    ],

    summary:
      "No formal governance review is currently recommended.",

    humanReviewRequired: true,

    constitutionalBoundary: false,
  };
}

// ============================================================
// HELPERS
// ============================================================

function hasRecurringPressure(
  timeline: GovernanceEmergenceTimeline,
  pressure: GovernancePressure
): boolean {

  return (
    timeline.recurringPressures.includes(
      pressure
    )
  );
}